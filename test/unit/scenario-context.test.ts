import { ScenarioContext, ScenarioContextPiece } from '../../src';

// Two unrelated fixture types, used to prove that the fixed-qualifier-count
// and uniqueness constraints are tracked separately per type.
class Widget {
    constructor(public readonly name: string) {
    }
}

class Gadget {
    constructor(public readonly name: string) {
    }
}

describe('ScenarioContext', () => {

    it('starts out empty', () => {
        const context = new ScenarioContext();

        expect(Array.from(context)).toEqual([]);
    });

    describe('put', () => {

        it('places a new piece on top of the context', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');

            context.add(first);
            context.add(second);

            expect(Array.from(context)).toEqual([ second, first ]);
        });

        it('returns the piece that was put, for convenience', () => {
            const context = new ScenarioContext();
            const piece = pieceOf('a value');

            expect(context.add(piece)).toBe(piece);
        });
    });

    describe('iterating', () => {

        it('yields the pieces from top (most recently put) to bottom (least recently put)', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');
            const third  = pieceOf('third', 'third-tag');

            context.add(first);
            context.add(second);
            context.add(third);

            expect(Array.from(context)).toEqual([ third, second, first ]);
        });

        it('can be iterated over more than once, and with a for-of loop', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');

            context.add(first);
            context.add(second);

            const collected: ScenarioContextPiece[] = [];
            for (const piece of context) {
                collected.push(piece);
            }

            expect(collected).toEqual([ second, first ]);
            expect(Array.from(context)).toEqual([ second, first ]);
        });
    });

    describe('putOnTop', () => {

        it('moves an existing piece to the top, without duplicating it', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');
            const third  = pieceOf('third', 'third-tag');

            context.add(first);
            context.add(second);
            context.add(third);

            context.putOnTop(first);

            expect(Array.from(context)).toEqual([ first, third, second ]);
        });

        it('leaves the order unaffected when the piece is already on top', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');

            context.add(first);
            context.add(second);

            context.putOnTop(second);

            expect(Array.from(context)).toEqual([ second, first ]);
        });

        it('throws when the piece has never been part of this context', () => {
            const context = new ScenarioContext();
            const foreign = pieceOf('not part of this context');

            expect(() => context.putOnTop(foreign)).toThrow(
                'Could not put the context piece on top because it is not part of this scenario context'
            );
        });
    });

    describe('replace', () => {

        it('swaps an existing piece for a new one, in the same position', () => {
            const context = new ScenarioContext();
            const first  = pieceOf('first', 'first-tag');
            const second = pieceOf('second', 'second-tag');
            const third  = pieceOf('third', 'third-tag');

            context.add(first);
            context.add(second);
            context.add(third);

            // reuses "second"'s own qualifier - replacing a piece with the
            // same qualifiers it already had is exactly what a
            // ScenarioContextHandle#replaceValue does under the hood.
            const replacement = pieceOf('replacement', 'second-tag');
            context.replace(second, replacement);

            expect(Array.from(context)).toEqual([ third, replacement, first ]);
        });

        it('returns the new piece, for convenience', () => {
            const context = new ScenarioContext();
            const original = pieceOf('original', 'id');
            context.add(original);

            const replacement = pieceOf('replacement', 'id');

            expect(context.replace(original, replacement)).toBe(replacement);
        });

        it('throws when the piece to be replaced has never been part of this context', () => {
            const context = new ScenarioContext();
            const foreign = pieceOf('not part of this context');
            const replacement = pieceOf('replacement');

            expect(() => context.replace(foreign, replacement)).toThrow(
                'Could not replace the context piece because it is not part of this scenario context'
            );
        });
    });

    describe('the fixed qualifier count established per type', () => {

        it('is established by however many qualifiers the first piece of a type is added with', () => {
            const context = new ScenarioContext();

            expect(context.qualifierCountFor(Widget)).toBeUndefined();

            context.add(new Widget('spanner'), 'metal', 'heavy');

            expect(context.qualifierCountFor(Widget)).toBe(2);
        });

        it('is tracked independently for every type', () => {
            const context = new ScenarioContext();

            context.add(new Widget('spanner'), 'metal');
            context.add(new Gadget('gizmo'));

            expect(context.qualifierCountFor(Widget)).toBe(1);
            expect(context.qualifierCountFor(Gadget)).toBe(0);
        });

        it('rejects a later piece of the same type carrying a different number of qualifiers', () => {
            const context = new ScenarioContext();
            context.add(new Widget('spanner'), 'metal');

            expect(() => context.add(new Widget('mallet'), 'wood', 'heavy')).toThrow(
                'Could not add Widget qualified by 2 qualifier(s) - every Widget in the scenario context must be '
                + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
            );
        });

        it('rejects a later piece of the same type sharing the exact same combination of qualifiers', () => {
            const context = new ScenarioContext();
            context.add(new Widget('spanner'), 'metal', 'heavy');

            expect(() => context.add(new Widget('mallet'), 'heavy', 'metal')).toThrow(
                'Could not add Widget qualified by heavy, metal - a Widget qualified exactly like that is already '
                + 'part of the scenario context'
            );
        });

        it('allows several pieces of the same type as long as their combination of qualifiers differs', () => {
            const context = new ScenarioContext();
            const spanner = context.add(new Widget('spanner'), 'metal').value;
            const mallet = context.add(new Widget('mallet'), 'wood').value;

            expect(Array.from(context).map(piece => piece.value)).toEqual([ mallet, spanner ]);
        });

        it('enforces the same number of qualifiers when replacing a piece', () => {
            const context = new ScenarioContext();
            const original = context.add(new Widget('spanner'), 'metal');

            expect(() => context.replace(original, new ScenarioContextPiece(new Widget('mallet'), [ 'wood', 'heavy' ]))).toThrow(
                'Could not add Widget qualified by 2 qualifier(s) - every Widget in the scenario context must be '
                + 'qualified by exactly 1 qualifier(s), as established when the first one was added'
            );
        });

        it('lets a piece be replaced by one carrying the exact same qualifiers, without treating it as a clash with itself', () => {
            const context = new ScenarioContext();
            const original = context.add(new Widget('spanner'), 'metal');
            const replacement = new ScenarioContextPiece(new Widget('mallet'), [ 'metal' ]);

            expect(() => context.replace(original, replacement)).not.toThrow();
            expect(Array.from(context)).toEqual([ replacement ]);
        });

        it('still rejects a replacement whose qualifiers clash with some other piece of the same type', () => {
            const context = new ScenarioContext();
            context.add(new Widget('mallet'), 'wood');
            const spanner = context.add(new Widget('spanner'), 'metal');

            expect(() => context.replace(spanner, new ScenarioContextPiece(new Widget('bigger spanner'), [ 'wood' ]))).toThrow(
                'Could not add Widget qualified by wood - a Widget qualified exactly like that is already part of '
                + 'the scenario context'
            );
        });
    });
});

function pieceOf(value: string, ...qualifiers: string[]): ScenarioContextPiece<string> {
    return new ScenarioContextPiece(value, qualifiers);
}
