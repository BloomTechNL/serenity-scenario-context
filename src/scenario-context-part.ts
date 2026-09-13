import { Constructor } from './constructor';
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
 *
 * Swapping out what a found piece holds is
 * {@link ScenarioContextPiece#replace}'s job, not this class's: a piece
 * never changes its qualifiers or its position in here, so replacing its
 * value doesn't need any help from the part that holds it.
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

        const duplicate = this.pieces.some(existing => haveTheSameQualifiers(existing, piece));

        if (duplicate) {
            throw new Error(
                `Could not add ${ this.type.name } qualified by ${ describeQualifiers(piece) } - a ${ this.type.name } `
                + 'qualified exactly like that is already part of the scenario context'
            );
        }

        this.pieces.unshift(piece);
    }

    /**
     * Finds the piece qualified by every one of `qualifiers`, and puts it
     * "in the spotlight" - on top of this part - so that whatever you
     * search for next, without being overly specific, tends to find what
     * you were just working with.
     *
     * Given exactly as many qualifiers as this part's type takes, at most
     * one piece can possibly match - the combination is a composite key,
     * and {@link ScenarioContextPart#add} never lets two pieces share one -
     * so the result is unambiguous by construction. Given fewer, several
     * pieces might still match, so whichever one was put on top of this
     * part most recently is returned, no questions asked. Given more than
     * this type takes, `qualifiers` couldn't possibly match anything, and
     * this throws rather than searching for something that can't exist.
     *
     * This is exactly the `label ? "the one labelled label" : "whichever is
     * in the spotlight"` idiom that comes up whenever a qualifier is
     * something a caller may or may not have on hand - e.g. resolving "the
     * ticket labelled `label`" when `label` was given, or "the ticket in
     * the spotlight" when it wasn't:
     *
     * ```ts
     * // label?: string
     * UseScenarioContext.as(actor).find(Ticket, ...(label ? [ label ] : []));
     * ```
     *
     * @returns the {@link ScenarioContextPiece} that was found - read
     *  {@link ScenarioContextPiece#value} to get at the value itself, or
     *  call {@link ScenarioContextPiece#replace} to swap it out for a new
     *  one.
     *
     * @throws Error
     *  if more qualifiers are given than this type takes, or if no piece
     *  matches `qualifiers`.
     */
    find(...qualifiers: string[]): ScenarioContextPiece<Value> {
        if (this.qualifierCount !== undefined && qualifiers.length > this.qualifierCount) {
            throw new Error(
                `${ this.type.name } takes ${ this.qualifierCount } qualifier(s), but ${ qualifiers.length } `
                + `${ qualifiers.length === 1 ? 'was' : 'were' } given to find()`
            );
        }

        const matches = this.matching(qualifiers);

        if (matches.length === 0) {
            throw new Error(`Could not find ${ this.description(qualifiers) }`);
        }

        const piece = matches[0];
        this.putOnTop(piece);

        return piece;
    }

    /**
     * Iterates over this part's pieces, top (most recently put) to bottom.
     */
    [Symbol.iterator](): Iterator<ScenarioContextPiece<Value>> {
        return this.pieces[Symbol.iterator]();
    }

    /**
     * Moves `piece`, already held by this part, back to the top - "in the
     * spotlight". Only ever called with a piece this part just found for
     * itself (see `find`/`matching`), so it's always already here.
     */
    private putOnTop(piece: ScenarioContextPiece<Value>): void {
        this.pieces.splice(this.pieces.indexOf(piece), 1);
        this.pieces.unshift(piece);
    }

    private matching(qualifiers: string[]): Array<ScenarioContextPiece<Value>> {
        return this.pieces.filter(piece => piece.hasQualifiers(qualifiers));
    }

    private description(qualifiers: string[]): string {
        return qualifiers.length > 0
            ? `${ this.type.name } qualified by ${ qualifiers.join(', ') } in the scenario context`
            : `${ this.type.name } in the scenario context`;
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
