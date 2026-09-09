import { actorCalled, engage } from '@serenity-js/core';
import { Ensure, equals } from '@serenity-js/assertions';

import { Customer } from './domain/Customer';
import { Ticket } from './domain/Ticket';
import { Focus } from './interactions/Focus';
import { Raise } from './interactions/Raise';
import { Resolve } from './interactions/Resolve';
import { TheCustomerInTheSpotlight, TheTicket, TheTicketInTheSpotlight } from './questions/questions';
import { SupportDeskActors } from './Actors';

/**
 * These acceptance tests double up as a worked example of the
 * `UseScenarioContext` ability, exercised the way it's meant to be used:
 * through a Serenity/JS actor, in a fake "support desk" domain where an
 * agent juggles several customer tickets within one scenario.
 */
describe('A support agent using the scenario context', () => {

    beforeEach(() => engage(new SupportDeskActors()));

    it('keeps the most recently raised ticket in the spotlight', async () => {
        const billing  = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login     = new Ticket('TICKET-2', 'Cannot log in', 'urgent');
        const feature   = new Ticket('TICKET-3', 'Please add dark mode');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),
            Raise.aTicket(feature),

            Ensure.that(TheTicketInTheSpotlight(), equals(feature)),
        );
    });

    it('lets the agent switch their attention back to an earlier ticket', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),           // login is now in the spotlight

            Focus.onTheTicket('TICKET-1'),  // explicitly recall billing...

            Ensure.that(TheTicketInTheSpotlight(), equals(billing)),  // ...it's back in the spotlight
        );
    });

    it('resolves whichever ticket is currently in the spotlight', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),

            Focus.onTheTicket('TICKET-1'),
            Resolve.theTicketInTheSpotlight(),

            Ensure.that(TheTicket.identifiedBy('TICKET-1'), equals(billing)),
        );

        expect(billing.status).toEqual('resolved');
        expect(login.status).toEqual('open');
    });

    it('finds a ticket by a qualifier other than its id, regardless of where it sits in the context', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');
        const feature  = new Ticket('TICKET-3', 'Please add dark mode');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),    // the only ticket qualified 'urgent'
            Raise.aTicket(feature),  // now on top, but not urgent

            Ensure.that(TheTicket.thatIsUrgent(), equals(login)),

            // finding it also brought it back into the spotlight
            Ensure.that(TheTicketInTheSpotlight(), equals(login)),
        );
    });

    it('tells apart different types of context pieces, even without qualifiers', async () => {
        const login = new Ticket('TICKET-2', 'Cannot log in', 'urgent');
        const bob    = new Customer('Bob');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(login),
            Raise.aCustomer(bob),  // bob is now on top of the context

            // a search for a Ticket isn't confused by the Customer on top
            Ensure.that(TheTicketInTheSpotlight(), equals(login)),
            Ensure.that(TheCustomerInTheSpotlight(), equals(bob)),
        );
    });

    it('keeps each actor’s scenario context separate from every other actor’s', async () => {
        const alicesTicket = new Ticket('TICKET-1', 'Invoice looks wrong');
        const bobsTicket    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Alice').attemptsTo(
            Raise.aTicket(alicesTicket),
        );

        await actorCalled('Bob').attemptsTo(
            Raise.aTicket(bobsTicket),

            Ensure.that(TheTicketInTheSpotlight(), equals(bobsTicket)),
        );

        await actorCalled('Alice').attemptsTo(
            Ensure.that(TheTicketInTheSpotlight(), equals(alicesTicket)),
        );
    });

    it('complains when no ticket matches the requested qualifiers', async () => {
        await expect(
            actorCalled('Alice').attemptsTo(
                Raise.aTicket(new Ticket('TICKET-1', 'Invoice looks wrong')),

                Focus.onTheTicket('TICKET-404'),
            )
        ).rejects.toThrow('Could not find Ticket qualified by TICKET-404 in the scenario context');
    });
});
