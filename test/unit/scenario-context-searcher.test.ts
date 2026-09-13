import { ScenarioContext, ScenarioContextPiece, ScenarioContextSearcher } from '../../src';

// Two unrelated fixture types, used to prove that a search filters by type
// as well as by qualifiers.
class Fruit {
    constructor(public readonly name: string) {
    }
}

class Vegetable {
    constructor(public readonly name: string) {
    }
}

describe('ScenarioContextSearcher', () => {

    describe('findOne', () => {

        it('returns a handle on the single value of the requested type', () => {
            const context = new ScenarioContext();
            const apple = context.add(pieceOf(new Fruit('apple'))).value;

            expect(new ScenarioContextSearcher(context, Fruit).findOne().getValue()).toBe(apple);
        });

        it('returns a handle on the single value further narrowed down by qualifiers', () => {
            const context = new ScenarioContext();
            const apple = context.add(pieceOf(new Fruit('apple'), 'crunchy', 'red')).value;

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('red').findOne().getValue()
            ).toBe(apple);
        });

        it('does not confuse values of different types, even without qualifiers', () => {
            const context = new ScenarioContext();
            const carrot = context.add(pieceOf(new Vegetable('carrot'))).value;

            expect(new ScenarioContextSearcher(context, Vegetable).findOne().getValue()).toBe(carrot);
            expect(() => new ScenarioContextSearcher(context, Fruit).findOne()).toThrow();
        });

        it('throws when nothing of the requested type has been added', () => {
            const context = new ScenarioContext();

            expect(() => new ScenarioContextSearcher(context, Fruit).findOne()).toThrow(
                'Could not find Fruit in the scenario context'
            );
        });

        it('throws when nothing matches the requested qualifiers', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('apple'), 'red'));

            expect(() => new ScenarioContextSearcher(context, Fruit).withQualifiers('green').findOne()).toThrow(
                'Could not find Fruit qualified by green in the scenario context'
            );
        });

        it('throws, asking the caller to disambiguate, when more than one value matches', () => {
            const context = new ScenarioContext();
            // both share the fixed 2-qualifier count for Fruit, and their
            // full combinations are distinct - only the narrower 'red'
            // query, a subset of both, is ambiguous between them.
            context.add(pieceOf(new Fruit('apple'), 'red', 'crunchy'));
            context.add(pieceOf(new Fruit('cherry'), 'red', 'shiny'));

            expect(() => new ScenarioContextSearcher(context, Fruit).withQualifiers('red').findOne()).toThrow(
                'Found 2 instances of Fruit qualified by red in the scenario context, expected exactly one. '
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        });

        it('puts the found value in the spotlight, on top of the scenario context', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'), 'soft');
            context.add(apple);
            context.add(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findOne();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('findLastUsed', () => {

        it('returns a handle on the most recently added match, without complaining about the ambiguity', () => {
            const context = new ScenarioContext();
            // both carry the same fixed, single qualifier - a distinct one
            // each, so the combination stays unique - and a query with no
            // qualifiers at all is a match for either.
            context.add(pieceOf(new Fruit('apple'), 'fuji'));
            const banana = context.add(pieceOf(new Fruit('banana'), 'cavendish')).value;

            expect(new ScenarioContextSearcher(context, Fruit).findLastUsed().getValue()).toBe(banana);
        });

        it('still respects any requested qualifiers when picking the most recently used match', () => {
            const context = new ScenarioContext();
            const crunchyApple = context.add(pieceOf(new Fruit('apple'), 'crunchy')).value;
            context.add(pieceOf(new Fruit('banana'), 'soft'));  // on top, but doesn't match

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findLastUsed().getValue()
            ).toBe(crunchyApple);
        });

        it('throws when nothing of the requested type has been added', () => {
            const context = new ScenarioContext();

            expect(() => new ScenarioContextSearcher(context, Fruit).findLastUsed()).toThrow(
                'Could not find Fruit in the scenario context'
            );
        });

        it('puts the found value in the spotlight, moving it back to the top', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'), 'soft');
            context.add(apple);
            context.add(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findLastUsed();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('find', () => {

        it('behaves like findOne() when exactly the fixed number of qualifiers for the type is given', () => {
            const context = new ScenarioContext();
            // the first Fruit added fixes the count at 2 qualifiers.
            const fuji = context.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy')).value;
            context.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));

            expect(
                new ScenarioContextSearcher(context, Fruit).find('red', 'crunchy').getValue()
            ).toBe(fuji);
        });

        it('throws when the fixed number of qualifiers is given but nothing matches', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => new ScenarioContextSearcher(context, Fruit).find('yellow', 'soft')).toThrow(
                'Could not find Fruit qualified by yellow, soft in the scenario context'
            );
        });

        it('behaves like findLastUsed() when fewer than the fixed number of qualifiers is given', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));
            const cavendish = context.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft')).value;

            expect(new ScenarioContextSearcher(context, Fruit).find().getValue()).toBe(cavendish);
        });

        it('still narrows down which most-recently-used match it settles for', () => {
            const context = new ScenarioContext();
            const redApple = context.add(pieceOf(new Fruit('red delicious'), 'red', 'crunchy')).value;
            context.add(pieceOf(new Fruit('cavendish banana'), 'yellow', 'soft'));  // on top, but not red

            expect(new ScenarioContextSearcher(context, Fruit).find('red').getValue()).toBe(redApple);
        });

        it('counts qualifiers already accumulated via withQualifiers towards the fixed number', () => {
            const context = new ScenarioContext();
            const redCrunchy = context.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy')).value;
            context.add(pieceOf(new Fruit('red delicious'), 'red', 'soft'));

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('red').find('crunchy').getValue()
            ).toBe(redCrunchy);
        });

        it('throws when more qualifiers than the fixed number for the type are given', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('fuji apple'), 'red', 'crunchy'));

            expect(() => new ScenarioContextSearcher(context, Fruit).find('red', 'crunchy', 'extra')).toThrow(
                'Fruit takes 2 qualifier(s), but 3 were given to find()'
            );
        });

        it('falls back to a plain search when nothing of the requested type has been added yet', () => {
            const context = new ScenarioContext();

            expect(() => new ScenarioContextSearcher(context, Fruit).find('red')).toThrow(
                'Could not find Fruit qualified by red in the scenario context'
            );
            expect(() => new ScenarioContextSearcher(context, Fruit).find()).toThrow(
                'Could not find Fruit in the scenario context'
            );
        });
    });

    describe('the returned handle', () => {

        it('lets the found value be replaced, in place, via replaceValue', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'), 'soft');
            context.add(apple);
            context.add(banana);  // banana is now on top

            const found = new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findOne();
            const greenApple = new Fruit('green apple');

            found.replaceValue(greenApple);

            expect(found.getValue()).toBe(greenApple);
            expect(Array.from(context)[0].value).toBe(greenApple);
            expect(Array.from(context)).toHaveLength(2);  // no duplicate was created
        });

        it('carries the original qualifiers over to the replacement value', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('apple'), 'crunchy', 'red'));

            const found = new ScenarioContextSearcher(context, Fruit).findOne();
            found.replaceValue(new Fruit('green apple'));

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy', 'red').findOne().getValue()
            ).toBeInstanceOf(Fruit);
        });

        it('lets a later search find the replacement value', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('apple'), 'crunchy'));

            const found = new ScenarioContextSearcher(context, Fruit).findOne();
            const greenApple = new Fruit('green apple');
            found.replaceValue(greenApple);

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findOne().getValue()
            ).toBe(greenApple);
        });
    });

    describe('withQualifiers', () => {

        it('returns a new searcher, leaving the original one unaffected', () => {
            const context = new ScenarioContext();
            const anyFruit = new ScenarioContextSearcher(context, Fruit);

            const redFruit = anyFruit.withQualifiers('red');

            expect(redFruit).not.toBe(anyFruit);
            context.add(pieceOf(new Fruit('banana'), 'yellow'));

            expect(anyFruit.findOne().getValue()).toBeInstanceOf(Fruit);   // still matches any Fruit
            expect(() => redFruit.findOne()).toThrow();                    // still requires 'red'
        });

        it('accumulates qualifiers across multiple calls', () => {
            const context = new ScenarioContext();
            const greenApple = context.add(pieceOf(new Fruit('green apple'), 'crunchy', 'green')).value;
            context.add(pieceOf(new Fruit('apple'), 'crunchy', 'yellow'));

            const searcher = new ScenarioContextSearcher(context, Fruit)
                .withQualifiers('crunchy')
                .withQualifiers('green');

            expect(searcher.findOne().getValue()).toBe(greenApple);
        });
    });
});

function pieceOf<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
