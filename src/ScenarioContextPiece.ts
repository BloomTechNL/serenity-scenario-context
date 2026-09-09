/**
 * A single piece of information held in a {@link ScenarioContext}.
 *
 * A piece pairs an arbitrary domain object (the {@link ScenarioContextPiece#value})
 * with a set of free-form `qualifiers` - short labels that make it possible
 * to tell apart several pieces holding objects of the same type, e.g. several
 * `Ticket` instances qualified by their id, or by their priority.
 *
 * `ScenarioContextPiece` instances are immutable: once created, neither the
 * `value` nor its qualifiers can be swapped out. To change the qualifiers
 * associated with a domain object, create a new piece and put it on top of
 * the {@link ScenarioContext} instead.
 */
export class ScenarioContextPiece<Value = unknown> {

    private readonly qualifiers: ReadonlySet<string>;

    constructor(
        public readonly value: Value,
        qualifiers: Iterable<string> = [],
    ) {
        this.qualifiers = new Set(qualifiers);
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
}
