import { Ability } from '@serenity-js/core';

import { Constructor } from './constructor';
import { Qualifiers } from './qualifiers';
import { ScenarioContext } from './scenario-context';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * An {@link https://serenity-js.org/api/core/class/Ability/ | Ability} that
 * enables an
 * {@link https://serenity-js.org/api/core/class/Actor/ | Actor} to use a
 * {@link ScenarioContext} as an advanced form of notes: unlike a flat
 * notepad, the scenario context lets several objects of the same type
 * coexist, tells them apart using qualifiers, and always keeps track of
 * which one is currently "in the spotlight".
 *
 * ## Remembering something
 *
 * ```ts
 * import { actorCalled } from '@serenity-js/core';
 * import { UseScenarioContext } from '@your-org/serenity-scenario-context';
 *
 * class Ticket {
 *   constructor(public readonly id: string) {}
 * }
 *
 * actorCalled('Alice')
 *   .whoCan(UseScenarioContext.using())
 *   .attemptsTo(
 *     Interaction.where('#actor raises a ticket', actor =>
 *       UseScenarioContext.as(actor).add(new Ticket('TICKET-1'), { priority: 'urgent' })),
 *   )
 * ```
 *
 * ## Recalling something
 *
 * ```ts
 * // when the value itself is all you need:
 * const ticket = UseScenarioContext.as(actor).find(Ticket, { priority: 'urgent' });
 *
 * // when you'll want to swap it out afterwards:
 * const found = UseScenarioContext.as(actor).findPiece(Ticket, { priority: 'urgent' });
 * found.replace(newTicket); // swaps it out for newTicket, in place
 * ```
 *
 * Finding a piece of context puts it "in the spotlight" - i.e. on top of
 * the underlying {@link ScenarioContext} - so that a subsequent, less
 * specific search is more likely to find it again.
 */
export class UseScenarioContext extends Ability {

    /**
     * Instantiates the ability to `UseScenarioContext`, backed by the given
     * {@link ScenarioContext} (or a fresh, empty one, when no context is
     * given).
     */
    static using(scenarioContext: ScenarioContext = new ScenarioContext()): UseScenarioContext {
        return new UseScenarioContext(scenarioContext);
    }

    constructor(private readonly scenarioContext: ScenarioContext) {
        super();
    }

    /**
     * Puts `value`, qualified by the given `qualifiers`, on top of the
     * scenario context.
     *
     * @returns the {@link ScenarioContextPiece} that was created, for
     *  convenience.
     *
     * @throws Error
     *  if `value`'s type has already been added with a different *set of
     *  qualifier keys*, or if a piece of that type already exists in the
     *  scenario context with this exact combination of qualifiers - see
     *  {@link ScenarioContext}.
     */
    add<Value extends object>(value: Value, qualifiers: Qualifiers = {}): ScenarioContextPiece<Value> {
        return this.scenarioContext.add(value, qualifiers);
    }

    /**
     * Finds the value of `type`, qualified by every key/value pair in
     * `qualifiers` - see {@link ScenarioContextPart#find}. Reach for
     * {@link UseScenarioContext#findPiece} instead when you'll want to swap
     * the value out afterwards.
     */
    find<Value>(type: Constructor<Value>, qualifiers: Qualifiers = {}): Value {
        return this.scenarioContext.partFor(type).find(qualifiers);
    }

    /**
     * The same search as {@link UseScenarioContext#find}, but returning the
     * {@link ScenarioContextPiece} that was found rather than just its
     * value - call {@link ScenarioContextPiece#replace} on it to swap the
     * value out for a new one, in place.
     */
    findPiece<Value>(type: Constructor<Value>, qualifiers: Qualifiers = {}): ScenarioContextPiece<Value> {
        return this.scenarioContext.partFor(type).findPiece(qualifiers);
    }
}
