/**
 * A fake domain type used to demonstrate storing contact information in a
 * scenario context that's shared between several actors, disambiguated by
 * qualifying each piece with the name of the actor it belongs to.
 */
export class HomeAddress {
    constructor(
        public readonly value: string,
    ) {
    }
}
