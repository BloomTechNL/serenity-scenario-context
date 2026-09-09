/**
 * A second fake domain type, used to demonstrate that `UseScenarioContext`
 * tells pieces of context apart by type as well as by qualifiers - even
 * when several kinds of objects are being tracked in the same scenario.
 */
export class Customer {
    constructor(
        public readonly name: string,
    ) {
    }
}
