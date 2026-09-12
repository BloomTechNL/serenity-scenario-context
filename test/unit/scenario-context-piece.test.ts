import { ScenarioContextPiece } from '../../src';

describe('ScenarioContextPiece', () => {

    it('holds on to the value it was created with', () => {
        const value = { name: 'a value' };

        const piece = new ScenarioContextPiece(value);

        expect(piece.value).toBe(value);
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
