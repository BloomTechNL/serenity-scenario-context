import { ScenarioContext, ScenarioContextSearcher, UseScenarioContext } from '../../src';

class Fruit {
    constructor(public readonly name: string) {
    }
}

describe('UseScenarioContext', () => {

    it('can be instantiated with a scenario context of its own', () => {
        const ability = UseScenarioContext.using();

        ability.add(new Fruit('apple'));

        expect(ability.withType(Fruit).findOne()).toBeInstanceOf(Fruit);
    });

    describe('add', () => {

        it('makes the value findable by its type', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple);

            expect(ability.withType(Fruit).findOne()).toBe(apple);
        });

        it('makes the value findable by its type and qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple, 'crunchy', 'red');

            expect(ability.withType(Fruit).withQualifiers('red').findOne()).toBe(apple);
        });

        it('returns the context piece that was created, for convenience', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            const piece = ability.add(apple, 'red');

            expect(piece.value).toBe(apple);
            expect(piece.hasQualifiers([ 'red' ])).toBe(true);
        });
    });

    describe('withType', () => {

        it('returns a ScenarioContextSearcher scoped to the given type and this ability\'s context', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());

            expect(ability.withType(Fruit)).toBeInstanceOf(ScenarioContextSearcher);
        });

        // The exhaustive behaviour of searching - filtering by type and
        // qualifiers, findOne() vs findLastUsed(), the spotlight effect - is
        // covered in ScenarioContextSearcher's own unit tests. These tests
        // just confirm the ability wires everything up correctly.

        it('lets a single match be found unambiguously with findOne()', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.withType(Fruit).withQualifiers('crunchy').findOne()).toBe(apple);
        });

        it('lets the most recently used match be found with findLastUsed(), even when several exist', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'));
            const banana = ability.add(new Fruit('banana')).value;

            expect(ability.withType(Fruit).findLastUsed()).toBe(banana);
        });
    });
});
