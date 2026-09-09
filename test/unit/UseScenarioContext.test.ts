import { ScenarioContext, UseScenarioContext } from '../../src';

// Two unrelated fixture types, used to prove that `find` filters by type
// as well as by qualifiers.
class Fruit {
    constructor(public readonly name: string) {
    }
}

class Vegetable {
    constructor(public readonly name: string) {
    }
}

describe('UseScenarioContext', () => {

    it('can be instantiated with a scenario context of its own', () => {
        const ability = UseScenarioContext.using();

        ability.add(new Fruit('apple'));

        expect(ability.find(Fruit)).toBeInstanceOf(Fruit);
    });

    describe('add', () => {

        it('makes the value findable by its type', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple);

            expect(ability.find(Fruit)).toBe(apple);
        });

        it('makes the value findable by its type and qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.add(apple, 'crunchy', 'red');

            expect(ability.find(Fruit, 'red')).toBe(apple);
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

        it('throws when nothing of the requested type has been added', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());

            expect(() => ability.find(Fruit)).toThrow(
                'Could not find Fruit in the scenario context'
            );
        });

        it('throws when nothing matches the requested qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), 'red');

            expect(() => ability.find(Fruit, 'green')).toThrow(
                'Could not find Fruit qualified by green in the scenario context'
            );
        });

        it('does not confuse values of different types, even without qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const carrot = new Vegetable('carrot');

            ability.add(carrot);

            expect(ability.find(Vegetable)).toBe(carrot);
            expect(() => ability.find(Fruit)).toThrow();
        });

        it('returns the most recently added match when several pieces of the same type exist', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'));
            const banana = ability.add(new Fruit('banana')).value;

            expect(ability.find(Fruit)).toBe(banana);
        });

        it('filters candidates of the same type by their qualifiers', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), 'crunchy').value;
            ability.add(new Fruit('banana'), 'soft');

            expect(ability.find(Fruit, 'crunchy')).toBe(apple);
        });

        it('requires every requested qualifier to be present, not just some of them', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), 'crunchy');
            const greenApple = ability.add(new Fruit('green apple'), 'crunchy', 'green').value;

            expect(ability.find(Fruit, 'crunchy', 'green')).toBe(greenApple);
        });

        it('puts the found piece in the spotlight, on top of the scenario context', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple  = ability.add(new Fruit('apple'), 'crunchy').value;
            const banana = ability.add(new Fruit('banana')).value; // banana is now on top

            // finding apple explicitly, by its qualifier, should move it back on top
            expect(ability.find(Fruit, 'crunchy')).toBe(apple);

            // so the very next, unqualified search finds apple again - not banana
            expect(ability.find(Fruit)).toBe(apple);
        });

        it('leaves qualifiers of a found piece unchanged - it does not become "unqualified"', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), 'crunchy').value;

            ability.find(Fruit, 'crunchy');

            expect(ability.find(Fruit, 'crunchy')).toBe(apple);
        });
    });
});
