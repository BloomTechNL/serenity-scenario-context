import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Ticket } from '../domain/Ticket';

/**
 * Resolves whichever ticket is currently "in the spotlight" - i.e. the one
 * `withType(Ticket).findLastUsed()` would return - and records the change by
 * putting a freshly-qualified piece back on top of the scenario context.
 * `findLastUsed` is the right tool here: by the time a scenario has raised
 * more than one ticket, there will be several `Ticket` pieces in the
 * context, and "whichever was used most recently" is exactly what "in the
 * spotlight" means. The ticket already qualified `'open'` is left further
 * down the context, as a bit of history of what happened during the
 * scenario.
 */
export const Resolve = {
    theTicketInTheSpotlight: () =>
        Interaction.where('#actor resolves the ticket in the spotlight', actor => {
            const ability = UseScenarioContext.as(actor);

            const ticket = ability.withType(Ticket).findLastUsed();
            ticket.status = 'resolved';

            ability.add(ticket, ticket.id, 'resolved');
        }),
};
