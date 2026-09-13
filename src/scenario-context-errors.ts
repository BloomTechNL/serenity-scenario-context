import { Constructor } from './constructor';

/**
 * Thrown by {@link ScenarioContextPart#add} when a piece is added whose
 * number of qualifiers doesn't match the number already established for
 * its type.
 */
export class UnexpectedQualifierCountError extends Error {

    constructor(type: Constructor<unknown>, actualCount: number, expectedCount: number) {
        super(
            `Could not add ${ type.name } qualified by ${ actualCount } qualifier(s) - every ${ type.name } `
            + `in the scenario context must be qualified by exactly ${ expectedCount } qualifier(s), `
            + 'as established when the first one was added'
        );
        this.name = 'UnexpectedQualifierCountError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#add} when a piece is added carrying
 * the exact same combination of qualifiers as one already held by the part.
 */
export class DuplicateQualifiersError extends Error {

    constructor(type: Constructor<unknown>, qualifiers: ReadonlySet<string>) {
        const description = [ ...qualifiers ].join(', ') || 'no qualifiers';

        super(
            `Could not add ${ type.name } qualified by ${ description } - a ${ type.name } `
            + 'qualified exactly like that is already part of the scenario context'
        );
        this.name = 'DuplicateQualifiersError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#find} when it's given more
 * qualifiers than its type takes.
 */
export class TooManyQualifiersError extends Error {

    constructor(type: Constructor<unknown>, expectedCount: number, actualCount: number) {
        super(
            `${ type.name } takes ${ expectedCount } qualifier(s), but ${ actualCount } `
            + `${ actualCount === 1 ? 'was' : 'were' } given to find()`
        );
        this.name = 'TooManyQualifiersError';
    }
}

/**
 * Thrown by {@link ScenarioContextPart#find} when no piece matches the
 * requested qualifiers.
 */
export class PieceNotFoundError extends Error {

    constructor(type: Constructor<unknown>, qualifiers: string[]) {
        const description = qualifiers.length > 0
            ? `${ type.name } qualified by ${ qualifiers.join(', ') } in the scenario context`
            : `${ type.name } in the scenario context`;

        super(`Could not find ${ description }`);
        this.name = 'PieceNotFoundError';
    }
}
