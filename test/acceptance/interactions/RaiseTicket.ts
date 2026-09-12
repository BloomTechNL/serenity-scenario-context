import { randomUUID } from 'node:crypto';

import { Interaction } from '@serenity-js/core';

import { UseScenarioContext } from '../../../src/index';
import { TicketRepresentation } from '../system-under-test/index';
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
 * A fake domain object used to demonstrate the scenario context ability -
 * the piece of context a support agent's scenario keeps about a ticket.
 * Imagine a support agent working through a queue of customer tickets,
 * switching their attention between several of them within a single
 * scenario.
 *
 * Deliberately holds nothing but `id` and `subject` - the facts about a
 * ticket that never change over its lifetime. `label` and `priority` (at
 * raising time) and `status` (at resolving time) are all *how this scenario
 * currently refers to* a ticket, not facts about it, so they're recorded as
 * qualifiers on the {@link ScenarioContextPiece}, not as fields here - see
 * `raiseTicket` and `resolveTicket`.
 *
 * Immutable, like every {@link ScenarioContextPiece} value should be:
 * nothing about a `TicketContext`, once created, can change.
 *
 * Defined here, next to `raiseTicket` - the interaction that puts the first
 * `TicketContext` piece of any given label on the scenario context - rather
 * than off in a separate "domain" module. `resolveTicket`, which also adds
 * `TicketContext` pieces, and the question functions, which search for
 * them, import it from here. It's never imported by a spec: specs raise
 * tickets with plain `TicketDetails`, and verify them against plain object
 * literals - a `TicketContext` only ever exists on the scenario context,
 * not in a test.
 */
export class TicketContext {

    constructor(
        public readonly id: string,
        public readonly subject: string,
    ) {
    }

    /**
     * Turns whatever the fake `system-under-test` hands back over its
     * HTTP-like API into an instance of this class, the same way a real API
     * client would deserialise a JSON response into a domain object.
     */
    static fromRepresentation(representation: TicketRepresentation): TicketContext {
        return new TicketContext(representation.id, representation.subject);
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

        const raised = TicketContext.fromRepresentation(representation);
        const qualifiers = representation.priority === 'urgent'
            ? [ label, 'urgent' ]
            : [ label ];

        UseScenarioContext.as(actor).add(raised, ...qualifiers);
    });
};
