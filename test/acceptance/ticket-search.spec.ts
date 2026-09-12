import { Actor, actorCalled } from '@serenity-js/core';
import { Ensure, equals } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/raise-ticket';
import { numberOfTicketsFound } from './questions/number-of-tickets-found';
import { SupportDeskCast } from './cast';

describe('A support agent searching for tickets by subject', () => {
    let morgan: Actor;

    beforeEach(() => {
        const cast = new SupportDeskCast();
        morgan = cast.prepare(actorCalled('Morgan'));
    });

    it('finds no tickets when none have been raised', async () => {
        await morgan.attemptsTo(
            Ensure.that(
                numberOfTicketsFound({ searchTerm: 'ticket' }),
                equals(0),
            ),
        );
    });

    it('finds a raised ticket by searching for part of its subject', async () => {
        await morgan.attemptsTo(
            raiseTicket({ subject: 'The printer is on fire' }),
        );

        await morgan.attemptsTo(
            Ensure.that(
                numberOfTicketsFound({ searchTerm: 'printer' }),
                equals(1),
            ),
        );
    });

    it('tells apart tickets that have different subjects', async () => {
        await morgan.attemptsTo(
            raiseTicket({ subject: 'The printer is on fire' }),
            raiseTicket({ subject: 'Cannot reset my password' }),
        );

        await morgan.attemptsTo(
            Ensure.that(numberOfTicketsFound({ searchTerm: 'printer' }), equals(1)),
            Ensure.that(numberOfTicketsFound({ searchTerm: 'password' }), equals(1)),
        );
    });

    it('counts every ticket matching the same search term', async () => {
        await morgan.attemptsTo(
            raiseTicket({ subject: 'The printer is on fire' }),
            raiseTicket({ subject: 'The printer is out of paper' }),
        );

        await morgan.attemptsTo(
            Ensure.that(
                numberOfTicketsFound({ searchTerm: 'printer' }),
                equals(2),
            ),
        );
    });
});
