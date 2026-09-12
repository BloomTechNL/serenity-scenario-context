import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds the {@link ScenarioContextPiece} objects recorded during a scenario,
 * as an ordered stack: the piece that was put on top most recently is
 * iterated over first.
 *
 * `ScenarioContext` itself doesn't know anything about "types" or how
 * qualifiers should be interpreted - it merely remembers the order in which
 * pieces were put on top. That interpretation is the responsibility of its
 * consumers, such as the {@link UseScenarioContext} ability.
 */
export class ScenarioContext implements Iterable<ScenarioContextPiece> {

    private readonly pieces: ScenarioContextPiece[] = [];

    /**
     * Puts a new context piece on top of this context - either an
     * already-constructed {@link ScenarioContextPiece}, or a plain value
     * plus its qualifiers, exactly as {@link UseScenarioContext#add} accepts
     * them, so adding directly to a `ScenarioContext` never needs anything
     * that adding through the ability doesn't.
     *
     * @returns the piece that was put on top, for convenience.
     */
    add<Value>(piece: ScenarioContextPiece<Value>): ScenarioContextPiece<Value>;
    add<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value>;
    add<Value>(pieceOrValue: ScenarioContextPiece<Value> | Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
        const piece = pieceOrValue instanceof ScenarioContextPiece
            ? pieceOrValue
            : new ScenarioContextPiece(pieceOrValue, qualifiers);

        this.pieces.unshift(piece);

        return piece;
    }

    /**
     * Moves a context piece that is already part of this context back to the
     * top, without creating a duplicate entry.
     *
     * @throws Error
     *  if the given piece is not (or is no longer) part of this context.
     */
    putOnTop(piece: ScenarioContextPiece): void {
        const index = this.pieces.indexOf(piece);

        if (index === -1) {
            throw new Error('Could not put the context piece on top because it is not part of this scenario context');
        }

        this.pieces.splice(index, 1);
        this.pieces.unshift(piece);
    }

    /**
     * Iterates over all the context pieces, top (most recently put) to
     * bottom (least recently put).
     */
    [Symbol.iterator](): Iterator<ScenarioContextPiece> {
        return this.pieces[Symbol.iterator]();
    }
}
