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

        it('returns the single value of the requested type', () => {
            const context = new ScenarioContext();
            const apple = context.put(pieceOf(new Fruit('apple'))).value;

            expect(new ScenarioContextSearcher(context, Fruit).findOne()).toBe(apple);
        });

        it('returns the single value further narrowed down by qualifiers', () => {
            const context = new ScenarioContext();
            const apple = context.put(pieceOf(new Fruit('apple'), 'crunchy', 'red')).value;

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('red').findOne()
            ).toBe(apple);
        });

        it('does not confuse values of different types, even without qualifiers', () => {
            const context = new ScenarioContext();
            const carrot = context.put(pieceOf(new Vegetable('carrot'))).value;

            expect(new ScenarioContextSearcher(context, Vegetable).findOne()).toBe(carrot);
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
            context.put(pieceOf(new Fruit('apple'), 'red'));

            expect(() => new ScenarioContextSearcher(context, Fruit).withQualifiers('green').findOne()).toThrow(
                'Could not find Fruit qualified by green in the scenario context'
            );
        });

        it('throws, asking the caller to disambiguate, when more than one value matches', () => {
            const context = new ScenarioContext();
            context.put(pieceOf(new Fruit('apple'), 'red'));
            context.put(pieceOf(new Fruit('cherry'), 'red'));

            expect(() => new ScenarioContextSearcher(context, Fruit).withQualifiers('red').findOne()).toThrow(
                'Found 2 instances of Fruit qualified by red in the scenario context, expected exactly one. '
                + 'Use findLastUsed() instead if the most recently used one will do.'
            );
        });

        it('puts the found value in the spotlight, on top of the scenario context', () => {
            const context = new ScenarioContext();
            const apple  = pieceOf(new Fruit('apple'), 'crunchy');
            const banana = pieceOf(new Fruit('banana'));
            context.put(apple);
            context.put(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findOne();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('findLastUsed', () => {

        it('returns the most recently added match, without complaining about the ambiguity', () => {
            const context = new ScenarioContext();
            context.put(pieceOf(new Fruit('apple')));
            const banana = context.put(pieceOf(new Fruit('banana'))).value;

            expect(new ScenarioContextSearcher(context, Fruit).findLastUsed()).toBe(banana);
        });

        it('still respects any requested qualifiers when picking the most recently used match', () => {
            const context = new ScenarioContext();
            const crunchyApple = context.put(pieceOf(new Fruit('apple'), 'crunchy')).value;
            context.put(pieceOf(new Fruit('banana'), 'soft'));  // on top, but doesn't match

            expect(
                new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findLastUsed()
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
            context.put(apple);
            context.put(banana);  // banana is now on top

            new ScenarioContextSearcher(context, Fruit).withQualifiers('crunchy').findLastUsed();

            expect(Array.from(context)[0]).toBe(apple);
        });
    });

    describe('withQualifiers', () => {

        it('returns a new searcher, leaving the original one unaffected', () => {
            const context = new ScenarioContext();
            const anyFruit = new ScenarioContextSearcher(context, Fruit);

            const redFruit = anyFruit.withQualifiers('red');

            expect(redFruit).not.toBe(anyFruit);
            context.put(pieceOf(new Fruit('banana'), 'yellow'));

            expect(anyFruit.findOne()).toBeInstanceOf(Fruit);           // still matches any Fruit
            expect(() => redFruit.findOne()).toThrow();                 // still requires 'red'
        });

        it('accumulates qualifiers across multiple calls', () => {
            const context = new ScenarioContext();
            const greenApple = context.put(pieceOf(new Fruit('green apple'), 'crunchy', 'green')).value;
            context.put(pieceOf(new Fruit('apple'), 'crunchy'));

            const searcher = new ScenarioContextSearcher(context, Fruit)
                .withQualifiers('crunchy')
                .withQualifiers('green');

            expect(searcher.findOne()).toBe(greenApple);
        });
    });
});

function pieceOf<Value extends object>(value: Value, ...qualifiers: string[]): ScenarioContextPiece<Value> {
    return new ScenarioContextPiece(value, qualifiers);
}
