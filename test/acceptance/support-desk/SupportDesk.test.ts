import { actorCalled, engage } from '@serenity-js/core';
import { and, Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/Raise';
import { resolveTicket } from './interactions/Resolve';
import { ticketAsKnownToTheSystem, ticketIdentifiedBy } from './questions/questions';
import { SupportDeskActors } from './Actors';

/**
 * This acceptance test doubles up as a worked example of the
 * `UseScenarioContext` ability, exercised the way it's meant to be used:
 * through a Serenity/JS actor, in a fake "support desk" domain where an
 * agent juggles several customer tickets within one scenario.
 *
 * `raiseTicket` and `resolveTicket` are real Serenity/JS `Interaction`s,
 * performed via `attemptsTo` like any other; `ticketIdentifiedBy` and
 * `ticketAsKnownToTheSystem` are plain functions instead, called directly
 * once those interactions have completed. `Ticket` - the type that
 * actually gets put on the scenario context - is deliberately never
 * imported here: it's a piece of context, an implementation detail of the
 * interaction/question functions that put it on and read it off it. This
 * spec only ever deals in plain data: the details `raiseTicket` needs to
 * raise a ticket, and the `Ensure`/`property` expectations checked against
 * what the question functions return. Notably, that never includes a
 * ticket's real id - the system under test assigns those (as UUIDs), so
 * this spec only ever refers to a ticket by the human-readable `label` it
 * gave it when raising it, the same way a support agent would say "the
 * billing ticket" rather than recite its id, and never asserts on the id
 * either, since it's not something this spec ever gets to choose.
 *
 * Note: this test uses its own, never-repeated actor name. Serenity/JS
 * keeps actors around for the lifetime of the process and only prepares an
 * actor - i.e. assigns them the abilities granted by the current `engage`d
 * `Cast` - the first time they're referenced; official test runner adapters
 * (Mocha, Jasmine, Cucumber) reset that between scenarios automatically,
 * but this project's plain Jest setup doesn't. Reusing an actor's name
 * across tests would resurrect them with whatever ability (and
 * however-populated a `ScenarioContext`) they were left with previously,
 * rather than a fresh one - which matters a lot once `findOne()` is used,
 * since it fails outright on any unexpected leftover match. Should more
 * tests be added here later, each will need its own actor name for the same
 * reason.
 */
describe('A support agent using the scenario context', () => {

    beforeEach(() => engage(new SupportDeskActors()));

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        const chidi = actorCalled('Chidi');

        await chidi.attemptsTo(
            raiseTicket({ label: 'billing', subject: 'Invoice looks wrong' }),
            raiseTicket({ label: 'login', subject: 'Cannot log in', priority: 'urgent' }),  // login is now the ticket in the spotlight

            resolveTicket('billing'),    // ...but billing gets resolved anyway
        );

        await chidi.attemptsTo(
            // the scenario context remembers the resolved ticket...
            Ensure.that(ticketIdentifiedBy(chidi, 'billing'), and(
                property('subject', equals('Invoice looks wrong')),
                property('priority', equals('normal')),
                property('status', equals('resolved')),
            )),

            // ...and so does the system it was raised against - proof that
            // resolveTicket changed more than just the actor's own notes
            Ensure.that(ticketAsKnownToTheSystem(chidi, 'billing'), and(
                property('subject', equals('Invoice looks wrong')),
                property('priority', equals('normal')),
                property('status', equals('resolved')),
            )),
            Ensure.that(ticketAsKnownToTheSystem(chidi, 'login'), and(
                property('subject', equals('Cannot log in')),
                property('priority', equals('urgent')),
                property('status', equals('open')),
            )),
        );
    });
});
