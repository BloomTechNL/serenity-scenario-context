import { Actor, actorCalled } from '@serenity-js/core';
import { Ensure, equals } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/raise-ticket';
import { expectedTicket } from './questions/ticket';
import { numberOfTicketsFound } from './questions/number-of-tickets-found';
import { SupportDeskCast } from './cast';

describe('A support agent searching for tickets by subject', () => {
    let morgan: Actor;

    beforeEach(() => {
        const cast = new SupportDeskCast();
        morgan = cast.prepare(actorCalled('Morgan'));
    });

    it('finds a raised ticket by searching for part of its subject', async () => {
        await morgan.attemptsTo(
            Ensure.that(
                numberOfTicketsFound({searchTerm: 'ticket'}),
                equals(0),
            ),
        );
    });

    it('finds a raised ticket by searching for part of its subject', async () => {
        await morgan.attemptsTo(
            raiseTicket(),
        );

        await morgan.attemptsTo(
            Ensure.that(
                numberOfTicketsFound({searchTerm: expectedTicket().subject}),
                equals(1),
            ),
        );
    });
});
