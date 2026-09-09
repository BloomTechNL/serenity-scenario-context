import { Ability } from '@serenity-js/core';

import { ScenarioContext } from './ScenarioContext';
import { ScenarioContextPiece } from './ScenarioContextPiece';

/**
 * A constructor function for `Value`, used to identify what type of object
 * {@link UseScenarioContext#find} should look for.
 */
export interface Constructor<Value> {
    new (...args: any[]): Value;
}

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
     */
    add<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
        return this.scenarioContext.put(new ScenarioContextPiece(value, qualifiers));
    }

    /**
     * Looks for a context piece whose value is an instance of `type` and
     * whose qualifiers include every one of the given `qualifiers`.
     *
     * The pieces are inspected top to bottom, so when several pieces match,
     * the one that was put on top most recently - i.e. the one currently "in
     * the spotlight" - is the one that gets returned.
     *
     * A piece that is found is itself put on top of the scenario context,
     * putting it "in the spotlight" for any subsequent, less specific
     * search.
     *
     * @throws Error
     *  if no matching context piece can be found.
     */
    find<Value>(type: Constructor<Value>, ...qualifiers: string[]): Value {
        for (const piece of this.scenarioContext) {
            if (piece.value instanceof type && piece.hasQualifiers(qualifiers)) {
                this.scenarioContext.putOnTop(piece);

                return piece.value as Value;
            }
        }

        throw new Error(
            qualifiers.length > 0
                ? `Could not find ${ type.name } qualified by ${ qualifiers.join(', ') } in the scenario context`
                : `Could not find ${ type.name } in the scenario context`
        );
    }
}
