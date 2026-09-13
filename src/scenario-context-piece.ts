/**
 * A single piece of information held in a {@link ScenarioContext}.
 *
 * A piece pairs an arbitrary domain object (the {@link ScenarioContextPiece#value})
 * with a set of free-form `qualifiers` - short labels that make it possible
 * to tell apart several pieces holding objects of the same type, e.g. several
 * `Ticket` instances qualified by their id, or by their priority.
 *
 * A piece's qualifiers, once set, never change - they're what a
 * {@link ScenarioContextPart} uses to tell same-typed pieces apart, so
 * swapping them out from under it would be unsound. Its `value` can be
 * swapped out, though, via {@link ScenarioContextPiece#replace} - which
 * updates what a piece holds without disturbing its identity, its
 * qualifiers, or its position in the {@link ScenarioContextPart} that holds
 * it. This is what {@link ScenarioContextPart#findPiece} returns - reach
 * for that, rather than {@link ScenarioContextPart#find}, whenever you'll
 * want to update the value in place once you've found it:
 *
 * ```ts
 * const ticket = UseScenarioContext.as(actor).findPiece(Ticket);
 *
 * ticket.replace(ticket.value.resolve());
 *
 * // subsequent searches, and this piece, now see the resolved ticket:
 * ticket.value.status; // 'resolved'
 * ```
 */
export class ScenarioContextPiece<Value = unknown> {

    private readonly qualifiers: ReadonlySet<string>;
    private currentValue: Value;

    constructor(
        value: Value,
        qualifiers: Iterable<string> = [],
    ) {
        this.currentValue = value;
        this.qualifiers = new Set(qualifiers);
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
     * @returns `true` if this piece is qualified by every one of the given
     *  `qualifiers` (in any order). An empty list of `qualifiers` always
     *  matches.
     */
    hasQualifiers(qualifiers: Iterable<string>): boolean {
        for (const qualifier of qualifiers) {
            if (! this.qualifiers.has(qualifier)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @returns all the qualifiers recorded against this piece.
     */
    allQualifiers(): ReadonlySet<string> {
        return this.qualifiers;
    }

    /**
     * @returns `true` if `other` is qualified by the exact same combination
     *  of qualifiers as this piece - neither more, nor fewer.
     */
    hasSameQualifiersAs(other: ScenarioContextPiece): boolean {
        return this.qualifiers.size === other.allQualifiers().size && this.hasQualifiers(other.allQualifiers());
    }
}
