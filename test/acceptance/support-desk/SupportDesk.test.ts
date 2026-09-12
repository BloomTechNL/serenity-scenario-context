import { actorCalled, engage } from '@serenity-js/core';
import { Ensure, equals } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/Raise';
import { resolveTicket } from './interactions/Resolve';
import { ticket } from './questions/questions';
import { SupportDeskActors } from './Actors';

describe('A support agent using the scenario context', () => {

    beforeEach(() => engage(new SupportDeskActors()));

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        const chidi = actorCalled('Chidi');

        await chidi.attemptsTo(
            raiseTicket({ label: 'billing', subject: 'Invoice looks wrong' }),
            raiseTicket({ label: 'login', subject: 'Cannot log in', priority: 'urgent' }),

            resolveTicket('billing'),
        );

        await chidi.attemptsTo(
            Ensure.that(ticket(chidi, 'billing'), equals({ subject: 'Invoice looks wrong', priority: 'normal', status: 'resolved' })),
            Ensure.that(ticket(chidi, 'login'), equals({ subject: 'Cannot log in', priority: 'urgent', status: 'open' })),
        );
    });
});
