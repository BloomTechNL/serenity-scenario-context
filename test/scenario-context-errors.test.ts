import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    UnexpectedQualifierKeysError,
    UnknownQualifierKeyError,
} from '../src/index';

class Fruit {
}

describe('UnexpectedQualifierKeysError', () => {

    it('names the type, the keys it was given, and the keys expected', () => {
        const error = new UnexpectedQualifierKeysError(Fruit, new Set([ 'color', 'texture' ]), new Set([ 'color' ]));

        expect(error.message).toBe(
            'Could not add Fruit qualified by color, texture - every Fruit in the scenario context must be '
            + 'qualified by exactly color, as established when the first one was added'
        );
    });

    it('describes an empty set of keys as "no keys"', () => {
        const error = new UnexpectedQualifierKeysError(Fruit, new Set(), new Set([ 'color' ]));

        expect(error.message).toBe(
            'Could not add Fruit qualified by no keys - every Fruit in the scenario context must be '
            + 'qualified by exactly color, as established when the first one was added'
        );
    });

    it('is a plain Error, named after itself', () => {
        const error = new UnexpectedQualifierKeysError(Fruit, new Set([ 'color', 'texture' ]), new Set([ 'color' ]));

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('UnexpectedQualifierKeysError');
    });
});

describe('DuplicateQualifiersError', () => {

    it('names the type and the clashing combination of qualifiers', () => {
        const error = new DuplicateQualifiersError(Fruit, new Map([ [ 'color', 'red' ], [ 'texture', 'crunchy' ] ]));

        expect(error.message).toBe(
            'Could not add Fruit qualified by color=red, texture=crunchy - a Fruit qualified exactly like that is '
            + 'already part of the scenario context'
        );
    });

    it('describes an empty combination as "no qualifiers"', () => {
        const error = new DuplicateQualifiersError(Fruit, new Map());

        expect(error.message).toBe(
            'Could not add Fruit qualified by no qualifiers - a Fruit qualified exactly like that is already '
            + 'part of the scenario context'
        );
    });

    it('is a plain Error, named after itself', () => {
        const error = new DuplicateQualifiersError(Fruit, new Map());

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('DuplicateQualifiersError');
    });
});

describe('UnknownQualifierKeyError', () => {

    it('names the type, the keys it takes, and the key(s) that are not among them', () => {
        const error = new UnknownQualifierKeyError(Fruit, new Set([ 'color', 'texture' ]), [ 'ripeness' ]);

        expect(error.message).toBe('Fruit is qualified by color, texture, but ripeness is not among them');
    });

    it('uses the plural "are" when more than one unknown key is given', () => {
        const error = new UnknownQualifierKeyError(Fruit, new Set([ 'color' ]), [ 'ripeness', 'weight' ]);

        expect(error.message).toBe('Fruit is qualified by color, but ripeness, weight are not among them');
    });

    it('is a plain Error, named after itself', () => {
        const error = new UnknownQualifierKeyError(Fruit, new Set([ 'color' ]), [ 'ripeness' ]);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('UnknownQualifierKeyError');
    });
});

describe('PieceNotFoundError', () => {

    it('names the type and the requested qualifiers', () => {
        const error = new PieceNotFoundError(Fruit, { color: 'red' });

        expect(error.message).toBe('Could not find Fruit qualified by color=red in the scenario context');
    });

    it('omits the qualifiers when none were requested', () => {
        const error = new PieceNotFoundError(Fruit, {});

        expect(error.message).toBe('Could not find Fruit in the scenario context');
    });

    it('is a plain Error, named after itself', () => {
        const error = new PieceNotFoundError(Fruit, {});

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('PieceNotFoundError');
    });
});
