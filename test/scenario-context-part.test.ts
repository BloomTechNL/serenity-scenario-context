import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    Qualifiers,
    ScenarioContextPart,
    ScenarioContextPiece,
    UnexpectedQualifierKeysError,
    UnknownQualifierKeyError,
} from '../src/index';

class Fruit {
    constructor(public readonly name: string) {
    }
}

class Vegetable {
    constructor(public readonly name: string) {
    }
}

describe('ScenarioContextPart', () => {

    describe('add', () => {

        it('places a new piece on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            const first = new Fruit('apple');
            const second = new Fruit('banana');

            part.add(pieceOf(first, { variety: 'fuji' }));
            part.add(pieceOf(second, { variety: 'cavendish' }));

            expect(part.find()).toBe(second);
        });
    });

    describe('the fixed set of qualifier keys', () => {

        it('rejects a later piece carrying a different set of qualifier keys', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { color: 'red' }));

            expect(() => part.add(pieceOf(new Fruit('banana'), { color: 'yellow', texture: 'soft' })))
                .toThrow(UnexpectedQualifierKeysError);
            expect(() => part.add(pieceOf(new Fruit('banana'), { color: 'yellow', texture: 'soft' }))).toThrow(
                'Could not add Fruit qualified by color, texture - every Fruit in the scenario context must be '
                + 'qualified by exactly color, as established when the first one was added'
            );
        });

        it('rejects a later piece sharing the exact same combination of qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { color: 'red', texture: 'crunchy' }));

            expect(() => part.add(pieceOf(new Fruit('cherry'), { texture: 'crunchy', color: 'red' })))
                .toThrow(DuplicateQualifiersError);
            expect(() => part.add(pieceOf(new Fruit('cherry'), { texture: 'crunchy', color: 'red' }))).toThrow(
                'Could not add Fruit qualified by color=red, texture=crunchy - a Fruit qualified exactly like '
                + 'that is already part of the scenario context'
            );
        });

        it('allows several pieces as long as their combination of qualifiers differs', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            const banana = new Fruit('banana');
            part.add(pieceOf(apple, { color: 'red' }));
            part.add(pieceOf(banana, { color: 'yellow' }));

            expect(part.find({ color: 'red' })).toBe(apple);
            expect(part.find({ color: 'yellow' })).toBe(banana);
        });
    });

    describe('addOrReplace', () => {

        it('adds a new piece when none matches its qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');

            part.addOrReplace(pieceOf(apple, { variety: 'fuji' }));

            expect(part.find({ variety: 'fuji' })).toBe(apple);
        });

        it('returns the piece that was added, for convenience', () => {
            const part = new ScenarioContextPart(Fruit);
            const piece = pieceOf(new Fruit('apple'), { variety: 'fuji' });

            expect(part.addOrReplace(piece)).toBe(piece);
        });

        it('replaces the value of the existing piece sharing the exact same combination of qualifiers, rather than throwing', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { variety: 'fuji' }));
            const greenApple = new Fruit('green apple');

            part.addOrReplace(pieceOf(greenApple, { variety: 'fuji' }));

            expect(part.find({ variety: 'fuji' })).toBe(greenApple);
        });

        it('returns the existing piece, now holding the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            const original = pieceOf(new Fruit('apple'), { variety: 'fuji' });
            part.add(original);
            const greenApple = new Fruit('green apple');

            const result = part.addOrReplace(pieceOf(greenApple, { variety: 'fuji' }));

            expect(result).toBe(original);
            expect(result.value).toBe(greenApple);
        });

        it('does not create a second piece when replacing', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { variety: 'fuji' }));
            part.addOrReplace(pieceOf(new Fruit('green apple'), { variety: 'fuji' }));

            part.findPiece({ variety: 'fuji' });

            expect(() => part.findPiece()).not.toThrow();
        });

        it('puts the replaced piece in the spotlight, on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { variety: 'fuji' }));
            part.add(pieceOf(new Fruit('banana'), { variety: 'cavendish' }));

            const greenApple = new Fruit('green apple');
            part.addOrReplace(pieceOf(greenApple, { variety: 'fuji' }));

            expect(part.find()).toBe(greenApple);
        });

        it('rejects a piece carrying a different set of qualifier keys, just like add', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { color: 'red' }));

            expect(() => part.addOrReplace(pieceOf(new Fruit('banana'), { color: 'yellow', texture: 'soft' })))
                .toThrow(UnexpectedQualifierKeysError);
        });
    });

    describe('findPiece', () => {

        it('returns the piece holding the single value of this part\'s type', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple));

            expect(part.findPiece().value).toBe(apple);
        });

        it('behaves like an exact-match search when every qualifier key for the type is given', () => {
            const part = new ScenarioContextPart(Fruit);
            const fuji = new Fruit('fuji apple');
            part.add(pieceOf(fuji, { color: 'red', texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('cavendish banana'), { color: 'yellow', texture: 'soft' }));

            expect(part.findPiece({ color: 'red', texture: 'crunchy' }).value).toBe(fuji);
        });

        it('throws when every qualifier key is given but nothing matches', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), { color: 'red', texture: 'crunchy' }));

            expect(() => part.findPiece({ color: 'yellow', texture: 'soft' })).toThrow(PieceNotFoundError);
            expect(() => part.findPiece({ color: 'yellow', texture: 'soft' })).toThrow(
                'Could not find Fruit qualified by color=yellow, texture=soft in the scenario context'
            );
        });

        it('can never be ambiguous when given every qualifier key - the uniqueness invariant rules that out', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, { color: 'red', texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('cherry'), { color: 'red', texture: 'shiny' }));

            expect(part.findPiece({ color: 'red', texture: 'crunchy' }).value).toBe(apple);
        });

        it('falls back to the most recently used match, without complaining about ambiguity, when fewer keys than the type takes are given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), { color: 'red', texture: 'crunchy' }));
            const cavendish = new Fruit('cavendish banana');
            part.add(pieceOf(cavendish, { color: 'yellow', texture: 'soft' }));

            expect(part.findPiece().value).toBe(cavendish);
        });

        it('still narrows down which most-recently-used match it settles for', () => {
            const part = new ScenarioContextPart(Fruit);
            const redApple = new Fruit('red delicious');
            part.add(pieceOf(redApple, { color: 'red', texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('cavendish banana'), { color: 'yellow', texture: 'soft' }));

            expect(part.findPiece({ color: 'red' }).value).toBe(redApple);
        });

        it('throws when given a key that is not one of the type\'s qualifier keys', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), { color: 'red', texture: 'crunchy' }));

            expect(() => part.findPiece({ color: 'red', ripeness: 'ripe' })).toThrow(UnknownQualifierKeyError);
            expect(() => part.findPiece({ color: 'red', ripeness: 'ripe' })).toThrow(
                'Fruit is qualified by color, texture, but ripeness is not among them'
            );
        });

        it('throws when nothing has been added yet', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.findPiece({ color: 'red' })).toThrow(PieceNotFoundError);
            expect(() => part.findPiece({ color: 'red' })).toThrow(
                'Could not find Fruit qualified by color=red in the scenario context'
            );
            expect(() => part.findPiece()).toThrow('Could not find Fruit in the scenario context');
        });

        it('puts the found value in the spotlight, on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, { texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('banana'), { texture: 'soft' }));

            part.findPiece({ texture: 'crunchy' });

            expect(part.findPiece().value).toBe(apple);
        });

        it('lets the found value be replaced, in place, via replace', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('banana'), { texture: 'soft' }));

            const found = part.findPiece({ texture: 'crunchy' });
            const greenApple = new Fruit('green apple');

            found.replace(greenApple);

            expect(found.value).toBe(greenApple);
        });

        it('carries the original qualifiers over to the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { texture: 'crunchy', color: 'red' }));

            const found = part.findPiece();
            found.replace(new Fruit('green apple'));

            expect(part.findPiece({ texture: 'crunchy', color: 'red' }).value).toBeInstanceOf(Fruit);
        });

        it('lets a later search find the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { texture: 'crunchy' }));

            const found = part.findPiece();
            const greenApple = new Fruit('green apple');
            found.replace(greenApple);

            expect(part.findPiece({ texture: 'crunchy' }).value).toBe(greenApple);
        });
    });

    describe('find', () => {

        it('returns the value of the piece findPiece would find, rather than the piece itself', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, { texture: 'crunchy' }));

            expect(part.find({ texture: 'crunchy' })).toBe(apple);
        });

        it('resolves qualifiers, and puts the match in the spotlight, exactly as findPiece does', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, { texture: 'crunchy' }));
            part.add(pieceOf(new Fruit('banana'), { texture: 'soft' }));

            part.find({ texture: 'crunchy' });

            expect(part.find()).toBe(apple);
        });

        it('throws the same errors as findPiece', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), { color: 'red' }));

            expect(() => part.find({ color: 'red', extra: 'x' })).toThrow(UnknownQualifierKeyError);
            expect(() => part.find({ color: 'green' })).toThrow(PieceNotFoundError);
        });
    });

    it('does not confuse values of different types - each part only ever holds its own type', () => {
        const fruit = new ScenarioContextPart(Fruit);
        const vegetable = new ScenarioContextPart(Vegetable);
        const carrot = new Vegetable('carrot');
        vegetable.add(pieceOf(carrot));

        expect(vegetable.find()).toBe(carrot);
        expect(() => fruit.find()).toThrow();
    });
});

function pieceOf<Value extends object>(value: Value, qualifiers: Qualifiers = {}): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
