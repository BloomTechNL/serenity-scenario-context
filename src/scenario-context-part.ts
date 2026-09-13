import { Constructor } from './constructor';
import { ScenarioContextHandle } from './scenario-context-handle';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds every {@link ScenarioContextPiece} of one particular type recorded
 * in a {@link ScenarioContext}, as an ordered stack of its own: the piece
 * that was put on top most recently is iterated over first. Also holds the
 * two invariants {@link ScenarioContext} establishes per type: how many
 * qualifiers a piece of this type must carry - however many the first one
 * added carried - and that no two of them carry the exact same combination
 * of qualifiers.
 *
 * Because a part only ever holds pieces of one type, it can resolve a search
 * - {@link ScenarioContextPart#find} - on its own, without any help
 * filtering by type: the fixed qualifier count and the pieces to search
 * through are both right here. {@link UseScenarioContext#find} is what an
 * actor uses this through - it looks up the part for the type it's given,
 * and calls `find` on it directly:
 *
 * ```ts
 * UseScenarioContext.as(actor).find(Ticket, 'urgent');
 * ```
 */
export class ScenarioContextPart<Value = unknown> implements Iterable<ScenarioContextPiece<Value>> {

    private qualifierCount: number | undefined;
    private readonly pieces: Array<ScenarioContextPiece<Value>> = [];

    constructor(private readonly type: Constructor<Value>) {
    }

    /**
     * @returns the fixed number of qualifiers established for this part's
     *  type - however many qualifiers the first piece added to it carried -
     *  or `undefined` if this part doesn't hold any piece yet.
     */
    numberOfQualifiers(): number | undefined {
        return this.qualifierCount;
    }

    /**
     * Puts `piece` on top of this part.
     *
     * @throws Error
     *  if `piece`'s number of qualifiers doesn't match the number already
     *  established for this type, or if a piece already held by this part
     *  carries the exact same combination of qualifiers.
     */
    add(piece: ScenarioContextPiece<Value>): void {
        this.assertSatisfiesTypeConstraints(piece);

        this.pieces.unshift(piece);
    }

    /**
     * Moves `piece`, already held by this part, back to the top.
     *
     * @throws Error if `piece` is not (or is no longer) held by this part.
     */
    putOnTop(piece: ScenarioContextPiece<Value>): void {
        const index = this.indexOf(piece, 'Could not put the context piece on top because it is not part of this scenario context');

        this.pieces.splice(index, 1);
        this.pieces.unshift(piece);
    }

    /**
     * Swaps `oldPiece`, already held by this part, for `newPiece`, in place,
     * so that - unlike `add` or `putOnTop` - `newPiece` doesn't get put in
     * the spotlight by virtue of being replaced.
     *
     * @throws Error
     *  if `oldPiece` is not (or is no longer) held by this part; if
     *  `newPiece`'s number of qualifiers doesn't match the number already
     *  established for this type; or if some *other* piece held by this
     *  part already carries the exact same combination of qualifiers that
     *  `newPiece` does.
     */
    replace(oldPiece: ScenarioContextPiece<Value>, newPiece: ScenarioContextPiece<Value>): void {
        const index = this.indexOf(oldPiece, 'Could not replace the context piece because it is not part of this scenario context');

        this.assertSatisfiesTypeConstraints(newPiece, oldPiece);

        this.pieces[index] = newPiece;
    }

    /**
     * Finds the single piece qualified by every one of `qualifiers`, and
     * puts it "in the spotlight" - on top of this part.
     *
     * Use this method when you expect at most one matching piece to exist,
     * and want to be told if that assumption doesn't hold.
     *
     * @returns a {@link ScenarioContextHandle} wrapping the value that was
     *  found - call {@link ScenarioContextHandle#getValue} to get at the
     *  value itself, or {@link ScenarioContextHandle#replaceValue} to swap
     *  it out for a new one.
     *
     * @throws Error
     *  if no piece matches, or if more than one does. When several pieces
     *  match and picking whichever was used most recently is an acceptable
     *  way to resolve that ambiguity, use
     *  {@link ScenarioContextPart#findLastUsed} instead.
     */
    findOne(...qualifiers: string[]): ScenarioContextHandle<Value> {
        const matches = this.matching(qualifiers);

        if (matches.length === 0) {
            throw new Error(`Could not find ${ this.description(qualifiers) }`);
        }

        if (matches.length > 1) {
            throw new Error(
                `Found ${ matches.length } instances of ${ this.description(qualifiers) }, expected exactly one. `
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        }

        return this.spotlight(matches[0]);
    }

    /**
     * Finds whichever piece qualified by every one of `qualifiers` was put
     * on top of this part most recently, and puts it back "in the
     * spotlight". Unlike {@link ScenarioContextPart#findOne}, this method
     * doesn't complain when several pieces match.
     *
     * @returns a {@link ScenarioContextHandle} wrapping the value that was
     *  found - call {@link ScenarioContextHandle#getValue} to get at the
     *  value itself, or {@link ScenarioContextHandle#replaceValue} to swap
     *  it out for a new one.
     *
     * @throws Error if no piece matches `qualifiers`.
     */
    findLastUsed(...qualifiers: string[]): ScenarioContextHandle<Value> {
        const matches = this.matching(qualifiers);

        if (matches.length === 0) {
            throw new Error(`Could not find ${ this.description(qualifiers) }`);
        }

        return this.spotlight(matches[0]);
    }

    /**
     * A shorthand that decides between {@link ScenarioContextPart#findOne}
     * and {@link ScenarioContextPart#findLastUsed} for you, based on how
     * `qualifiers` compares to the fixed number of qualifiers established
     * for this part's type:
     *
     * - given exactly that many qualifiers, there can be at most one piece
     *   qualified exactly like that - the combination is a composite key -
     *   so this behaves like `findOne()`: either the single match, or an
     *   error;
     * - given fewer, several pieces might still match, so this behaves like
     *   `findLastUsed()` instead: whichever matching piece is currently in
     *   the spotlight, no questions asked;
     * - given more, `qualifiers` couldn't possibly match anything, and this
     *   throws rather than searching for something that can't exist.
     *
     * This is exactly the `label ? findOne(label) : findLastUsed()` idiom
     * that comes up whenever a qualifier is something a caller may or may
     * not have on hand - e.g. resolving "the ticket labelled `label`" when
     * `label` was given, or "the ticket in the spotlight" when it wasn't -
     * generalized to however many qualifiers the type actually takes.
     *
     * ```ts
     * // label?: string
     * UseScenarioContext.as(actor).find(Ticket, ...(label ? [ label ] : []));
     * ```
     *
     * @returns a {@link ScenarioContextHandle} wrapping the value that was
     *  found - call {@link ScenarioContextHandle#getValue} to get at the
     *  value itself, or {@link ScenarioContextHandle#replaceValue} to swap
     *  it out for a new one.
     *
     * @throws Error
     *  if more qualifiers are given than this type takes; otherwise under
     *  the same conditions as whichever of `findOne`/`findLastUsed` this
     *  delegates to.
     */
    find(...qualifiers: string[]): ScenarioContextHandle<Value> {
        if (this.qualifierCount !== undefined && qualifiers.length > this.qualifierCount) {
            throw new Error(
                `${ this.type.name } takes ${ this.qualifierCount } qualifier(s), but ${ qualifiers.length } `
                + `${ qualifiers.length === 1 ? 'was' : 'were' } given to find()`
            );
        }

        return this.qualifierCount !== undefined && qualifiers.length === this.qualifierCount
            ? this.findOne(...qualifiers)
            : this.findLastUsed(...qualifiers);
    }

    /**
     * Iterates over this part's pieces, top (most recently put) to bottom.
     */
    [Symbol.iterator](): Iterator<ScenarioContextPiece<Value>> {
        return this.pieces[Symbol.iterator]();
    }

    private spotlight(piece: ScenarioContextPiece<Value>): ScenarioContextHandle<Value> {
        this.putOnTop(piece);

        return new ScenarioContextHandle(this, piece);
    }

    private matching(qualifiers: string[]): Array<ScenarioContextPiece<Value>> {
        return this.pieces.filter(piece => piece.hasQualifiers(qualifiers));
    }

    private indexOf(piece: ScenarioContextPiece<Value>, errorMessage: string): number {
        const index = this.pieces.indexOf(piece);

        if (index === -1) {
            throw new Error(errorMessage);
        }

        return index;
    }

    private description(qualifiers: string[]): string {
        return qualifiers.length > 0
            ? `${ this.type.name } qualified by ${ qualifiers.join(', ') } in the scenario context`
            : `${ this.type.name } in the scenario context`;
    }

    private assertSatisfiesTypeConstraints(piece: ScenarioContextPiece<Value>, ignore?: ScenarioContextPiece<Value>): void {
        const qualifierCount = piece.allQualifiers().size;

        if (this.qualifierCount === undefined) {
            this.qualifierCount = qualifierCount;
        } else if (qualifierCount !== this.qualifierCount) {
            throw new Error(
                `Could not add ${ this.type.name } qualified by ${ qualifierCount } qualifier(s) - every ${ this.type.name } `
                + `in the scenario context must be qualified by exactly ${ this.qualifierCount } qualifier(s), `
                + 'as established when the first one was added'
            );
        }

        const duplicate = this.pieces.some(existing =>
            existing !== ignore
            && haveTheSameQualifiers(existing, piece),
        );

        if (duplicate) {
            throw new Error(
                `Could not add ${ this.type.name } qualified by ${ describeQualifiers(piece) } - a ${ this.type.name } `
                + 'qualified exactly like that is already part of the scenario context'
            );
        }
    }
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
