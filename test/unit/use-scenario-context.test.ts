import { ScenarioContext, UseScenarioContext } from '../../src';

class Fruit {
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

        it('delegates to the ScenarioContextPart for the given type, in this ability\'s context', () => {
            const context = new ScenarioContext();
            const ability = UseScenarioContext.using(context);
            const apple = context.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.find(Fruit, 'crunchy')).toBe(apple);
        });

        it('insists on exactly one match when exactly as many qualifiers as the type takes are given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.find(Fruit, 'crunchy')).toBe(apple);
        });

        it('falls back to the most recently used match when fewer qualifiers than the type takes are given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), 'gala');
            const banana = ability.add(new Fruit('banana'), 'cavendish').value;

            expect(ability.find(Fruit)).toBe(banana);
        });
    });

    describe('findPiece', () => {

        it('delegates to the ScenarioContextPart for the given type, in this ability\'s context', () => {
            const context = new ScenarioContext();
            const ability = UseScenarioContext.using(context);
            const apple = context.add(new Fruit('apple'), 'crunchy').value;

            expect(ability.findPiece(Fruit, 'crunchy').value).toBe(apple);
        });

        it('returns the piece, letting the caller replace its value afterwards', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), 'crunchy');

            const found = ability.findPiece(Fruit, 'crunchy');
            const greenApple = new Fruit('green apple');
            found.replace(greenApple);

            expect(ability.find(Fruit, 'crunchy')).toBe(greenApple);
        });
    });
});
