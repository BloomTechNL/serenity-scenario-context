import { UsesAbilities } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { TicketRepresentation } from '../../../../system-under-test';
import { UseSupportDeskApi } from '../UseSupportDeskApi';
import { Ticket } from '../interactions/Raise';

/**
 * A label may end up qualifying more than one piece over the course of a
 * scenario (see `resolveTicket`, which re-tags a ticket rather than
 * replacing it), so this asks for whichever was used most recently.
 */
export function ticketIdentifiedBy(actor: UsesAbilities, label: string): Ticket {
    return UseScenarioContext.as(actor).withType(Ticket).withQualifiers(label).findLastUsed();
}

/**
 * Reads straight from the system under test rather than the scenario
 * context, to confirm that resolving a ticket changed more than just the
 * actor's own notes. The system only knows tickets by the id it assigned
 * them, not by `label` - so this first recalls the actor's own notes to
 * translate the human-readable `label` into that real id, the same way a
 * real client would keep its own mapping from a friendly name to whatever
 * opaque id a backend hands out. `findLastUsed` is used for that lookup,
 * same as `ticketIdentifiedBy` above and for the same reason: resolving a
 * ticket re-tags it rather than replacing it, so more than one piece may by
 * now be qualified by this `label`.
 */
export function ticketAsKnownToTheSystem(actor: UsesAbilities, label: string): Ticket {
    const ticket = UseScenarioContext.as(actor).withType(Ticket).withQualifiers(label).findLastUsed();
    const representation = UseSupportDeskApi.as(actor).get<TicketRepresentation>(`/tickets/${ ticket.id }`);

    return Ticket.fromRepresentation(representation, label);
}
