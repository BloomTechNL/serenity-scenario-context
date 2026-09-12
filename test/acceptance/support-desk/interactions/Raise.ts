import { randomUUID } from 'node:crypto';

import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../../src';
import { TicketRepresentation } from '../../../../system-under-test';
import { UseSupportDeskApi } from '../UseSupportDeskApi';

export type TicketStatus = 'open' | 'resolved';
export type TicketPriority = 'normal' | 'urgent';

/**
 * A few generic placeholders `raiseTicket` picks from at random when no
 * `subject` is given - a spec that doesn't care what a ticket is about
 * shouldn't have to invent something plausible-sounding for it.
 */
const PLACEHOLDER_SUBJECTS = [
    'Something needs looking into',
    'Please take a look at this',
    'Having some trouble here',
    'This does not seem right',
];

function randomSubject(): string {
    return PLACEHOLDER_SUBJECTS[Math.floor(Math.random() * PLACEHOLDER_SUBJECTS.length)];
}

/**
 * The details needed to raise a new ticket - a plain shape, not a piece of
 * context. Specs describe *what* to raise; how a raised ticket ends up
 * represented on the scenario context is this module's business.
 *
 * Every field is optional, and `raiseTicket` fills in whatever's missing:
 * `label` and `subject` are randomly generated, `priority` defaults to
 * `'normal'`. That makes it just as easy to raise "some ticket or other",
 * when a scenario needs one to exist but doesn't care about its details, as
 * it is to raise a specific one, fully spelled out.
 *
 * There's no `id` here regardless: the system under test assigns that
 * itself. `label` is this scenario's own, human-readable name for the
 * ticket - never sent to the system, only used to qualify it in the
 * scenario context - so a spec can keep saying "billing", never having to
 * know or repeat the real, system-assigned id.
 */
export interface TicketDetails {
    label?: string;
    subject?: string;
    priority?: TicketPriority;
}

/**
 * A fake domain object used to demonstrate the scenario context ability.
 * Imagine a support agent working through a queue of customer tickets,
 * switching their attention between several of them within a single
 * scenario.
 *
 * `id` is whatever opaque id the system under test assigned; `label` is the
 * human-readable name this scenario knows the ticket by, and is what
 * qualifies it in the scenario context - see `raiseTicket` below.
 *
 * Defined here, next to `raiseTicket` - the interaction that puts the first
 * `Ticket` piece of any given label on the scenario context - rather than
 * off in a separate "domain" module. `resolveTicket`, which also adds
 * `Ticket` pieces, and the question functions, which search for them,
 * import it from here. It's never imported by a spec: specs raise tickets
 * with plain `TicketDetails`, and verify them against plain object literals
 * - a `Ticket` only ever exists on the scenario context, not in a test.
 */
export class Ticket {

    public status: TicketStatus = 'open';

    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly subject: string,
        public readonly priority: TicketPriority = 'normal',
    ) {
    }

    /**
     * Turns whatever the fake `system-under-test` hands back over its
     * HTTP-like API into an instance of this class, the same way a real API
     * client would deserialise a JSON response into a domain object. The
     * system's representation has no notion of a `label` - that's supplied
     * by whoever's asking, since it's a fact about this scenario, not about
     * the system.
     */
    static fromRepresentation(representation: TicketRepresentation, label: string): Ticket {
        const ticket = new Ticket(representation.id, label, representation.subject, representation.priority);
        ticket.status = representation.status;

        return ticket;
    }
}

/**
 * A support agent raises a new ticket - first with the system under test,
 * over its HTTP-like API, which assigns it its own id, then in the scenario
 * context, qualified by its human-readable label and, if applicable, its
 * priority, which puts it "in the spotlight" - on top of the scenario
 * context.
 *
 * `label` and `subject` are generated up front, as soon as `raiseTicket` is
 * called, rather than when the interaction is later performed - so the
 * ticket this interaction describes and the one it actually raises are
 * always the same one, however it's reported.
 */
export const raiseTicket = (details: TicketDetails = {}) => {
    const label = details.label ?? randomUUID();
    const subject = details.subject ?? randomSubject();

    return Interaction.where(`#actor raises a ticket labelled ${ label }: ${ subject }`, actor => {
        const representation = UseSupportDeskApi.as(actor).post<TicketRepresentation>('/tickets', {
            subject,
            priority: details.priority,
        });

        const raised = Ticket.fromRepresentation(representation, label);
        const qualifiers = raised.priority === 'urgent'
            ? [ raised.label, 'urgent' ]
            : [ raised.label ];

        UseScenarioContext.as(actor).add(raised, ...qualifiers);
    });
};
