import { ScenarioContextPart, ScenarioContextPiece } from '../../src';

// Two unrelated fixture types, used to prove that the fixed-qualifier-count
// and uniqueness constraints - and the recency order - are a part's own
// concern, tracked separately per type.
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
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');

            part.add(first);
            part.add(second);

            expect(Array.from(part)).toEqual([ second, first ]);
        });
    });

    describe('iterating', () => {

        it('yields the pieces from top (most recently put) to bottom (least recently put)', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');
            const third  = pieceOf(new Fruit('cherry'), 'rainier');

            part.add(first);
            part.add(second);
            part.add(third);

            expect(Array.from(part)).toEqual([ third, second, first ]);
        });

        it('can be iterated over more than once, and with a for-of loop', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');

            part.add(first);
            part.add(second);

            const collected: ScenarioContextPiece<Fruit>[] = [];
            for (const piece of part) {
                collected.push(piece);
            }

            expect(collected).toEqual([ second, first ]);
            expect(Array.from(part)).toEqual([ second, first ]);
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

            expect(() => part.add(pieceOf(new Fruit('banana'), 'yellow', 'soft'))).toThrow(
                'Could not add Fruit qualified by 2 qualifier(s) - every Fruit in the scenario context must be '
                + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
            );
        });

        it('rejects a later piece sharing the exact same combination of qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'red', 'crunchy'));

            expect(() => part.add(pieceOf(new Fruit('cherry'), 'crunchy', 'red'))).toThrow(
                'Could not add Fruit qualified by crunchy, red - a Fruit qualified exactly like that is already '
                + 'part of the scenario context'
            );
        });

        it('allows several pieces as long as their combination of qualifiers differs', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = pieceOf(new Fruit('apple'), 'red');
            const banana = pieceOf(new Fruit('banana'), 'yellow');
            part.add(apple);
            part.add(banana);

            expect(Array.from(part)).toEqual([ banana, apple ]);
        });
    });

    describe('find', () => {

        it('returns the piece holding the single value of this part\'s type', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple));

            expect(part.find().value).toBe(apple);
        });

        it('behaves like an exact-match search when exactly the fixed number of qualifiers for the type is given', () => {
            const part = new ScenarioContextPart(Fruit);
            // the first Fruit added fixes the count at 2 qualifiers.
            const fuji = new Fruit('fuji apple');
            part.add(pieceOf(fuji, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));

            expect(part.find('red', 'crunchy').value).toBe(fuji);
        });

        it('throws when the fixed number of qualifiers is given but nothing matches', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.find('yellow', 'soft')).toThrow(
                'Could not find Fruit qualified by yellow, soft in the scenario context'
            );
        });

        it('can never be ambiguous when given exactly the fixed number of qualifiers - the uniqueness invariant rules that out', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'red', 'crunchy'));
            // a second Fruit qualified by 'red' too, but not the exact same
            // combination - the uniqueness invariant means no piece other
            // than "apple" can ever match a 2-qualifier query of 'red'
            // plus anything else "apple" is qualified by.
            part.add(pieceOf(new Fruit('cherry'), 'red', 'shiny'));

            expect(part.find('red', 'crunchy').value).toBe(apple);
        });

        it('falls back to the most recently used match, without complaining about ambiguity, when fewer than the fixed number of qualifiers is given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));
            const cavendish = new Fruit('cavendish banana');
            part.add(pieceOf(cavendish, 'yellow', 'soft'));

            expect(part.find().value).toBe(cavendish);
        });

        it('still narrows down which most-recently-used match it settles for', () => {
            const part = new ScenarioContextPart(Fruit);
            const redApple = new Fruit('red delicious');
            part.add(pieceOf(redApple, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));  // on top, but not red

            expect(part.find('red').value).toBe(redApple);
        });

        it('throws when more qualifiers than the fixed number for the type are given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.find('red', 'crunchy', 'extra')).toThrow(
                'Fruit takes 2 qualifier(s), but 3 were given to find()'
            );
        });

        it('throws when nothing has been added yet', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.find('red')).toThrow(
                'Could not find Fruit qualified by red in the scenario context'
            );
            expect(() => part.find()).toThrow('Could not find Fruit in the scenario context');
        });

        it('puts the found value in the spotlight, on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = pieceOf(new Fruit('apple'), 'crunchy');
            part.add(apple);
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top

            part.find('crunchy');

            expect(Array.from(part)[0]).toBe(apple);
        });
    });

    describe('the returned piece', () => {

        it('lets the found value be replaced, in place, via replace', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top

            const found = part.find('crunchy');
            const greenApple = new Fruit('green apple');

            found.replace(greenApple);

            expect(found.value).toBe(greenApple);
            expect(Array.from(part)[0].value).toBe(greenApple);
            expect(Array.from(part)).toHaveLength(2);  // no duplicate was created
        });

        it('carries the original qualifiers over to the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy', 'red'));

            const found = part.find();
            found.replace(new Fruit('green apple'));

            expect(part.find('crunchy', 'red').value).toBeInstanceOf(Fruit);
        });

        it('lets a later search find the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));

            const found = part.find();
            const greenApple = new Fruit('green apple');
            found.replace(greenApple);

            expect(part.find('crunchy').value).toBe(greenApple);
        });
    });

    it('does not confuse values of different types - each part only ever holds its own type', () => {
        const fruit = new ScenarioContextPart(Fruit);
        const vegetable = new ScenarioContextPart(Vegetable);
        const carrot = new Vegetable('carrot');
        vegetable.add(pieceOf(carrot));

        expect(vegetable.find().value).toBe(carrot);
        expect(() => fruit.find()).toThrow();
    });
});

function pieceOf<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
