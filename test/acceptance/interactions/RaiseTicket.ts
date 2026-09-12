import {Interaction} from '@serenity-js/core';

import {UseScenarioContext} from '../../../src/index';
import {TicketRepresentation} from '../system-under-test/index';
import {UseSupportDeskApi} from '../UseSupportDeskApi';
import {TicketContext} from "./TicketContext";

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

export const raiseTicket = (details: {
    label?: string;
    priority?: TicketPriority;
} = {}) => {
    const subject = randomSubject();

    return Interaction.where(`#actor raises a ticket`, actor => {
        const response = UseSupportDeskApi.as(actor).post<TicketRepresentation>('/tickets', {
            subject,
            priority: details.priority,
        });

        const ticketContext = new TicketContext(response.id, subject);
        const qualifiers = details.label ? [details.label] : [];

        UseScenarioContext.as(actor).add(ticketContext, ...qualifiers);
    });
};
