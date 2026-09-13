import { Ability } from '@serenity-js/core';

import { Constructor } from './constructor';
import { ScenarioContext } from './scenario-context';
import { ScenarioContextHandle } from './scenario-context-handle';
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
 *       UseScenarioContext.as(actor).add(new Ticket('TICKET-1'), 'urgent')),
 *   )
 * ```
 *
 * ## Recalling something
 *
 * ```ts
 * const ticket = UseScenarioContext.as(actor).find(Ticket, 'urgent');
 *
 * ticket.getValue();               // the Ticket itself
 * ticket.replaceValue(newTicket);  // swaps it out for newTicket, in place
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
     *  if `value`'s type has already been added with a different *number*
     *  of qualifiers, or if a piece of that type already exists in the
     *  scenario context with this exact combination of qualifiers - see
     *  {@link ScenarioContext}.
     */
    add<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
        return this.scenarioContext.add(value, ...qualifiers);
    }

    /**
     * Finds the piece of `type`, qualified by every one of `qualifiers`, the
     * way {@link ScenarioContextPart#find} describes: given exactly as many
     * qualifiers as `type` takes, there can be at most one match, so this
     * insists on exactly one; given fewer, whichever match was put on top
     * of the scenario context most recently is returned, no questions
     * asked; given more than `type` takes, this throws rather than
     * searching for something that can't exist.
     *
     * @returns a {@link ScenarioContextHandle} wrapping the value that was
     *  found - call {@link ScenarioContextHandle#getValue} to get at the
     *  value itself, or {@link ScenarioContextHandle#replaceValue} to swap
     *  it out for a new one.
     *
     * @throws Error
     *  if more qualifiers are given than `type` takes; if no piece matches;
     *  or if several do and exactly as many qualifiers as `type` takes were
     *  given.
     */
    find<Value>(type: Constructor<Value>, ...qualifiers: string[]): ScenarioContextHandle<Value> {
        return this.scenarioContext.partFor(type).find(...qualifiers);
    }
}
