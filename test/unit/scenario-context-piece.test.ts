import { ScenarioContextPiece } from '../../src';

describe('ScenarioContextPiece', () => {

    it('holds on to the value it was created with', () => {
        const value = { name: 'a value' };

        const piece = new ScenarioContextPiece(value);

        expect(piece.value).toBe(value);
    });

    describe('replace', () => {

        it('swaps out the value returned by a later call to value', () => {
            const piece = new ScenarioContextPiece({ name: 'original' });
            const replacement = { name: 'replacement' };

            piece.replace(replacement);

            expect(piece.value).toBe(replacement);
        });

        it('leaves the qualifiers unaffected', () => {
            const piece = new ScenarioContextPiece('original', [ 'a', 'b' ]);

            piece.replace('replacement');

            expect(piece.allQualifiers()).toEqual(new Set([ 'a', 'b' ]));
        });

        it('can be called more than once', () => {
            const piece = new ScenarioContextPiece('original');

            piece.replace('first replacement');
            piece.replace('second replacement');

            expect(piece.value).toBe('second replacement');
        });
    });

    describe('hasQualifiers', () => {

        it('returns true when no qualifiers are requested, regardless of the ones the piece has', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'b' ]);

            expect(piece.hasQualifiers([])).toBe(true);
        });

        it('returns true when the piece has been qualified by every requested qualifier', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'b', 'c' ]);

            expect(piece.hasQualifiers([ 'a', 'c' ])).toBe(true);
        });

        it('returns true regardless of the order in which the qualifiers were requested', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'b', 'c' ]);

            expect(piece.hasQualifiers([ 'c', 'a' ])).toBe(true);
        });

        it('returns false when the piece is missing at least one of the requested qualifiers', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'b' ]);

            expect(piece.hasQualifiers([ 'a', 'z' ])).toBe(false);
        });

        it('returns false when the piece has no qualifiers at all', () => {
            const piece = new ScenarioContextPiece('some value');

            expect(piece.hasQualifiers([ 'a' ])).toBe(false);
        });
    });

    describe('hasSameQualifiersAs', () => {

        it('returns true when both pieces carry the exact same combination of qualifiers', () => {
            const piece = new ScenarioContextPiece('a value', [ 'a', 'b' ]);
            const other = new ScenarioContextPiece('another value', [ 'b', 'a' ]);

            expect(piece.hasSameQualifiersAs(other)).toBe(true);
        });

        it('returns true when neither piece has any qualifiers', () => {
            const piece = new ScenarioContextPiece('a value');
            const other = new ScenarioContextPiece('another value');

            expect(piece.hasSameQualifiersAs(other)).toBe(true);
        });

        it('returns false when the other piece has additional qualifiers', () => {
            const piece = new ScenarioContextPiece('a value', [ 'a' ]);
            const other = new ScenarioContextPiece('another value', [ 'a', 'b' ]);

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });

        it('returns false when the other piece is missing some of this piece\'s qualifiers', () => {
            const piece = new ScenarioContextPiece('a value', [ 'a', 'b' ]);
            const other = new ScenarioContextPiece('another value', [ 'a' ]);

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });

        it('returns false when the qualifiers differ even though the count matches', () => {
            const piece = new ScenarioContextPiece('a value', [ 'a', 'b' ]);
            const other = new ScenarioContextPiece('another value', [ 'a', 'c' ]);

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });
    });

    describe('allQualifiers', () => {

        it('returns the qualifiers the piece was created with', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'b' ]);

            expect(piece.allQualifiers()).toEqual(new Set([ 'a', 'b' ]));
        });

        it('de-duplicates repeated qualifiers', () => {
            const piece = new ScenarioContextPiece('some value', [ 'a', 'a', 'b' ]);

            expect(piece.allQualifiers()).toEqual(new Set([ 'a', 'b' ]));
        });

        it('defaults to no qualifiers at all', () => {
            const piece = new ScenarioContextPiece('some value');

            expect(piece.allQualifiers()).toEqual(new Set());
        });
    });
});
