import { Constructor } from './constructor';
import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    TooManyQualifiersError,
    UnexpectedQualifierCountError,
} from './scenario-context-errors';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds every {@link ScenarioContextPiece} of one particular type recorded
 * in a {@link ScenarioContext}. Every piece must carry the same, fixed
 * number of qualifiers, and no two pieces may carry the exact same
 * combination of them.
 */
export class ScenarioContextPart<Value = unknown> {

    private readonly pieces: Array<ScenarioContextPiece<Value>> = [];

    constructor(private readonly type: Constructor<Value>) {
    }

    qualifierCount(): number {
        if (this.pieces.length === 0) { throw new Error('Qualifiercount is undetermined; No pieces added yet'); }
        return this.pieces[0].qualifierCount();
    }

    /**
     * Puts `piece` on top of this part.
     *
     * @throws UnexpectedQualifierCountError
     *  if `piece`'s number of qualifiers doesn't match the number already
     *  established for this type.
     * @throws DuplicateQualifiersError
     *  if a piece already held by this part carries the exact same
     *  combination of qualifiers.
     */
    add(piece: ScenarioContextPiece<Value>): void {
        const qualifierCount = piece.qualifierCount();

        if (this.pieces.length > 0 && qualifierCount !== this.qualifierCount()) {
            throw new UnexpectedQualifierCountError(this.type, qualifierCount, this.qualifierCount());
        }

        if (this.pieces.some(existing => existing.hasSameQualifiersAs(piece))) {
            throw new DuplicateQualifiersError(this.type, piece.allQualifiers());
        }

        this.pieces.unshift(piece);
    }

    /**
     * Shorthand for {@link ScenarioContextPart#findPiece} that returns the
     * value straight away - reach for this unless you need to
     * {@link ScenarioContextPiece#replace} it afterwards.
     *
     * @throws TooManyQualifiersError
     *  if more qualifiers are given than this type takes.
     * @throws PieceNotFoundError
     *  if no piece matches `qualifiers`.
     */
    find(...qualifiers: string[]): Value {
        return this.findPiece(...qualifiers).value;
    }

    /**
     * Finds the piece qualified by every one of `qualifiers`, and puts it
     * on top of this part - "in the spotlight". Given exactly as many
     * qualifiers as this type takes, the match is unambiguous; given
     * fewer, whichever match is currently in the spotlight is returned.
     *
     * Reach for this over {@link ScenarioContextPart#find} only when you
     * intend to {@link ScenarioContextPiece#replace} the value once you've
     * read it.
     *
     * @throws TooManyQualifiersError
     *  if more qualifiers are given than this type takes.
     * @throws PieceNotFoundError
     *  if no piece matches `qualifiers`.
     */
    findPiece(...qualifiers: string[]): ScenarioContextPiece<Value> {
        if (this.pieces.length > 0 && qualifiers.length > this.qualifierCount()) {
            throw new TooManyQualifiersError(this.type, this.qualifierCount(), qualifiers.length);
        }

        const matches = this.pieces.filter(piece => piece.hasQualifiers(qualifiers));

        if (matches.length === 0) {
            throw new PieceNotFoundError(this.type, qualifiers);
        }

        const piece = matches[0];
        this.pieces.splice(this.pieces.indexOf(piece), 1);
        this.pieces.unshift(piece);

        return piece;
    }
}
