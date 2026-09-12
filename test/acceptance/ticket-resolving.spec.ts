import { Actor, actorCalled } from '@serenity-js/core';
import { Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/RaiseTicket';
import { resolveTicket } from './interactions/ResolveTicket';
import { ticket } from './questions/Ticket';
import { SupportDeskActors } from './Actors';

describe('A support agent using the scenario context', () => {

    let chidi = actorCalled('Chidi');

    beforeEach(() => {
        new SupportDeskActors().prepare(chidi);
    });

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        await chidi.attemptsTo(
            raiseTicket({ label: 'billing' }),
            raiseTicket({ label: 'login' }),

            resolveTicket('billing'),
        );

        await chidi.attemptsTo(
            Ensure.that(ticket('billing'), property('status', equals('resolved'))),
            Ensure.that(ticket('login'), property('status', equals('open'))),
        );
    });

    it('resolves a ticket by label, leaving an earlier one untouched', async () => {
        await chidi.attemptsTo(
            raiseTicket({ label: 'first-ticket' }),
            raiseTicket({}),

            resolveTicket(),
        );

        await chidi.attemptsTo(
            Ensure.that(ticket(), property('status', equals('resolved'))),
            Ensure.that(ticket('first-ticket'), property('status', equals('open'))),
        );
    });
});
