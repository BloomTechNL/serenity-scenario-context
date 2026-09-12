import {Interaction} from '@serenity-js/core';

import {UseScenarioContext} from '../../../src/index';
import {TicketRepresentation} from '../system-under-test/index';
import {TestIdentificationContext} from '../test-identification-context';
import {UseSupportDeskApi} from '../use-support-desk-api';
import {TicketContext} from "./ticket-context";

export type TicketStatus = 'open' | 'resolved';
export type TicketPriority = 'normal' | 'urgent';

const PLACEHOLDER_SUBJECTS = [
    'Something needs looking into',
    'Please take a look at this',
    'Having some trouble here',
    'This does not seem right',
];

function randomSubject(): string {
    return PLACEHOLDER_SUBJECTS[Math.floor(Math.random() * PLACEHOLDER_SUBJECTS.length)];
}

/**
 * Raises a ticket, defaulting to a random placeholder subject when
 * `details.subject` isn't given.
 *
 * Either way, this scenario's own test id is always appended to the
 * subject - there's no option to opt out of it - which is what lets
 * `numberOfTicketsFound` search this ticket back out without tripping over
 * ones other scenarios left behind in the shared, singleton `SupportDeskApi`.
 */
export const raiseTicket = (details: {
    label?: string;
    priority?: TicketPriority;
    subject?: string;
} = {}) => {
    return Interaction.where(`#actor raises a ticket`, actor => {
        const testId = UseScenarioContext.as(actor).withType(TestIdentificationContext).findOne().id;
        const subject = `${ details.subject ?? randomSubject() } [${ testId }]`;

        const response = UseSupportDeskApi.as(actor).post<TicketRepresentation>('/tickets', {
            subject,
            priority: details.priority,
        });

        const ticketContext = new TicketContext(response.id, subject);
        const qualifiers = details.label ? [details.label] : [];

        UseScenarioContext.as(actor).add(ticketContext, ...qualifiers);
    });
};
