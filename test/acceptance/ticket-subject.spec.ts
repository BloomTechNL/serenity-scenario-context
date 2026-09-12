import {Actor} from '@serenity-js/core';
import { Ensure, equals, property } from '@serenity-js/assertions';

import { raiseTicket } from './interactions/raise-ticket';
import { expectedTicket, ticket } from './questions/ticket';
import { SupportDeskCast } from './cast';

describe('A support agent using the scenario context', () => {
    let priya: Actor;

    beforeEach(() => {
        const cast = new SupportDeskCast();
        priya = cast.prepare(priya);
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
