import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { Customer } from '../domain/Customer';
import { Ticket } from '../domain/Ticket';

/**
 * A support agent raises a new ticket, which puts it "in the spotlight" -
 * on top of the scenario context - qualified by its id and, if applicable,
 * its priority.
 */
export const Raise = {
    aTicket: (ticket: Ticket) =>
        Interaction.where(`#actor raises ticket ${ ticket.id }: ${ ticket.subject }`, actor => {
            const qualifiers = ticket.priority === 'urgent'
                ? [ ticket.id, 'urgent' ]
                : [ ticket.id ];

            UseScenarioContext.as(actor).add(ticket, ...qualifiers);
        }),

    aCustomer: (customer: Customer) =>
        Interaction.where(`#actor notes down customer ${ customer.name }`, actor => {
            UseScenarioContext.as(actor).add(customer, customer.name);
        }),
};
