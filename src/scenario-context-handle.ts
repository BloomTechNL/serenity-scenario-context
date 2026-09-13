import { ScenarioContextPart } from './scenario-context-part';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Returned by {@link ScenarioContextPart#findOne} and
 * {@link ScenarioContextPart#findLastUsed} instead of the found value
 * itself, a `ScenarioContextHandle` stands in for it while keeping hold of
 * the {@link ScenarioContextPiece} it came from.
 *
 * A {@link ScenarioContextPiece} is immutable - it can't swap out its own
 * value. `ScenarioContextHandle#replaceValue` does the equivalent for you: it
 * builds a new piece, carrying over the same qualifiers, and swaps it into
 * the same spot in the underlying {@link ScenarioContextPart} that the
 * original piece occupied.
 *
 * ```ts
 * const ticket = UseScenarioContext.as(actor).find(Ticket);
 *
 * ticket.replaceValue(ticket.getValue().resolve());
 *
 * // subsequent searches, and this handle, now see the resolved ticket:
 * ticket.getValue().status; // 'resolved'
 * ```
 */
export class ScenarioContextHandle<Value> {

    constructor(
        private readonly part: ScenarioContextPart<Value>,
        private piece: ScenarioContextPiece<Value>,
    ) {
    }

    /**
     * @returns the value currently held by the underlying context piece.
     */
    getValue(): Value {
        return this.piece.value;
    }

    /**
     * Replaces the value held by the underlying context piece with
     * `newValue`, keeping the same qualifiers, and puts the new piece where
     * the old one used to be in the scenario context. A subsequent call to
     * {@link ScenarioContextHandle#getValue} on this same handle returns
     * `newValue`.
     */
    replaceValue(newValue: Value): void {
        const newPiece = new ScenarioContextPiece(newValue, this.piece.allQualifiers());

        this.part.replace(this.piece, newPiece);

        this.piece = newPiece;
    }
}
