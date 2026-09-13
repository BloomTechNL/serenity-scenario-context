import { Constructor } from './constructor';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds the {@link ScenarioContextPiece} objects recorded during a scenario,
 * as an ordered stack: the piece that was put on top most recently is
 * iterated over first.
 *
 * Every *type* of value held here has a fixed number of qualifiers that
 * goes with it, established by however many qualifiers the first piece of
 * that type was added with. Every later piece of the same type - whether
 * added via `add` or swapped in via `replace` - must carry exactly that
 * many qualifiers, and no two pieces of the same type may carry the exact
 * same combination of them: the combination acts like a composite key that
 * tells same-typed pieces apart. {@link ScenarioContextSearcher#find} relies
 * on the fixed count to decide how a search should be resolved.
 */
export class ScenarioContext implements Iterable<ScenarioContextPiece> {

    private readonly pieces: ScenarioContextPiece[] = [];
    private readonly qualifierCounts = new Map<Constructor<unknown>, number>();

    /**
     * Puts a new context piece on top of this context - either an
     * already-constructed {@link ScenarioContextPiece}, or a plain value
     * plus its qualifiers, exactly as {@link UseScenarioContext#add} accepts
     * them, so adding directly to a `ScenarioContext` never needs anything
     * that adding through the ability doesn't.
     *
     * @returns the piece that was put on top, for convenience.
     *
     * @throws Error
     *  if `piece`'s number of qualifiers doesn't match the number already
     *  established for its type, or if a piece of that type already exists
     *  in this context with the exact same combination of qualifiers.
     */
    add<Value>(piece: ScenarioContextPiece<Value>): ScenarioContextPiece<Value>;
    add<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value>;
    add<Value>(pieceOrValue: ScenarioContextPiece<Value> | Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
        const piece = pieceOrValue instanceof ScenarioContextPiece
            ? pieceOrValue
            : new ScenarioContextPiece(pieceOrValue, qualifiers);

        this.assertSatisfiesTypeConstraints(piece);

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
     * Swaps `oldPiece` for `newPiece` in place, leaving the position of
     * every other piece - and `newPiece`'s own position - unaffected. Used to
     * replace a piece's value without disturbing where it sits in the stack,
     * since a {@link ScenarioContextPiece} is itself immutable.
     *
     * @returns `newPiece`, for convenience.
     *
     * @throws Error
     *  if `oldPiece` is not (or is no longer) part of this context; if
     *  `newPiece`'s number of qualifiers doesn't match the number already
     *  established for its type; or if some *other* piece of that type
     *  already occupies the exact same combination of qualifiers that
     *  `newPiece` carries.
     */
    replace<Value>(oldPiece: ScenarioContextPiece<Value>, newPiece: ScenarioContextPiece<Value>): ScenarioContextPiece<Value> {
        const index = this.pieces.indexOf(oldPiece);

        if (index === -1) {
            throw new Error('Could not replace the context piece because it is not part of this scenario context');
        }

        this.assertSatisfiesTypeConstraints(newPiece, oldPiece);

        this.pieces[index] = newPiece;

        return newPiece;
    }

    /**
     * @returns the fixed number of qualifiers established for `type` -
     *  however many qualifiers the first piece whose value was an instance
     *  of `type` was added with - or `undefined` if no piece of that type
     *  has been added to this context yet.
     */
    qualifierCountFor(type: Constructor<unknown>): number | undefined {
        return this.qualifierCounts.get(type);
    }

    /**
     * Iterates over all the context pieces, top (most recently put) to
     * bottom (least recently put).
     */
    [Symbol.iterator](): Iterator<ScenarioContextPiece> {
        return this.pieces[Symbol.iterator]();
    }

    /**
     * Establishes - or, once established, enforces - this context's two
     * invariants for `piece`'s type: every piece of that type carries the
     * same number of qualifiers as the first one ever added, and no two
     * pieces of that type carry the exact same combination of qualifiers.
     *
     * `ignore`, when given, is left out of the uniqueness check - used by
     * `replace` so that putting a piece back with the same qualifiers it
     * already had isn't mistaken for a clash with itself.
     */
    private assertSatisfiesTypeConstraints(piece: ScenarioContextPiece<unknown>, ignore?: ScenarioContextPiece): void {
        const type = constructorOf(piece.value);
        const qualifierCount = piece.allQualifiers().size;
        const establishedCount = this.qualifierCounts.get(type);

        if (establishedCount === undefined) {
            this.qualifierCounts.set(type, qualifierCount);
        } else if (qualifierCount !== establishedCount) {
            throw new Error(
                `Could not add ${ type.name } qualified by ${ qualifierCount } qualifier(s) - every ${ type.name } `
                + `in the scenario context must be qualified by exactly ${ establishedCount } qualifier(s), `
                + 'as established when the first one was added'
            );
        }

        const duplicate = this.pieces.some(existing =>
            existing !== ignore
            && constructorOf(existing.value) === type
            && haveTheSameQualifiers(existing, piece),
        );

        if (duplicate) {
            throw new Error(
                `Could not add ${ type.name } qualified by ${ describeQualifiers(piece) } - a ${ type.name } `
                + 'qualified exactly like that is already part of the scenario context'
            );
        }
    }
}

function constructorOf(value: unknown): Constructor<unknown> {
    return Object(value).constructor as Constructor<unknown>;
}

function haveTheSameQualifiers(a: ScenarioContextPiece, b: ScenarioContextPiece): boolean {
    const aQualifiers = a.allQualifiers();
    const bQualifiers = b.allQualifiers();

    if (aQualifiers.size !== bQualifiers.size) {
        return false;
    }

    for (const qualifier of aQualifiers) {
        if (! bQualifiers.has(qualifier)) {
            return false;
        }
    }

    return true;
}

function describeQualifiers(piece: ScenarioContextPiece): string {
    const qualifiers = [ ...piece.allQualifiers() ];

    return qualifiers.length > 0 ? qualifiers.join(', ') : 'no qualifiers';
}
