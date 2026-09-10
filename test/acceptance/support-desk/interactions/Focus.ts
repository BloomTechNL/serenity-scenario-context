import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Ticket } from '../domain/Ticket';

/**
 * A support agent deliberately switches their attention to a specific
 * ticket, identified by its id. `findOne` is used deliberately here: a
 * ticket id is expected to identify exactly one *currently relevant* piece
 * of context, so if more than one somehow matches, that's worth failing
 * loudly about rather than silently guessing. This is also a great example
 * of the "spotlight" behaviour: finding doesn't just read the ticket, it
 * also brings it back on top of the scenario context for whatever the
 * agent does next.
 */
export const Focus = {
    onTheTicket: (id: string) =>
        Interaction.where(`#actor focuses on ticket ${ id }`, actor => {
            UseScenarioContext.as(actor).withType(Ticket).withQualifiers(id).findOne();
        }),
};
