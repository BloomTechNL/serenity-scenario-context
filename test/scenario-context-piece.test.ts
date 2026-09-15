import { ScenarioContextPiece } from '../src/index';

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
            const piece = new ScenarioContextPiece('original', { a: '1', b: '2' });

            piece.replace('replacement');

            expect(piece.allQualifiers()).toEqual(new Map([ [ 'a', '1' ], [ 'b', '2' ] ]));
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
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2' });

            expect(piece.hasQualifiers({})).toBe(true);
        });

        it('returns true when the piece carries every requested key with the requested value', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2', c: '3' });

            expect(piece.hasQualifiers({ a: '1', c: '3' })).toBe(true);
        });

        it('returns true regardless of the order in which the qualifiers were requested', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2', c: '3' });

            expect(piece.hasQualifiers({ c: '3', a: '1' })).toBe(true);
        });

        it('returns false when the piece is missing at least one of the requested keys', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2' });

            expect(piece.hasQualifiers({ a: '1', z: '9' })).toBe(false);
        });

        it('returns false when a requested key is present but its value differs', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2' });

            expect(piece.hasQualifiers({ a: '9' })).toBe(false);
        });

        it('returns false when the piece has no qualifiers at all', () => {
            const piece = new ScenarioContextPiece('some value');

            expect(piece.hasQualifiers({ a: '1' })).toBe(false);
        });
    });

    describe('hasSameQualifierKeysAs', () => {

        it('returns true when both pieces carry the exact same set of keys, regardless of order or values', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { b: '9', a: '9' });

            expect(piece.hasSameQualifierKeysAs(other)).toBe(true);
        });

        it('returns true when neither piece has any qualifiers', () => {
            const piece = new ScenarioContextPiece('a value');
            const other = new ScenarioContextPiece('another value');

            expect(piece.hasSameQualifierKeysAs(other)).toBe(true);
        });

        it('returns false when the other piece has additional keys', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1' });
            const other = new ScenarioContextPiece('another value', { a: '1', b: '2' });

            expect(piece.hasSameQualifierKeysAs(other)).toBe(false);
        });

        it('returns false when the other piece is missing some of this piece\'s keys', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { a: '1' });

            expect(piece.hasSameQualifierKeysAs(other)).toBe(false);
        });

        it('returns false when the keys differ even though their count matches', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { a: '1', c: '2' });

            expect(piece.hasSameQualifierKeysAs(other)).toBe(false);
        });
    });

    describe('hasSameQualifiersAs', () => {

        it('returns true when both pieces carry the exact same combination of keys and values', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { b: '2', a: '1' });

            expect(piece.hasSameQualifiersAs(other)).toBe(true);
        });

        it('returns true when neither piece has any qualifiers', () => {
            const piece = new ScenarioContextPiece('a value');
            const other = new ScenarioContextPiece('another value');

            expect(piece.hasSameQualifiersAs(other)).toBe(true);
        });

        it('returns false when the other piece has additional qualifiers', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1' });
            const other = new ScenarioContextPiece('another value', { a: '1', b: '2' });

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });

        it('returns false when the other piece is missing some of this piece\'s qualifiers', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { a: '1' });

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });

        it('returns false when a shared key\'s value differs, even though the keys match', () => {
            const piece = new ScenarioContextPiece('a value', { a: '1', b: '2' });
            const other = new ScenarioContextPiece('another value', { a: '1', b: '9' });

            expect(piece.hasSameQualifiersAs(other)).toBe(false);
        });
    });

    describe('allQualifiers', () => {

        it('returns the qualifiers the piece was created with', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2' });

            expect(piece.allQualifiers()).toEqual(new Map([ [ 'a', '1' ], [ 'b', '2' ] ]));
        });

        it('defaults to no qualifiers at all', () => {
            const piece = new ScenarioContextPiece('some value');

            expect(piece.allQualifiers()).toEqual(new Map());
        });
    });

    describe('qualifierKeys', () => {

        it('returns the keys the piece was created with', () => {
            const piece = new ScenarioContextPiece('some value', { a: '1', b: '2' });

            expect(piece.qualifierKeys()).toEqual(new Set([ 'a', 'b' ]));
        });

        it('defaults to no keys at all', () => {
            const piece = new ScenarioContextPiece('some value');

            expect(piece.qualifierKeys()).toEqual(new Set());
        });
    });
});
