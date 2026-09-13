import { ScenarioContext, ScenarioContextHandle, ScenarioContextPiece } from '../../src';

class Fruit {
    constructor(public readonly name: string) {
    }
}

describe('ScenarioContextHandle', () => {

    describe('getValue', () => {

        it('returns the value held by the underlying context piece', () => {
            const context = new ScenarioContext();
            const apple = new Fruit('apple');
            const piece = context.add(apple, 'crunchy');

            const handle = new ScenarioContextHandle(context.partFor(Fruit), piece);

            expect(handle.getValue()).toBe(apple);
        });
    });

    describe('replaceValue', () => {

        it('makes subsequent calls to getValue return the new value', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Fruit('apple'));

            const handle = new ScenarioContextHandle(context.partFor(Fruit), piece);
            const greenApple = new Fruit('green apple');

            handle.replaceValue(greenApple);

            expect(handle.getValue()).toBe(greenApple);
        });

        it('swaps the piece in the scenario context, without creating a duplicate', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Fruit('apple'));

            const handle = new ScenarioContextHandle(context.partFor(Fruit), piece);
            const greenApple = new Fruit('green apple');

            handle.replaceValue(greenApple);

            const pieces = Array.from(context.partFor(Fruit));
            expect(pieces).toHaveLength(1);
            expect(pieces[0].value).toBe(greenApple);
        });

        it('leaves the position of the piece in the context unaffected', () => {
            const context = new ScenarioContext();
            const bottom = context.add(new Fruit('banana'), 'cavendish');
            const middle = context.add(new Fruit('apple'), 'fuji');
            const top = context.add(new Fruit('cherry'), 'rainier');

            const handle = new ScenarioContextHandle(context.partFor(Fruit), middle);
            const greenApple = new Fruit('green apple');
            handle.replaceValue(greenApple);

            const values = Array.from(context.partFor(Fruit)).map(piece => piece.value);
            expect(values).toEqual([ top.value, greenApple, bottom.value ]);
        });

        it('carries the original qualifiers over to the new piece', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Fruit('apple'), 'crunchy', 'red');

            const handle = new ScenarioContextHandle(context.partFor(Fruit), piece);
            handle.replaceValue(new Fruit('green apple'));

            const replaced = Array.from(context.partFor(Fruit))[0];
            expect(replaced.hasQualifiers([ 'crunchy', 'red' ])).toBe(true);
        });

        it('lets the same handle replace the value more than once', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Fruit('apple'));

            const handle = new ScenarioContextHandle(context.partFor(Fruit), piece);
            handle.replaceValue(new Fruit('green apple'));
            const finalApple = new Fruit('final apple');
            handle.replaceValue(finalApple);

            expect(handle.getValue()).toBe(finalApple);
            expect(Array.from(context.partFor(Fruit))).toHaveLength(1);
        });
    });
});
