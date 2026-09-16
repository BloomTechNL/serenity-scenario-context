import { ScenarioContext, UseScenarioContext } from '../src/index';

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

            ability.add(apple, { texture: 'crunchy', color: 'red' });

            expect(ability.find(Fruit, { color: 'red' })).toBe(apple);
        });

        it('returns the context piece that was created, for convenience', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            const piece = ability.add(apple, { color: 'red' });

            expect(piece.value).toBe(apple);
            expect(piece.hasQualifiers({ color: 'red' })).toBe(true);
        });
    });

    describe('addOrReplace', () => {

        it('makes the value findable by its type and qualifiers, when nothing matches yet', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            ability.addOrReplace(apple, { color: 'red' });

            expect(ability.find(Fruit, { color: 'red' })).toBe(apple);
        });

        it('replaces the value already qualified exactly the same, rather than throwing', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), { color: 'red' });
            const cherry = new Fruit('cherry');

            ability.addOrReplace(cherry, { color: 'red' });

            expect(ability.find(Fruit, { color: 'red' })).toBe(cherry);
        });

        it('returns the context piece now holding the value, for convenience', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = new Fruit('apple');

            const piece = ability.addOrReplace(apple, { color: 'red' });

            expect(piece.value).toBe(apple);
            expect(piece.hasQualifiers({ color: 'red' })).toBe(true);
        });
    });

    describe('find', () => {

        it('delegates to the ScenarioContextPart for the given type, in this ability\'s context', () => {
            const context = new ScenarioContext();
            const ability = UseScenarioContext.using(context);
            const apple = context.add(new Fruit('apple'), { texture: 'crunchy' }).value;

            expect(ability.find(Fruit, { texture: 'crunchy' })).toBe(apple);
        });

        it('insists on exactly one match when every qualifier key the type takes is given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            const apple = ability.add(new Fruit('apple'), { texture: 'crunchy' }).value;

            expect(ability.find(Fruit, { texture: 'crunchy' })).toBe(apple);
        });

        it('falls back to the most recently used match when fewer keys than the type takes are given', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), { variety: 'gala' });
            const banana = ability.add(new Fruit('banana'), { variety: 'cavendish' }).value;

            expect(ability.find(Fruit)).toBe(banana);
        });
    });

    describe('findPiece', () => {

        it('delegates to the ScenarioContextPart for the given type, in this ability\'s context', () => {
            const context = new ScenarioContext();
            const ability = UseScenarioContext.using(context);
            const apple = context.add(new Fruit('apple'), { texture: 'crunchy' }).value;

            expect(ability.findPiece(Fruit, { texture: 'crunchy' }).value).toBe(apple);
        });

        it('returns the piece, letting the caller replace its value afterwards', () => {
            const ability = UseScenarioContext.using(new ScenarioContext());
            ability.add(new Fruit('apple'), { texture: 'crunchy' });

            const found = ability.findPiece(Fruit, { texture: 'crunchy' });
            const greenApple = new Fruit('green apple');
            found.replace(greenApple);

            expect(ability.find(Fruit, { texture: 'crunchy' })).toBe(greenApple);
        });
    });
});
