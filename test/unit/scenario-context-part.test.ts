import {
    DuplicateQualifiersError,
    PieceNotFoundError,
    ScenarioContextPart,
    ScenarioContextPiece,
    TooManyQualifiersError,
    UnexpectedQualifierCountError,
} from '../../src';

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

            part.add(pieceOf(first, 'fuji'));
            part.add(pieceOf(second, 'cavendish'));

            expect(part.find()).toBe(second);
        });
    });

    describe('the fixed qualifier count', () => {

        it('is undefined before any piece is added', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(part.numberOfQualifiers()).toBeUndefined();
        });

        it('is established by however many qualifiers the first piece added carries', () => {
            const part = new ScenarioContextPart(Fruit);

            part.add(pieceOf(new Fruit('apple'), 'red', 'crunchy'));

            expect(part.numberOfQualifiers()).toBe(2);
        });

        it('rejects a later piece carrying a different number of qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'red'));

            expect(() => part.add(pieceOf(new Fruit('banana'), 'yellow', 'soft'))).toThrow(UnexpectedQualifierCountError);
            expect(() => part.add(pieceOf(new Fruit('banana'), 'yellow', 'soft'))).toThrow(
                'Could not add Fruit qualified by 2 qualifier(s) - every Fruit in the scenario context must be '
                + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
            );
        });

        it('rejects a later piece sharing the exact same combination of qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'red', 'crunchy'));

            expect(() => part.add(pieceOf(new Fruit('cherry'), 'crunchy', 'red'))).toThrow(DuplicateQualifiersError);
            expect(() => part.add(pieceOf(new Fruit('cherry'), 'crunchy', 'red'))).toThrow(
                'Could not add Fruit qualified by crunchy, red - a Fruit qualified exactly like that is already '
                + 'part of the scenario context'
            );
        });

        it('allows several pieces as long as their combination of qualifiers differs', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            const banana = new Fruit('banana');
            part.add(pieceOf(apple, 'red'));
            part.add(pieceOf(banana, 'yellow'));

            expect(part.find('red')).toBe(apple);
            expect(part.find('yellow')).toBe(banana);
        });
    });

    describe('findPiece', () => {

        it('returns the piece holding the single value of this part\'s type', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple));

            expect(part.findPiece().value).toBe(apple);
        });

        it('behaves like an exact-match search when exactly the fixed number of qualifiers for the type is given', () => {
            const part = new ScenarioContextPart(Fruit);
            const fuji = new Fruit('fuji apple');
            part.add(pieceOf(fuji, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));

            expect(part.findPiece('red', 'crunchy').value).toBe(fuji);
        });

        it('throws when the fixed number of qualifiers is given but nothing matches', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.findPiece('yellow', 'soft')).toThrow(PieceNotFoundError);
            expect(() => part.findPiece('yellow', 'soft')).toThrow(
                'Could not find Fruit qualified by yellow, soft in the scenario context'
            );
        });

        it('can never be ambiguous when given exactly the fixed number of qualifiers - the uniqueness invariant rules that out', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cherry'), 'red', 'shiny'));

            expect(part.findPiece('red', 'crunchy').value).toBe(apple);
        });

        it('falls back to the most recently used match, without complaining about ambiguity, when fewer than the fixed number of qualifiers is given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));
            const cavendish = new Fruit('cavendish banana');
            part.add(pieceOf(cavendish, 'yellow', 'soft'));

            expect(part.findPiece().value).toBe(cavendish);
        });

        it('still narrows down which most-recently-used match it settles for', () => {
            const part = new ScenarioContextPart(Fruit);
            const redApple = new Fruit('red delicious');
            part.add(pieceOf(redApple, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));

            expect(part.findPiece('red').value).toBe(redApple);
        });

        it('throws when more qualifiers than the fixed number for the type are given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.findPiece('red', 'crunchy', 'extra')).toThrow(TooManyQualifiersError);
            expect(() => part.findPiece('red', 'crunchy', 'extra')).toThrow(
                'Fruit takes 2 qualifier(s), but 3 were given to find()'
            );
        });

        it('throws when nothing has been added yet', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.findPiece('red')).toThrow(PieceNotFoundError);
            expect(() => part.findPiece('red')).toThrow(
                'Could not find Fruit qualified by red in the scenario context'
            );
            expect(() => part.findPiece()).toThrow('Could not find Fruit in the scenario context');
        });

        it('puts the found value in the spotlight, on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));

            part.findPiece('crunchy');

            expect(part.findPiece().value).toBe(apple);
        });

        it('lets the found value be replaced, in place, via replace', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));

            const found = part.findPiece('crunchy');
            const greenApple = new Fruit('green apple');

            found.replace(greenApple);

            expect(found.value).toBe(greenApple);
        });

        it('carries the original qualifiers over to the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy', 'red'));

            const found = part.findPiece();
            found.replace(new Fruit('green apple'));

            expect(part.findPiece('crunchy', 'red').value).toBeInstanceOf(Fruit);
        });

        it('lets a later search find the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));

            const found = part.findPiece();
            const greenApple = new Fruit('green apple');
            found.replace(greenApple);

            expect(part.findPiece('crunchy').value).toBe(greenApple);
        });
    });

    describe('find', () => {

        it('returns the value of the piece findPiece would find, rather than the piece itself', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'crunchy'));

            expect(part.find('crunchy')).toBe(apple);
        });

        it('resolves qualifiers, and puts the match in the spotlight, exactly as findPiece does', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));

            part.find('crunchy');

            expect(part.find()).toBe(apple);
        });

        it('throws the same errors as findPiece', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'red'));

            expect(() => part.find('red', 'extra')).toThrow(TooManyQualifiersError);
            expect(() => part.find('green')).toThrow(PieceNotFoundError);
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

function pieceOf<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
