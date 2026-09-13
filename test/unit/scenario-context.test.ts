import { ScenarioContext, ScenarioContextPart } from '../../src';

class Widget {
    constructor(public readonly name: string) {
    }
}

class Gadget {
    constructor(public readonly name: string) {
    }
}

describe('ScenarioContext', () => {

    describe('add', () => {

        it('puts the piece in the part for its type', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Widget('spanner'), { material: 'metal' });

            expect(context.partFor(Widget).findPiece({ material: 'metal' })).toBe(piece);
        });

        it('returns the piece that was put, for convenience', () => {
            const context = new ScenarioContext();

            expect(context.add(new Widget('spanner')).value).toBeInstanceOf(Widget);
        });

        it('routes pieces of different types to different parts', () => {
            const context = new ScenarioContext();
            const widget = context.add(new Widget('spanner'), { material: 'metal' });
            const gadget = context.add(new Gadget('gizmo'));

            expect(context.partFor(Widget).findPiece({ material: 'metal' })).toBe(widget);
            expect(context.partFor(Gadget).findPiece()).toBe(gadget);
        });

        it('propagates the fixed-qualifier-keys and uniqueness constraints enforced by the part - see ScenarioContextPart', () => {
            const context = new ScenarioContext();
            context.add(new Widget('spanner'), { material: 'metal' });

            expect(() => context.add(new Widget('mallet'), { material: 'wood', weight: 'heavy' })).toThrow(
                'Could not add Widget qualified by material, weight - every Widget in the scenario context must be '
                + 'qualified by exactly material, as established when the first one was added'
            );
        });
    });

    describe('partFor', () => {

        it('returns an empty part for a type nothing has been added for yet', () => {
            const context = new ScenarioContext();

            expect(() => context.partFor(Widget).find()).toThrow(
                'Could not find Widget in the scenario context'
            );
        });

        it('returns the same part on every call for a given type', () => {
            const context = new ScenarioContext();

            expect(context.partFor(Widget)).toBe(context.partFor(Widget));
        });

        it('returns a part that reflects pieces added directly via the context', () => {
            const context = new ScenarioContext();
            const piece = context.add(new Widget('spanner'), { material: 'metal' });

            expect(context.partFor(Widget).findPiece({ material: 'metal' })).toBe(piece);
        });

        it('is a ScenarioContextPart', () => {
            const context = new ScenarioContext();

            expect(context.partFor(Widget)).toBeInstanceOf(ScenarioContextPart);
        });
    });
});
