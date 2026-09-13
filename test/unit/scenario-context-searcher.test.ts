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
            context.add(pieceOf(new Fruit('apple'), 'red'));
            context.add(pieceOf(new Fruit('cherry'), 'red'));

            expect(() => new ScenarioContextSearcher(context, Fruit).withQualifiers('red').findOne()).toThrow(
                'Found 2 instances of Fruit qualified by red in the scenario context, expected exactly one. '
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        });

        it('puts the found value in the spotlight, on top of the scenario context', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'));
            context.add(apple);
            context.add(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findOne();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('findLastUsed', () => {

        it('returns a handle on the most recently added match, without complaining about the ambiguity', () => {
            const context = new ScenarioContext();
            context.add(pieceOf(new Fruit('apple')));
            const banana = context.add(pieceOf(new Fruit('banana'))).value;

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
            const banana = pieceOf(new Fruit('banana'));
            context.add(apple);
            context.add(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findLastUsed();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('the returned handle', () => {

        it('lets the found value be replaced, in place, via replaceValue', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'));
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
            context.add(pieceOf(new Fruit('apple'), 'crunchy'));

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
