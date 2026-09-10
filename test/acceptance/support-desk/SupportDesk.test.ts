import { actorCalled, engage } from '@serenity-js/core';
import { Ensure, equals } from '@serenity-js/assertions';

import { Customer } from './domain/Customer';
import { EmailAddress } from './domain/EmailAddress';
import { HomeAddress } from './domain/HomeAddress';
import { Ticket } from './domain/Ticket';
import { Focus } from './interactions/Focus';
import { Raise } from './interactions/Raise';
import { Record } from './interactions/Record';
import { Resolve } from './interactions/Resolve';
import {
    TheCustomerInTheSpotlight,
    TheEmailAddressOf,
    TheHomeAddressOf,
    TheTicket,
    TheTicketInTheSpotlight,
} from './questions/questions';
import { SharedDirectoryActors, SupportDeskActors } from './Actors';

/**
 * These acceptance tests double up as a worked example of the
 * `UseScenarioContext` ability, exercised the way it's meant to be used:
 * through a Serenity/JS actor, in a fake "support desk" domain where an
 * agent juggles several customer tickets within one scenario.
 *
 * Note: every test below uses its own, never-repeated actor name. Serenity/
 * JS keeps actors around for the lifetime of the process and only prepares
 * an actor - i.e. assigns them the abilities granted by the current
 * `engage`d `Cast` - the first time they're referenced; official test
 * runner adapters (Mocha, Jasmine, Cucumber) reset that between scenarios
 * automatically, but this project's plain Jest setup doesn't. Reusing an
 * actor's name across tests would resurrect them with whatever ability (and
 * however-populated a `ScenarioContext`) they were left with previously,
 * rather than a fresh one - which matters a lot once `findOne()` is used,
 * since it fails outright on any unexpected leftover match.
 */
describe('A support agent using the scenario context', () => {

    beforeEach(() => engage(new SupportDeskActors()));

    it('keeps the most recently raised ticket in the spotlight', async () => {
        const billing  = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login     = new Ticket('TICKET-2', 'Cannot log in', 'urgent');
        const feature   = new Ticket('TICKET-3', 'Please add dark mode');

        await actorCalled('Amara').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),
            Raise.aTicket(feature),

            Ensure.that(TheTicketInTheSpotlight(), equals(feature)),
        );
    });

    it('lets the agent switch their attention back to an earlier ticket', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Bilal').attemptsTo(
            Raise.aTicket(billing),
            Raise.aTicket(login),           // login is now in the spotlight

            Focus.onTheTicket('TICKET-1'),  // explicitly recall billing...

            Ensure.that(TheTicketInTheSpotlight(), equals(billing)),  // ...it's back in the spotlight
        );
    });

    it('resolves whichever ticket is currently in the spotlight', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');
        const login    = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Chidi').attemptsTo(
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

        await actorCalled('Diana').attemptsTo(
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

        await actorCalled('Ezra').attemptsTo(
            Raise.aTicket(login),
            Raise.aCustomer(bob),  // bob is now on top of the context

            // a search for a Ticket isn't confused by the Customer on top
            Ensure.that(TheTicketInTheSpotlight(), equals(login)),
            Ensure.that(TheCustomerInTheSpotlight(), equals(bob)),
        );
    });

    it('keeps each actor’s scenario context separate from every other actor’s', async () => {
        const faridasTicket = new Ticket('TICKET-1', 'Invoice looks wrong');
        const gabrielsTicket = new Ticket('TICKET-2', 'Cannot log in', 'urgent');

        await actorCalled('Farida').attemptsTo(
            Raise.aTicket(faridasTicket),
        );

        await actorCalled('Gabriel').attemptsTo(
            Raise.aTicket(gabrielsTicket),

            Ensure.that(TheTicketInTheSpotlight(), equals(gabrielsTicket)),
        );

        await actorCalled('Farida').attemptsTo(
            Ensure.that(TheTicketInTheSpotlight(), equals(faridasTicket)),
        );
    });

    it('complains when no ticket matches the requested qualifiers', async () => {
        await expect(
            actorCalled('Hiro').attemptsTo(
                Raise.aTicket(new Ticket('TICKET-1', 'Invoice looks wrong')),

                Focus.onTheTicket('TICKET-404'),
            )
        ).rejects.toThrow('Could not find Ticket qualified by TICKET-404 in the scenario context');
    });

    it('insists on a single match when refocusing by id, complaining if history makes that ambiguous', async () => {
        const billing = new Ticket('TICKET-1', 'Invoice looks wrong');

        await expect(
            actorCalled('Imani').attemptsTo(
                Raise.aTicket(billing),
                Resolve.theTicketInTheSpotlight(),  // re-tags billing, but its original 'TICKET-1'-qualified piece is still there too

                Focus.onTheTicket('TICKET-1'),      // now ambiguous: two pieces are qualified 'TICKET-1'
            )
        ).rejects.toThrow(
            'Found 2 instances of Ticket qualified by TICKET-1 in the scenario context, expected exactly one. '
            + 'Use findLastUsed() instead if the most recently used one will do.'
        );
    });
});

/**
 * A second flavour of the same ability: several actors sharing a single
 * `ScenarioContext` (see `SharedDirectoryActors`), using it as a small
 * contact directory. Both a `HomeAddress` and an `EmailAddress` are stored
 * per actor, told apart purely by qualifying each piece with the name of
 * the actor it belongs to.
 *
 * As above, every actor name here (Priya, Tomasz, Farah) is unique across
 * the whole file - see the note above the first `describe` for why.
 */
describe('Several actors sharing a scenario context as a contact directory', () => {

    beforeEach(() => engage(new SharedDirectoryActors()));

    it('lets an actor look up a colleague’s contact details by name, even though they never recorded them', async () => {
        const priyasHomeAddress  = new HomeAddress('12 Baker Street, London');
        const priyasEmailAddress = new EmailAddress('priya@example.org');
        const tomaszsHomeAddress  = new HomeAddress('221B Baker Street, London');
        const tomaszsEmailAddress = new EmailAddress('tomasz@example.org');

        await actorCalled('Priya').attemptsTo(
            Record.contactDetailsOf('Priya', priyasHomeAddress, priyasEmailAddress),
        );

        await actorCalled('Tomasz').attemptsTo(
            Record.contactDetailsOf('Tomasz', tomaszsHomeAddress, tomaszsEmailAddress),

            // Tomasz can look up Priya's details, qualified by her name...
            Ensure.that(TheHomeAddressOf('Priya'), equals(priyasHomeAddress)),
            Ensure.that(TheEmailAddressOf('Priya'), equals(priyasEmailAddress)),

            // ...as well as his own, even though both are the same type of object
            Ensure.that(TheHomeAddressOf('Tomasz'), equals(tomaszsHomeAddress)),
            Ensure.that(TheEmailAddressOf('Tomasz'), equals(tomaszsEmailAddress)),
        );
    });

    it('complains when nobody by that name has recorded their contact details', async () => {
        await expect(
            actorCalled('Farah').attemptsTo(
                Record.contactDetailsOf(
                    'Farah',
                    new HomeAddress('12 Baker Street, London'),
                    new EmailAddress('farah@example.org'),
                ),

                Ensure.that(TheHomeAddressOf('Carol'), equals(new HomeAddress('unknown'))),
            )
        ).rejects.toThrow('Could not find HomeAddress qualified by Carol in the scenario context');
    });
});
