import { Constructor } from './constructor';
import { Qualifiers } from './qualifiers';

function describeKeys(keys: Iterable<string>): string {
    const sorted = [ ...keys ].sort();

    return sorted.length > 0 ? sorted.join(', ') : 'no keys';
}

function describeQualifiers(qualifiers: ReadonlyMap<string, string> | Qualifiers): string {
    const entries = qualifiers instanceof Map ? [ ...qualifiers.entries() ] : Object.entries(qualifiers);
    const sorted = entries.map(([ key, value ]) => `${ key }=${ value }`).sort();

    return sorted.length > 0 ? sorted.join(', ') : 'no qualifiers';
}

/**
 * Thrown by {@link ScenarioContextPart#add} when a piece is added whose set
 * of qualifier keys doesn't match the set already established for its type.
 */
export class UnexpectedQualifierKeysError extends Error {

    constructor(type: Constructor<unknown>, actualKeys: ReadonlySet<string>, expectedKeys: ReadonlySet<string>) {
        super(
            `Could not add ${ type.name } qualified by ${ describeKeys(actualKeys) } - every ${ type.name } `
            + `in the scenario context must be qualified by exactly ${ describeKeys(expectedKeys) }, `
            + 'as established when the first one was added'
        );
        this.name = 'UnexpectedQualifierKeysError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#add} when a piece is added carrying
 * the exact same combination of qualifiers as one already held by the part.
 */
export class DuplicateQualifiersError extends Error {

    constructor(type: Constructor<unknown>, qualifiers: ReadonlyMap<string, string>) {
        super(
            `Could not add ${ type.name } qualified by ${ describeQualifiers(qualifiers) } - a ${ type.name } `
            + 'qualified exactly like that is already part of the scenario context'
        );
        this.name = 'DuplicateQualifiersError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#find} when it's given a qualifier
 * key that isn't one of the keys established for its type.
 */
export class UnknownQualifierKeyError extends Error {

    constructor(type: Constructor<unknown>, expectedKeys: ReadonlySet<string>, unknownKeys: string[]) {
        super(
            `${ type.name } is qualified by ${ describeKeys(expectedKeys) }, but ${ [ ...unknownKeys ].sort().join(', ') } `
            + `${ unknownKeys.length === 1 ? 'is' : 'are' } not among them`
        );
        this.name = 'UnknownQualifierKeyError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#find} when no piece matches the
 * requested qualifiers.
 */
export class PieceNotFoundError extends Error {

    constructor(type: Constructor<unknown>, qualifiers: Qualifiers) {
        const entries = Object.entries(qualifiers);
        const description = entries.length > 0
            ? `${ type.name } qualified by ${ describeQualifiers(qualifiers) } in the scenario context`
            : `${ type.name } in the scenario context`;

        super(`Could not find ${ description }`);
        this.name = 'PieceNotFoundError';
    }
}
