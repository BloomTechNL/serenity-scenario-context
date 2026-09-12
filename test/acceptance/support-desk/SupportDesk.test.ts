import { actorCalled, engage } from '@serenity-js/core';
import { Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/Raise';
import { resolveTicket } from './interactions/Resolve';
import { ticket } from './questions/questions';
import { SupportDeskActors } from './Actors';

describe('A support agent using the scenario context', () => {

    beforeEach(() => engage(new SupportDeskActors()));

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        const chidi = actorCalled('Chidi');

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
});
