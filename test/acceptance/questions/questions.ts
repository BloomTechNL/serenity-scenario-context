import { Question } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
import { UseSupportDeskApi } from '../UseSupportDeskApi';
import { Ticket, TicketPriority, TicketStatus } from '../interactions/Raise';

export interface TicketSnapshot {
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
}

/**
 * Reads a ticket straight from the system under test - proof that whatever
 * happened to it (being raised, resolved, ...) changed more than just the
 * actor's own notes. The system only knows tickets by the id it assigned
 * them, not by a human-readable label - so this first recalls the actor's
 * own notes (the scenario context) to translate `label` into that real id,
 * the same way a real client would keep its own mapping from a friendly
 * name to whatever opaque id a backend hands out.
 *
 * With a `label`, looks up whichever ticket is qualified by it; without
 * one, whichever is currently "in the spotlight" instead - the same choice
 * `resolveTicket` offers, and for the same reason. Either way,
 * `findLastUsed` is used rather than `findOne`: resolving a ticket re-tags
 * it rather than replacing it, so more than one piece may by now be
 * qualified by the same label.
 *
 * A real `Question`, like anywhere else in Serenity/JS: the actor asking it
 * is supplied by whatever resolves it - `Ensure.that`, in this spec - not
 * passed in here directly.
 */
export function ticket(label?: string) {
    const description = label ? `ticket labelled ${ label }` : 'the ticket in the spotlight';

    return Question.about(description, actor => {
        const searcher = UseScenarioContext.as(actor).withType(Ticket);

        const found = label
            ? searcher.withQualifiers(label).findLastUsed()
            : searcher.findLastUsed();

        const representation = UseSupportDeskApi.as(actor).get<TicketRepresentation>(`/tickets/${ found.id }`);

        return {
            subject: representation.subject,
            priority: representation.priority,
            status: representation.status,
        };
    });
}
