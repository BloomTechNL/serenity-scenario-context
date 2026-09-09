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

            context.put(first);
            context.put(second);

            expect(Array.from(context)).toEqual([ second, first ]);
        });

        it('returns the piece that was put, for convenience', () => {
            const context = new ScenarioContext();
            const piece = new ScenarioContextPiece('a value');

            expect(context.put(piece)).toBe(piece);
        });
    });

    describe('iterating', () => {

        it('yields the pieces from top (most recently put) to bottom (least recently put)', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');
            const third  = new ScenarioContextPiece('third');

            context.put(first);
            context.put(second);
            context.put(third);

            expect(Array.from(context)).toEqual([ third, second, first ]);
        });

        it('can be iterated over more than once, and with a for-of loop', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');

            context.put(first);
            context.put(second);

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

            context.put(first);
            context.put(second);
            context.put(third);

            context.putOnTop(first);

            expect(Array.from(context)).toEqual([ first, third, second ]);
        });

        it('leaves the order unaffected when the piece is already on top', () => {
            const context = new ScenarioContext();
            const first  = new ScenarioContextPiece('first');
            const second = new ScenarioContextPiece('second');

            context.put(first);
            context.put(second);

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
});
