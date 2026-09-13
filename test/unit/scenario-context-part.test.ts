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

    describe('putOnTop', () => {

        it('moves an existing piece to the top, without duplicating it', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');
            const third  = pieceOf(new Fruit('cherry'), 'rainier');

            part.add(first);
            part.add(second);
            part.add(third);

            part.putOnTop(first);

            expect(Array.from(part)).toEqual([ first, third, second ]);
        });

        it('leaves the order unaffected when the piece is already on top', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');

            part.add(first);
            part.add(second);

            part.putOnTop(second);

            expect(Array.from(part)).toEqual([ second, first ]);
        });

        it('throws when the piece has never been added to this part', () => {
            const part = new ScenarioContextPart(Fruit);
            const foreign = pieceOf(new Fruit('apple'));

            expect(() => part.putOnTop(foreign)).toThrow(
                'Could not put the context piece on top because it is not part of this scenario context'
            );
        });
    });

    describe('replace', () => {

        it('swaps an existing piece for a new one, in the same position', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');
            const third  = pieceOf(new Fruit('cherry'), 'rainier');

            part.add(first);
            part.add(second);
            part.add(third);

            // reuses "second"'s own qualifier - replacing a piece with the
            // same qualifiers it already had is exactly what a
            // ScenarioContextHandle#replaceValue does under the hood.
            const replacement = pieceOf(new Fruit('green apple'), 'cavendish');
            part.replace(second, replacement);

            expect(Array.from(part)).toEqual([ third, replacement, first ]);
        });

        it('does not put the replacement in the spotlight', () => {
            const part = new ScenarioContextPart(Fruit);
            const first  = pieceOf(new Fruit('apple'), 'fuji');
            const second = pieceOf(new Fruit('banana'), 'cavendish');  // most recently put

            part.add(first);
            part.add(second);

            const replacement = pieceOf(new Fruit('green apple'), 'fuji');
            part.replace(first, replacement);

            // "second" is still the most recently touched piece - replacing
            // "first" didn't bring its replacement to the top.
            expect(part.findLastUsed().getValue()).toBe(second.value);
        });

        it('throws when the piece to be replaced has never been added to this part', () => {
            const part = new ScenarioContextPart(Fruit);
            const foreign = pieceOf(new Fruit('apple'));
            const replacement = pieceOf(new Fruit('banana'));

            expect(() => part.replace(foreign, replacement)).toThrow(
                'Could not replace the context piece because it is not part of this scenario context'
            );
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

        it('enforces the same number of qualifiers when replacing a piece', () => {
            const part = new ScenarioContextPart(Fruit);
            const original = pieceOf(new Fruit('apple'), 'red');
            part.add(original);

            expect(() => part.replace(original, pieceOf(new Fruit('banana'), 'yellow', 'soft'))).toThrow(
                'Could not add Fruit qualified by 2 qualifier(s) - every Fruit in the scenario context must be '
                + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
            );
        });

        it('lets a piece be replaced by one carrying the exact same qualifiers, without treating it as a clash with itself', () => {
            const part = new ScenarioContextPart(Fruit);
            const original = pieceOf(new Fruit('apple'), 'red');
            part.add(original);
            const replacement = pieceOf(new Fruit('banana'), 'red');

            expect(() => part.replace(original, replacement)).not.toThrow();
            expect(Array.from(part)).toEqual([ replacement ]);
        });

        it('still rejects a replacement whose qualifiers clash with some other piece', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('banana'), 'yellow'));
            const apple = pieceOf(new Fruit('apple'), 'red');
            part.add(apple);

            expect(() => part.replace(apple, pieceOf(new Fruit('bigger apple'), 'yellow'))).toThrow(
                'Could not add Fruit qualified by yellow - a Fruit qualified exactly like that is already part of '
                + 'the scenario context'
            );
        });
    });

    describe('findOne', () => {

        it('returns a handle on the single value of this part\'s type', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple));

            expect(part.findOne().getValue()).toBe(apple);
        });

        it('returns a handle on the single value further narrowed down by qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = new Fruit('apple');
            part.add(pieceOf(apple, 'crunchy', 'red'));

            expect(part.findOne('red').getValue()).toBe(apple);
        });

        it('throws when nothing has been added', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.findOne()).toThrow('Could not find Fruit in the scenario context');
        });

        it('throws when nothing matches the requested qualifiers', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'red'));

            expect(() => part.findOne('green')).toThrow(
                'Could not find Fruit qualified by green in the scenario context'
            );
        });

        it('throws, asking the caller to disambiguate, when more than one value matches', () => {
            const part = new ScenarioContextPart(Fruit);
            // both share the fixed 2-qualifier count, and their full
            // combinations are distinct - only the narrower 'red' query, a
            // subset of both, is ambiguous between them.
            part.add(pieceOf(new Fruit('apple'), 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cherry'), 'red', 'shiny'));

            expect(() => part.findOne('red')).toThrow(
                'Found 2 instances of Fruit qualified by red in the scenario context, expected exactly one. '
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        });

        it('puts the found value in the spotlight, on top of the part', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = pieceOf(new Fruit('apple'), 'crunchy');
            part.add(apple);
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top

            part.findOne('crunchy');

            expect(Array.from(part)[0]).toBe(apple);
        });
    });

    describe('findLastUsed', () => {

        it('returns a handle on the most recently added match, without complaining about the ambiguity', () => {
            const part = new ScenarioContextPart(Fruit);
            // both carry the same fixed, single qualifier - a distinct one
            // each, so the combination stays unique - and a query with no
            // qualifiers at all is a match for either.
            part.add(pieceOf(new Fruit('apple'), 'fuji'));
            const banana = new Fruit('banana');
            part.add(pieceOf(banana, 'cavendish'));

            expect(part.findLastUsed().getValue()).toBe(banana);
        });

        it('still respects any requested qualifiers when picking the most recently used match', () => {
            const part = new ScenarioContextPart(Fruit);
            const crunchyApple = new Fruit('apple');
            part.add(pieceOf(crunchyApple, 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top, but doesn't match

            expect(part.findLastUsed('crunchy').getValue()).toBe(crunchyApple);
        });

        it('throws when nothing has been added', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.findLastUsed()).toThrow('Could not find Fruit in the scenario context');
        });

        it('puts the found value in the spotlight, moving it back to the top', () => {
            const part = new ScenarioContextPart(Fruit);
            const apple = pieceOf(new Fruit('apple'), 'crunchy');
            part.add(apple);
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top

            part.findLastUsed('crunchy');

            expect(Array.from(part)[0]).toBe(apple);
        });
    });

    describe('find', () => {

        it('behaves like findOne() when exactly the fixed number of qualifiers for the type is given', () => {
            const part = new ScenarioContextPart(Fruit);
            // the first Fruit added fixes the count at 2 qualifiers.
            const fuji = new Fruit('fuji apple');
            part.add(pieceOf(fuji, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));

            expect(part.find('red', 'crunchy').getValue()).toBe(fuji);
        });

        it('throws when the fixed number of qualifiers is given but nothing matches', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.find('yellow', 'soft')).toThrow(
                'Could not find Fruit qualified by yellow, soft in the scenario context'
            );
        });

        it('behaves like findLastUsed() when fewer than the fixed number of qualifiers is given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));
            const cavendish = new Fruit('cavendish banana');
            part.add(pieceOf(cavendish, 'yellow', 'soft'));

            expect(part.find().getValue()).toBe(cavendish);
        });

        it('still narrows down which most-recently-used match it settles for', () => {
            const part = new ScenarioContextPart(Fruit);
            const redApple = new Fruit('red delicious');
            part.add(pieceOf(redApple, 'red', 'crunchy'));
            part.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));  // on top, but not red

            expect(part.find('red').getValue()).toBe(redApple);
        });

        it('throws when more qualifiers than the fixed number for the type are given', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => part.find('red', 'crunchy', 'extra')).toThrow(
                'Fruit takes 2 qualifier(s), but 3 were given to find()'
            );
        });

        it('falls back to a plain search when nothing has been added yet', () => {
            const part = new ScenarioContextPart(Fruit);

            expect(() => part.find('red')).toThrow(
                'Could not find Fruit qualified by red in the scenario context'
            );
            expect(() => part.find()).toThrow('Could not find Fruit in the scenario context');
        });
    });

    describe('the returned handle', () => {

        it('lets the found value be replaced, in place, via replaceValue', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));
            part.add(pieceOf(new Fruit('banana'), 'soft'));  // on top

            const found = part.findOne('crunchy');
            const greenApple = new Fruit('green apple');

            found.replaceValue(greenApple);

            expect(found.getValue()).toBe(greenApple);
            expect(Array.from(part)[0].value).toBe(greenApple);
            expect(Array.from(part)).toHaveLength(2);  // no duplicate was created
        });

        it('carries the original qualifiers over to the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy', 'red'));

            const found = part.findOne();
            found.replaceValue(new Fruit('green apple'));

            expect(part.findOne('crunchy', 'red').getValue()).toBeInstanceOf(Fruit);
        });

        it('lets a later search find the replacement value', () => {
            const part = new ScenarioContextPart(Fruit);
            part.add(pieceOf(new Fruit('apple'), 'crunchy'));

            const found = part.findOne();
            const greenApple = new Fruit('green apple');
            found.replaceValue(greenApple);

            expect(part.findOne('crunchy').getValue()).toBe(greenApple);
        });
    });

    it('does not confuse values of different types - each part only ever holds its own type', () => {
        const fruit = new ScenarioContextPart(Fruit);
        const vegetable = new ScenarioContextPart(Vegetable);
        const carrot = new Vegetable('carrot');
        vegetable.add(pieceOf(carrot));

        expect(vegetable.findOne().getValue()).toBe(carrot);
        expect(() => fruit.findOne()).toThrow();
    });
});

function pieceOf<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
