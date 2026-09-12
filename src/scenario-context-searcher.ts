import { Constructor } from './constructor';
import { ScenarioContext } from './scenario-context';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Searches a {@link ScenarioContext} for pieces whose value is an instance
 * of a given type, optionally narrowed down further by qualifiers.
 *
 * A `ScenarioContextSearcher` is returned by
 * {@link UseScenarioContext#withType} and is meant to be used straight away:
 *
 * ```ts
 * UseScenarioContext.as(actor)
 *     .withType(Ticket)
 *     .withQualifiers('urgent')
 *     .findOne();
 * ```
 *
 * It deliberately makes no assumption about which piece you want when
 * several match: {@link ScenarioContextSearcher#findOne} insists that
 * exactly one piece matches, while
 * {@link ScenarioContextSearcher#findLastUsed} explicitly opts in to
 * resolving that ambiguity by picking whichever matching piece was put on
 * top of the context most recently.
 */
export class ScenarioContextSearcher<Value> {

    constructor(
        private readonly scenarioContext: ScenarioContext,
        private readonly type: Constructor<Value>,
        private readonly qualifiers: string[] = [],
    ) {
    }

    /**
     * Narrows this search down further, requiring every matching piece to
     * also carry all the given `qualifiers`, in addition to any already
     * required by an earlier call to `withQualifiers`.
     *
     * @returns a new `ScenarioContextSearcher` - this one is left unchanged.
     */
    withQualifiers(...qualifiers: string[]): ScenarioContextSearcher<Value> {
        return new ScenarioContextSearcher(
            this.scenarioContext,
            this.type,
            [ ...this.qualifiers, ...qualifiers ],
        );
    }

    /**
     * Finds the single piece matching this search's type and qualifiers,
     * and puts it "in the spotlight" - on top of the scenario context.
     *
     * Use this method when you expect at most one matching piece to exist,
     * and want to be told if that assumption doesn't hold.
     *
     * @throws Error
     *  if no piece matches this search, or if more than one does. When
     *  several pieces match and picking whichever was used most recently
     *  is an acceptable way to resolve that ambiguity, use
     *  {@link ScenarioContextSearcher#findLastUsed} instead.
     */
    findOne(): Value {
        const matches = this.matchingPieces();

        if (matches.length === 0) {
            throw new Error(`Could not find ${ this.description() }`);
        }

        if (matches.length > 1) {
            throw new Error(
                `Found ${ matches.length } instances of ${ this.description() }, expected exactly one. `
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        }

        return this.putOnTopAndReturn(matches[0]);
    }

    /**
     * Finds whichever piece matching this search's type and qualifiers was
     * put on top of the scenario context most recently, and puts it back
     * "in the spotlight". Unlike {@link ScenarioContextSearcher#findOne},
     * this method doesn't complain when several pieces match.
     *
     * @throws Error
     *  if no piece matches this search.
     */
    findLastUsed(): Value {
        const matches = this.matchingPieces();

        if (matches.length === 0) {
            throw new Error(`Could not find ${ this.description() }`);
        }

        return this.putOnTopAndReturn(matches[0]);
    }

    private matchingPieces(): Array<ScenarioContextPiece<Value>> {
        const matches: Array<ScenarioContextPiece<Value>> = [];

        for (const piece of this.scenarioContext) {
            if (piece.value instanceof this.type && piece.hasQualifiers(this.qualifiers)) {
                matches.push(piece as ScenarioContextPiece<Value>);
            }
        }

        return matches;
    }

    private putOnTopAndReturn(piece: ScenarioContextPiece<Value>): Value {
        this.scenarioContext.putOnTop(piece);

        return piece.value;
    }

    private description(): string {
        return this.qualifiers.length > 0
            ? `${ this.type.name } qualified by ${ this.qualifiers.join(', ') } in the scenario context`
            : `${ this.type.name } in the scenario context`;
    }
}
