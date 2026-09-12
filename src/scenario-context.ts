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
     * Puts a new context piece on top of this context.
     *
     * @returns the piece that was put on top, for convenience.
     */
    add<Value>(piece: ScenarioContextPiece<Value>): ScenarioContextPiece<Value> {
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
