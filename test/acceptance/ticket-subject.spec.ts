import {Actor, actorCalled} from '@serenity-js/core';
import { Ensure, equals, not, property } from '@serenity-js/assertions';

import { changeTicketSubject } from './interactions/change-ticket-subject';
import { raiseTicket } from './interactions/raise-ticket';
import { expectedTicket, ticket } from './questions/ticket';
import { setUp } from './tasks/set-up';
import { SupportDeskCast } from './cast';

describe('A support agent using the scenario context', () => {
    let priya: Actor;

    beforeEach(() => {
        const cast = new SupportDeskCast();
        priya = cast.prepare(actorCalled('Priya'));
    });

    it('remembers the subject of a raised ticket, matching what the system under test has on record', async () => {
        await priya.attemptsTo(
            setUp(),

            raiseTicket(),
        );

        await priya.attemptsTo(
            Ensure.that(
                ticket().subject,
                equals(expectedTicket().subject),
            ),
        );
    });

    it('remembers the new subject of a ticket whose subject was changed, matching what the system under test has on record', async () => {
        await priya.attemptsTo(
            setUp(),

            raiseTicket(),

            changeTicketSubject('A new, more descriptive subject'),
        );

        await priya.attemptsTo(
            Ensure.that(
                ticket().subject,
                equals('A new, more descriptive subject'),
            ),
        );
    });

    it('changes the subject of a ticket by label, leaving another one untouched', async () => {
        await priya.attemptsTo(
            setUp(),

            raiseTicket({ label: 'billing' }),
            raiseTicket({ label: 'login' }),

            changeTicketSubject('Billing query needs a closer look', 'billing'),
        );

        await priya.attemptsTo(
            Ensure.that(ticket('billing'), property('subject', equals('Billing query needs a closer look'))),
            Ensure.that(ticket('login').subject, equals(expectedTicket('login').subject)),
        );
    });
});
