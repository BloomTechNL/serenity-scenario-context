import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { TicketRepresentation } from '../../../../system-under-test';
import { UseSupportDeskApi } from '../UseSupportDeskApi';
import { Ticket } from './Raise';

/**
 * Resolves a ticket - first with the system under test, then by recording
 * the change in the scenario context: a freshly-qualified piece, built from
 * what the system confirmed, goes back on top. The ticket already qualified
 * `'open'` is left further down the context, as a bit of history of what
 * happened during the scenario.
 *
 * With a `label`, resolves whichever ticket is qualified by it - `findOne`
 * is the right tool here, since a label is expected to identify exactly one
 * *currently relevant* ticket, and it's worth failing loudly if that
 * assumption doesn't hold. Without one, resolves whichever ticket is
 * currently "in the spotlight" instead - i.e. the one
 * `withType(Ticket).findLastUsed()` would return - for when the agent just
 * means "the one I'm looking at".
 */
export const resolveTicket = (label?: string) =>
    Interaction.where(
        label ? `#actor resolves the ticket labelled ${ label }` : '#actor resolves the ticket in the spotlight',
        actor => {
            const scenarioContext = UseScenarioContext.as(actor);
            const searcher = scenarioContext.withType(Ticket);

            const ticket = label
                ? searcher.withQualifiers(label).findOne()
                : searcher.findLastUsed();

            const representation = UseSupportDeskApi.as(actor).post<TicketRepresentation>(
                `/tickets/${ ticket.id }/resolve`, undefined, 200,
            );
            const resolved = Ticket.fromRepresentation(representation, ticket.label);

            scenarioContext.add(resolved, resolved.label, 'resolved');
        },
    );
