import { Ability } from '@serenity-js/core';

import { Constructor } from './Constructor';
import { ScenarioContext } from './ScenarioContext';
import { ScenarioContextPiece } from './ScenarioContextPiece';
import { ScenarioContextSearcher } from './ScenarioContextSearcher';

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
 * // when you expect exactly one match:
 * const ticket = UseScenarioContext.as(actor).withType(Ticket).withQualifiers('urgent').findOne();
 *
 * // when several might match, and the most recently used one will do:
 * const ticket = UseScenarioContext.as(actor).withType(Ticket).findLastUsed();
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
        return this.scenarioContext.add(new ScenarioContextPiece(value, qualifiers));
    }

    /**
     * Starts a search of the scenario context for pieces whose value is an
     * instance of `type`. Narrow the search down further with
     * {@link ScenarioContextSearcher#withQualifiers}, then resolve it with
     * either {@link ScenarioContextSearcher#findOne} - when you expect at
     * most one match - or {@link ScenarioContextSearcher#findLastUsed} -
     * when several might match and the most recently used one will do.
     */
    withType<Value>(type: Constructor<Value>): ScenarioContextSearcher<Value> {
        return new ScenarioContextSearcher(this.scenarioContext, type);
    }
}
