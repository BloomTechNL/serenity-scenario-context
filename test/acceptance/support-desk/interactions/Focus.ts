import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Ticket } from '../domain/Ticket';

/**
 * A support agent deliberately switches their attention to a specific
 * ticket, identified by its id. This is a great example of the "spotlight"
 * behaviour: `find` doesn't just read the ticket, it also brings it back on
 * top of the scenario context for whatever the agent does next.
 */
export const Focus = {
    onTheTicket: (id: string) =>
        Interaction.where(`#actor focuses on ticket ${ id }`, actor => {
            UseScenarioContext.as(actor).find(Ticket, id);
        }),
};
