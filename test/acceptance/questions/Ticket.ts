import { Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../UseSupportDeskApi';
import { TicketPriority, TicketStatus } from '../interactions/RaiseTicket';
import {TicketContext} from "../interactions/TicketContext";

export function ticket(label?: string) {
    const description = label ? `ticket labelled ${ label }` : 'the ticket in the spotlight';

    return Question.about(description, actor => {
        const qualifiers = label ? [label] : [];

        const found = UseScenarioContext.as(actor).withType(TicketContext).withQualifiers(...qualifiers).findLastUsed();

        const representation = UseSupportDeskApi.as(actor).get<TicketRepresentation>(`/tickets/${ found.id }`);

        return {
            subject: representation.subject,
            priority: representation.priority,
            status: representation.status,
        };
    });
}
