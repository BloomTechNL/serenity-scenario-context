import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    TooManyQualifiersError,
    UnexpectedQualifierCountError,
} from '../../src';

class Fruit {
}

describe('UnexpectedQualifierCountError', () => {

    it('names the type, how many qualifiers it was given, and how many are expected', () => {
        const error = new UnexpectedQualifierCountError(Fruit, 2, 1);

        expect(error.message).toBe(
            'Could not add Fruit qualified by 2 qualifier(s) - every Fruit in the scenario context must be '
            + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
        );
    });

    it('is a plain Error, named after itself', () => {
        const error = new UnexpectedQualifierCountError(Fruit, 2, 1);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('UnexpectedQualifierCountError');
    });
});

describe('DuplicateQualifiersError', () => {

    it('names the type and the clashing combination of qualifiers', () => {
        const error = new DuplicateQualifiersError(Fruit, new Set([ 'red', 'crunchy' ]));

        expect(error.message).toBe(
            'Could not add Fruit qualified by red, crunchy - a Fruit qualified exactly like that is already '
            + 'part of the scenario context'
        );
    });

    it('describes an empty combination as "no qualifiers"', () => {
        const error = new DuplicateQualifiersError(Fruit, new Set());

        expect(error.message).toBe(
            'Could not add Fruit qualified by no qualifiers - a Fruit qualified exactly like that is already '
            + 'part of the scenario context'
        );
    });

    it('is a plain Error, named after itself', () => {
        const error = new DuplicateQualifiersError(Fruit, new Set());

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('DuplicateQualifiersError');
    });
});

describe('TooManyQualifiersError', () => {

    it('names the type and how many qualifiers it takes versus how many were given', () => {
        const error = new TooManyQualifiersError(Fruit, 1, 3);

        expect(error.message).toBe('Fruit takes 1 qualifier(s), but 3 were given to find()');
    });

    it('uses the singular "was" when exactly one too many qualifiers was given', () => {
        const error = new TooManyQualifiersError(Fruit, 0, 1);

        expect(error.message).toBe('Fruit takes 0 qualifier(s), but 1 was given to find()');
    });

    it('is a plain Error, named after itself', () => {
        const error = new TooManyQualifiersError(Fruit, 1, 3);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('TooManyQualifiersError');
    });
});

describe('PieceNotFoundError', () => {

    it('names the type and the requested qualifiers', () => {
        const error = new PieceNotFoundError(Fruit, [ 'red' ]);

        expect(error.message).toBe('Could not find Fruit qualified by red in the scenario context');
    });

    it('omits the qualifiers when none were requested', () => {
        const error = new PieceNotFoundError(Fruit, []);

        expect(error.message).toBe('Could not find Fruit in the scenario context');
    });

    it('is a plain Error, named after itself', () => {
        const error = new PieceNotFoundError(Fruit, []);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('PieceNotFoundError');
    });
});
