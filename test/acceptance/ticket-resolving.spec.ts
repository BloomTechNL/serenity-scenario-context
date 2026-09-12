import { Actor, actorCalled } from '@serenity-js/core';
import { Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/raise-ticket';
import { resolveTicket } from './interactions/resolve-ticket';
import { ticket } from './questions/ticket';
import { setUpAccount } from './tasks/set-up-account';
import { SupportDeskCast } from './cast';

describe('A support agent using the scenario context', () => {
    let chidi: Actor;

    beforeEach(() => {
        const cast = new SupportDeskCast();
        chidi = cast.prepare(actorCalled('Chidi'));
    });

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        await chidi.attemptsTo(
            setUpAccount(),

            raiseTicket(),
        );

        await chidi.attemptsTo(
            Ensure.that(ticket().status, equals('open'))
        );
    });

    it('resolves a ticket by label, even when a later one is in the spotlight', async () => {
        await chidi.attemptsTo(
            setUpAccount(),

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
            setUpAccount(),

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
