import { actorCalled } from '@serenity-js/core';
import { Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/RaiseTicket';
import { expectedTicket, ticket } from './questions/Ticket';
import { SupportDeskCast } from './Actors';

describe('A support agent using the scenario context', () => {

    let priya = actorCalled('Priya');

    beforeEach(() => {
        new SupportDeskCast().prepare(priya);
    });

    it('remembers the subject of a raised ticket, matching what the system under test has on record', async () => {
        await priya.attemptsTo(
            raiseTicket(),
        );

        await priya.attemptsTo(
            Ensure.that(
                ticket().subject,
                equals(expectedTicket().subject),
            ),
        );
    });
});
