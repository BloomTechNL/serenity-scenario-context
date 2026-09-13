import { ScenarioContext, UseScenarioContext } from '../../src';

class Fruit {
    constructor(public readonly name: string) {
    }
}

describe('UseScenarioContext', () => {

    it('can be instantiated with a scenario context of its own', () => {
        const ability = UseScenarioContext.using();

        ability.add(new Fruit('apple'));

        expect(ability.find(Fruit).getValue()).toBeInstanceOf(Fruit);
    });

    describe('add', () => {

        it('makes the value findable by its type', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple);

            expect(ability.find(Fruit).getValue()).toBe(apple);
        });

        it('makes the value findable by its type and qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple, 'crunchy', 'red');

            expect(ability.find(Fruit, 'red').getValue()).toBe(apple);
        });

        it('returns the context piece that was created, for convenience', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            const piece = ability.add(apple, 'red');

            expect(piece.value).toBe(apple);
            expect(piece.hasQualifiers([ 'red' ])).toBe(true);
        });
    });

    describe('find', () => {

        it('delegates to the ScenarioContextPart for the given type, in this ability\'s context', () => {
            const context = new ScenarioContext();
            const ability = UseScenarioContext.using(context);
            const apple = context.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.find(Fruit, 'crunchy').getValue()).toBe(apple);
        });

        // The exhaustive behaviour of searching - findOne()-like vs
        // findLastUsed()-like, the spotlight effect - is covered in
        // ScenarioContextPart's own unit tests. These tests just confirm the
        // ability wires everything up correctly.

        it('insists on exactly one match when exactly as many qualifiers as the type takes are given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.find(Fruit, 'crunchy').getValue()).toBe(apple);
        });

        it('falls back to the most recently used match when fewer qualifiers than the type takes are given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), 'gala');
            const banana = ability.add(new Fruit('banana'), 'cavendish').value;

            expect(ability.find(Fruit).getValue()).toBe(banana);
        });
    });
});
