import { Qualifiers } from './qualifiers';

/**
 * A single piece of information held in a {@link ScenarioContext}.
 *
 * A piece pairs an arbitrary domain object (the {@link ScenarioContextPiece#value})
 * with a set of named `qualifiers` - key/value pairs that make it possible
 * to tell apart several pieces holding objects of the same type, e.g. several
 * `Ticket` instances qualified by their id, or by their priority. Qualifiers,
 * once set, never change; the value can be swapped out via
 * {@link ScenarioContextPiece#replace}.
 */
export class ScenarioContextPiece<Value = unknown> {

    private readonly qualifiers: ReadonlyMap<string, string>;
    private currentValue: Value;

    constructor(
        value: Value,
        qualifiers: Qualifiers = {},
    ) {
        this.currentValue = value;
        this.qualifiers = new Map(Object.entries(qualifiers));
    }

    /**
     * @returns the value currently held by this piece.
     */
    get value(): Value {
        return this.currentValue;
    }

    /**
     * Swaps out the value held by this piece for `newValue`, keeping its
     * qualifiers - and its position wherever it's held - unaffected.
     */
    replace(newValue: Value): void {
        this.currentValue = newValue;
    }

    /**
     * @returns `true` if this piece carries every key/value pair given in
     *  `qualifiers` - regardless of any other keys it might also carry. An
     *  empty object always matches.
     */
    hasQualifiers(qualifiers: Qualifiers): boolean {
        for (const [ key, value ] of Object.entries(qualifiers)) {
            if (this.qualifiers.get(key) !== value) {
                return false;
            }
        }

        return true;
    }

    /**
     * @returns every qualifier recorded against this piece, keyed by name.
     */
    allQualifiers(): ReadonlyMap<string, string> {
        return this.qualifiers;
    }

    /**
     * @returns the set of qualifier keys recorded against this piece.
     */
    qualifierKeys(): ReadonlySet<string> {
        return new Set(this.qualifiers.keys());
    }

    /**
     * @returns `true` if `other` carries the exact same set of qualifier
     *  keys as this piece - neither more, nor fewer - regardless of the
     *  values behind them.
     */
    hasSameQualifierKeysAs(other: ScenarioContextPiece): boolean {
        const otherKeys = other.qualifierKeys();
        const thisKeys = this.qualifierKeys();

        return thisKeys.size === otherKeys.size && [ ...thisKeys ].every(key => otherKeys.has(key));
    }

    /**
     * @returns `true` if `other` is qualified by the exact same combination
     *  of key/value pairs as this piece - neither more, nor fewer.
     */
    hasSameQualifiersAs(other: ScenarioContextPiece): boolean {
        return this.qualifiers.size === other.allQualifiers().size
            && this.hasQualifiers(Object.fromEntries(other.allQualifiers()));
    }
}
