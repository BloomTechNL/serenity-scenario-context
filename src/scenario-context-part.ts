import { Constructor } from './constructor';
import { Qualifiers } from './qualifiers';
import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    UnexpectedQualifierKeysError,
    UnknownQualifierKeyError,
} from './scenario-context-errors';
import { ScenarioContextPiece } from './scenario-context-piece';

/**
 * Holds every {@link ScenarioContextPiece} of one particular type recorded
 * in a {@link ScenarioContext}. Every piece must carry the same, fixed set
 * of qualifier keys, and no two pieces may carry the exact same combination
 * of qualifier values.
 */
export class ScenarioContextPart<Value = unknown> {

    private readonly pieces: Array<ScenarioContextPiece<Value>> = [];

    constructor(private readonly type: Constructor<Value>) {
    }

    qualifierKeys(): ReadonlySet<string> {
        if (this.pieces.length === 0) { throw new Error('Qualifier keys are undetermined; No pieces added yet'); }
        return this.pieces[0].qualifierKeys();
    }

    /**
     * Puts `piece` on top of this part.
     *
     * @throws UnexpectedQualifierKeysError
     *  if `piece`'s qualifier keys don't match the set of keys already
     *  established for this type.
     * @throws DuplicateQualifiersError
     *  if a piece already held by this part carries the exact same
     *  combination of qualifiers.
     */
    add(piece: ScenarioContextPiece<Value>): void {
        if (this.pieces.length > 0 && ! piece.hasSameQualifierKeysAs(this.pieces[0])) {
            throw new UnexpectedQualifierKeysError(this.type, piece.qualifierKeys(), this.qualifierKeys());
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
     * @throws UnknownQualifierKeyError
     *  if `qualifiers` names a key that isn't one of this type's qualifier
     *  keys.
     * @throws PieceNotFoundError
     *  if no piece matches `qualifiers`.
     */
    find(qualifiers: Qualifiers = {}): Value {
        return this.findPiece(qualifiers).value;
    }

    /**
     * Finds the piece qualified by every key/value pair in `qualifiers`,
     * and puts it on top of this part - "in the spotlight". Given every key
     * this type takes, the match is unambiguous; given fewer, whichever
     * match is currently in the spotlight is returned.
     *
     * Reach for this over {@link ScenarioContextPart#find} only when you
     * intend to {@link ScenarioContextPiece#replace} the value once you've
     * read it.
     *
     * @throws UnknownQualifierKeyError
     *  if `qualifiers` names a key that isn't one of this type's qualifier
     *  keys.
     * @throws PieceNotFoundError
     *  if no piece matches `qualifiers`.
     */
    findPiece(qualifiers: Qualifiers = {}): ScenarioContextPiece<Value> {
        if (this.pieces.length > 0) {
            const unknownKeys = Object.keys(qualifiers).filter(key => ! this.qualifierKeys().has(key));

            if (unknownKeys.length > 0) {
                throw new UnknownQualifierKeyError(this.type, this.qualifierKeys(), unknownKeys);
            }
        }

        for (const piece of this.pieces) {
            if (piece.hasQualifiers(qualifiers)) {
                this.pieces.splice(this.pieces.indexOf(piece), 1);
                this.pieces.unshift(piece);

                return piece;
            }
        }

        throw new PieceNotFoundError(this.type, qualifiers);
    }
}
