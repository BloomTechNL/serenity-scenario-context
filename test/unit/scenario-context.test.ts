import { ScenarioContext, ScenarioContextPiece } from '../../src';

describe('ScenarioContext', () => {

    it('starts out empty', () => {
        const context = new ScenarioContext();

        expect(Array.from(context)).toEqual([]);
    });

    describe('put', () => {

        it('places a new piece on top of the context', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');

            context.add(first);
            context.add(second);

            expect(Array.from(context)).toEqual([ second, first ]);
        });

        it('returns the piece that was put, for convenience', () => {
            const context = new ScenarioContext();
            const piece = new ScenarioContextPiece('a value');

            expect(context.add(piece)).toBe(piece);
        });
    });

    describe('iterating', () => {

        it('yields the pieces from top (most recently put) to bottom (least recently put)', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');
            const third  = new ScenarioContextPiece('third');

            context.add(first);
            context.add(second);
            context.add(third);

            expect(Array.from(context)).toEqual([ third, second, first ]);
        });

        it('can be iterated over more than once, and with a for-of loop', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');

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
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');
            const third  = new ScenarioContextPiece('third');

            context.add(first);
            context.add(second);
            context.add(third);

            context.putOnTop(first);

            expect(Array.from(context)).toEqual([ first, third, second ]);
        });

        it('leaves the order unaffected when the piece is already on top', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');

            context.add(first);
            context.add(second);

            context.putOnTop(second);

            expect(Array.from(context)).toEqual([ second, first ]);
        });

        it('throws when the piece has never been part of this context', () => {
            const context = new ScenarioContext();
            const foreign = new ScenarioContextPiece('not part of this context');

            expect(() => context.putOnTop(foreign)).toThrow(
                'Could not put the context piece on top because it is not part of this scenario context'
            );
        });
    });

    describe('replace', () => {

        it('swaps an existing piece for a new one, in the same position', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');
            const third  = new ScenarioContextPiece('third');

            context.add(first);
            context.add(second);
            context.add(third);

            const replacement = new ScenarioContextPiece('replacement');
            context.replace(second, replacement);

            expect(Array.from(context)).toEqual([ third, replacement, first ]);
        });

        it('returns the new piece, for convenience', () => {
            const context = new ScenarioContext();
            const original = new ScenarioContextPiece('original');
            context.add(original);

            const replacement = new ScenarioContextPiece('replacement');

            expect(context.replace(original, replacement)).toBe(replacement);
        });

        it('throws when the piece to be replaced has never been part of this context', () => {
            const context = new ScenarioContext();
            const foreign = new ScenarioContextPiece('not part of this context');
            const replacement = new ScenarioContextPiece('replacement');

            expect(() => context.replace(foreign, replacement)).toThrow(
                'Could not replace the context piece because it is not part of this scenario context'
            );
        });
    });
});
