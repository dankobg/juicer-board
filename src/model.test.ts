import { test } from 'node:test';
import assert from 'node:assert';
import {
	Change,
	Color,
	Coord,
	coordFromRankFile,
	coordFromRowCol,
	COORDS,
	COORDS_REVERSED,
	FEN_EMPTY,
	FEN_START,
	fenToPosition,
	getDeltaXYFromCoord,
	getDistance,
	getDistanceDelta,
	getPositionChanges,
	getSquareColor,
	getSquareCoordFromPointer,
	indexFromCoord,
	NumPair,
	Position,
	RankFile,
	rankFileFromCoord,
	rankFileFromRowCol,
	RowCol,
	rowColFromCoord,
	rowColFromRankFile,
} from './model';

test('indexFromCoord', async t => {
	for (const [index, coord] of COORDS.entries()) {
		await t.test(`indexFromCoord from white side ${coord}: `, () => {
			const result = indexFromCoord(coord, 'w');
			assert.strictEqual(result, index);
		});
	}
	for (const [index, coord] of COORDS_REVERSED.entries()) {
		await t.test(`indexFromCoord from black side ${coord}: `, () => {
			const result = indexFromCoord(coord, 'b');
			assert.strictEqual(result, index);
		});
	}
});

test('rankFileFromRowCol', async t => {
	const testCases: { rowCol: RowCol; expectedWhite: RankFile; expectedBlack: RankFile }[] = [
		{ rowCol: [0, 0], expectedWhite: ['8', 'a'], expectedBlack: ['1', 'h'] },
		{ rowCol: [0, 1], expectedWhite: ['8', 'b'], expectedBlack: ['1', 'g'] },
		{ rowCol: [0, 2], expectedWhite: ['8', 'c'], expectedBlack: ['1', 'f'] },
		{ rowCol: [0, 3], expectedWhite: ['8', 'd'], expectedBlack: ['1', 'e'] },
		{ rowCol: [0, 4], expectedWhite: ['8', 'e'], expectedBlack: ['1', 'd'] },
		{ rowCol: [0, 5], expectedWhite: ['8', 'f'], expectedBlack: ['1', 'c'] },
		{ rowCol: [0, 6], expectedWhite: ['8', 'g'], expectedBlack: ['1', 'b'] },
		{ rowCol: [0, 7], expectedWhite: ['8', 'h'], expectedBlack: ['1', 'a'] },
		{ rowCol: [1, 0], expectedWhite: ['7', 'a'], expectedBlack: ['2', 'h'] },
		{ rowCol: [1, 1], expectedWhite: ['7', 'b'], expectedBlack: ['2', 'g'] },
		{ rowCol: [1, 2], expectedWhite: ['7', 'c'], expectedBlack: ['2', 'f'] },
		{ rowCol: [1, 3], expectedWhite: ['7', 'd'], expectedBlack: ['2', 'e'] },
		{ rowCol: [1, 4], expectedWhite: ['7', 'e'], expectedBlack: ['2', 'd'] },
		{ rowCol: [1, 5], expectedWhite: ['7', 'f'], expectedBlack: ['2', 'c'] },
		{ rowCol: [1, 6], expectedWhite: ['7', 'g'], expectedBlack: ['2', 'b'] },
		{ rowCol: [1, 7], expectedWhite: ['7', 'h'], expectedBlack: ['2', 'a'] },
		{ rowCol: [2, 0], expectedWhite: ['6', 'a'], expectedBlack: ['3', 'h'] },
		{ rowCol: [2, 1], expectedWhite: ['6', 'b'], expectedBlack: ['3', 'g'] },
		{ rowCol: [2, 2], expectedWhite: ['6', 'c'], expectedBlack: ['3', 'f'] },
		{ rowCol: [2, 3], expectedWhite: ['6', 'd'], expectedBlack: ['3', 'e'] },
		{ rowCol: [2, 4], expectedWhite: ['6', 'e'], expectedBlack: ['3', 'd'] },
		{ rowCol: [2, 5], expectedWhite: ['6', 'f'], expectedBlack: ['3', 'c'] },
		{ rowCol: [2, 6], expectedWhite: ['6', 'g'], expectedBlack: ['3', 'b'] },
		{ rowCol: [2, 7], expectedWhite: ['6', 'h'], expectedBlack: ['3', 'a'] },
		{ rowCol: [3, 0], expectedWhite: ['5', 'a'], expectedBlack: ['4', 'h'] },
		{ rowCol: [3, 1], expectedWhite: ['5', 'b'], expectedBlack: ['4', 'g'] },
		{ rowCol: [3, 2], expectedWhite: ['5', 'c'], expectedBlack: ['4', 'f'] },
		{ rowCol: [3, 3], expectedWhite: ['5', 'd'], expectedBlack: ['4', 'e'] },
		{ rowCol: [3, 4], expectedWhite: ['5', 'e'], expectedBlack: ['4', 'd'] },
		{ rowCol: [3, 5], expectedWhite: ['5', 'f'], expectedBlack: ['4', 'c'] },
		{ rowCol: [3, 6], expectedWhite: ['5', 'g'], expectedBlack: ['4', 'b'] },
		{ rowCol: [3, 7], expectedWhite: ['5', 'h'], expectedBlack: ['4', 'a'] },
		{ rowCol: [4, 0], expectedWhite: ['4', 'a'], expectedBlack: ['5', 'h'] },
		{ rowCol: [4, 1], expectedWhite: ['4', 'b'], expectedBlack: ['5', 'g'] },
		{ rowCol: [4, 2], expectedWhite: ['4', 'c'], expectedBlack: ['5', 'f'] },
		{ rowCol: [4, 3], expectedWhite: ['4', 'd'], expectedBlack: ['5', 'e'] },
		{ rowCol: [4, 4], expectedWhite: ['4', 'e'], expectedBlack: ['5', 'd'] },
		{ rowCol: [4, 5], expectedWhite: ['4', 'f'], expectedBlack: ['5', 'c'] },
		{ rowCol: [4, 6], expectedWhite: ['4', 'g'], expectedBlack: ['5', 'b'] },
		{ rowCol: [4, 7], expectedWhite: ['4', 'h'], expectedBlack: ['5', 'a'] },
		{ rowCol: [5, 0], expectedWhite: ['3', 'a'], expectedBlack: ['6', 'h'] },
		{ rowCol: [5, 1], expectedWhite: ['3', 'b'], expectedBlack: ['6', 'g'] },
		{ rowCol: [5, 2], expectedWhite: ['3', 'c'], expectedBlack: ['6', 'f'] },
		{ rowCol: [5, 3], expectedWhite: ['3', 'd'], expectedBlack: ['6', 'e'] },
		{ rowCol: [5, 4], expectedWhite: ['3', 'e'], expectedBlack: ['6', 'd'] },
		{ rowCol: [5, 5], expectedWhite: ['3', 'f'], expectedBlack: ['6', 'c'] },
		{ rowCol: [5, 6], expectedWhite: ['3', 'g'], expectedBlack: ['6', 'b'] },
		{ rowCol: [5, 7], expectedWhite: ['3', 'h'], expectedBlack: ['6', 'a'] },
		{ rowCol: [6, 0], expectedWhite: ['2', 'a'], expectedBlack: ['7', 'h'] },
		{ rowCol: [6, 1], expectedWhite: ['2', 'b'], expectedBlack: ['7', 'g'] },
		{ rowCol: [6, 2], expectedWhite: ['2', 'c'], expectedBlack: ['7', 'f'] },
		{ rowCol: [6, 3], expectedWhite: ['2', 'd'], expectedBlack: ['7', 'e'] },
		{ rowCol: [6, 4], expectedWhite: ['2', 'e'], expectedBlack: ['7', 'd'] },
		{ rowCol: [6, 5], expectedWhite: ['2', 'f'], expectedBlack: ['7', 'c'] },
		{ rowCol: [6, 6], expectedWhite: ['2', 'g'], expectedBlack: ['7', 'b'] },
		{ rowCol: [6, 7], expectedWhite: ['2', 'h'], expectedBlack: ['7', 'a'] },
		{ rowCol: [7, 0], expectedWhite: ['1', 'a'], expectedBlack: ['8', 'h'] },
		{ rowCol: [7, 1], expectedWhite: ['1', 'b'], expectedBlack: ['8', 'g'] },
		{ rowCol: [7, 2], expectedWhite: ['1', 'c'], expectedBlack: ['8', 'f'] },
		{ rowCol: [7, 3], expectedWhite: ['1', 'd'], expectedBlack: ['8', 'e'] },
		{ rowCol: [7, 4], expectedWhite: ['1', 'e'], expectedBlack: ['8', 'd'] },
		{ rowCol: [7, 5], expectedWhite: ['1', 'f'], expectedBlack: ['8', 'c'] },
		{ rowCol: [7, 6], expectedWhite: ['1', 'g'], expectedBlack: ['8', 'b'] },
		{ rowCol: [7, 7], expectedWhite: ['1', 'h'], expectedBlack: ['8', 'a'] },
	];

	for (const tc of testCases) {
		await t.test(`rankFileFromRowCol for: ${tc.rowCol}`, () => {
			const whiteResult = rankFileFromRowCol(tc.rowCol[0], tc.rowCol[1], 'w');
			const blackResult = rankFileFromRowCol(tc.rowCol[0], tc.rowCol[1], 'b');
			assert.deepStrictEqual(whiteResult, tc.expectedWhite);
			assert.deepStrictEqual(blackResult, tc.expectedBlack);
		});
	}
});

test('coordFromRowCol', async t => {
	const testCases: { rowCol: RowCol; expectedWhite: Coord; expectedBlack: Coord }[] = [
		{ rowCol: [0, 0], expectedWhite: 'a8', expectedBlack: 'h1' },
		{ rowCol: [0, 1], expectedWhite: 'b8', expectedBlack: 'g1' },
		{ rowCol: [0, 2], expectedWhite: 'c8', expectedBlack: 'f1' },
		{ rowCol: [0, 3], expectedWhite: 'd8', expectedBlack: 'e1' },
		{ rowCol: [0, 4], expectedWhite: 'e8', expectedBlack: 'd1' },
		{ rowCol: [0, 5], expectedWhite: 'f8', expectedBlack: 'c1' },
		{ rowCol: [0, 6], expectedWhite: 'g8', expectedBlack: 'b1' },
		{ rowCol: [0, 7], expectedWhite: 'h8', expectedBlack: 'a1' },
		{ rowCol: [1, 0], expectedWhite: 'a7', expectedBlack: 'h2' },
		{ rowCol: [1, 1], expectedWhite: 'b7', expectedBlack: 'g2' },
		{ rowCol: [1, 2], expectedWhite: 'c7', expectedBlack: 'f2' },
		{ rowCol: [1, 3], expectedWhite: 'd7', expectedBlack: 'e2' },
		{ rowCol: [1, 4], expectedWhite: 'e7', expectedBlack: 'd2' },
		{ rowCol: [1, 5], expectedWhite: 'f7', expectedBlack: 'c2' },
		{ rowCol: [1, 6], expectedWhite: 'g7', expectedBlack: 'b2' },
		{ rowCol: [1, 7], expectedWhite: 'h7', expectedBlack: 'a2' },
		{ rowCol: [2, 0], expectedWhite: 'a6', expectedBlack: 'h3' },
		{ rowCol: [2, 1], expectedWhite: 'b6', expectedBlack: 'g3' },
		{ rowCol: [2, 2], expectedWhite: 'c6', expectedBlack: 'f3' },
		{ rowCol: [2, 3], expectedWhite: 'd6', expectedBlack: 'e3' },
		{ rowCol: [2, 4], expectedWhite: 'e6', expectedBlack: 'd3' },
		{ rowCol: [2, 5], expectedWhite: 'f6', expectedBlack: 'c3' },
		{ rowCol: [2, 6], expectedWhite: 'g6', expectedBlack: 'b3' },
		{ rowCol: [2, 7], expectedWhite: 'h6', expectedBlack: 'a3' },
		{ rowCol: [3, 0], expectedWhite: 'a5', expectedBlack: 'h4' },
		{ rowCol: [3, 1], expectedWhite: 'b5', expectedBlack: 'g4' },
		{ rowCol: [3, 2], expectedWhite: 'c5', expectedBlack: 'f4' },
		{ rowCol: [3, 3], expectedWhite: 'd5', expectedBlack: 'e4' },
		{ rowCol: [3, 4], expectedWhite: 'e5', expectedBlack: 'd4' },
		{ rowCol: [3, 5], expectedWhite: 'f5', expectedBlack: 'c4' },
		{ rowCol: [3, 6], expectedWhite: 'g5', expectedBlack: 'b4' },
		{ rowCol: [3, 7], expectedWhite: 'h5', expectedBlack: 'a4' },
		{ rowCol: [4, 0], expectedWhite: 'a4', expectedBlack: 'h5' },
		{ rowCol: [4, 1], expectedWhite: 'b4', expectedBlack: 'g5' },
		{ rowCol: [4, 2], expectedWhite: 'c4', expectedBlack: 'f5' },
		{ rowCol: [4, 3], expectedWhite: 'd4', expectedBlack: 'e5' },
		{ rowCol: [4, 4], expectedWhite: 'e4', expectedBlack: 'd5' },
		{ rowCol: [4, 5], expectedWhite: 'f4', expectedBlack: 'c5' },
		{ rowCol: [4, 6], expectedWhite: 'g4', expectedBlack: 'b5' },
		{ rowCol: [4, 7], expectedWhite: 'h4', expectedBlack: 'a5' },
		{ rowCol: [5, 0], expectedWhite: 'a3', expectedBlack: 'h6' },
		{ rowCol: [5, 1], expectedWhite: 'b3', expectedBlack: 'g6' },
		{ rowCol: [5, 2], expectedWhite: 'c3', expectedBlack: 'f6' },
		{ rowCol: [5, 3], expectedWhite: 'd3', expectedBlack: 'e6' },
		{ rowCol: [5, 4], expectedWhite: 'e3', expectedBlack: 'd6' },
		{ rowCol: [5, 5], expectedWhite: 'f3', expectedBlack: 'c6' },
		{ rowCol: [5, 6], expectedWhite: 'g3', expectedBlack: 'b6' },
		{ rowCol: [5, 7], expectedWhite: 'h3', expectedBlack: 'a6' },
		{ rowCol: [6, 0], expectedWhite: 'a2', expectedBlack: 'h7' },
		{ rowCol: [6, 1], expectedWhite: 'b2', expectedBlack: 'g7' },
		{ rowCol: [6, 2], expectedWhite: 'c2', expectedBlack: 'f7' },
		{ rowCol: [6, 3], expectedWhite: 'd2', expectedBlack: 'e7' },
		{ rowCol: [6, 4], expectedWhite: 'e2', expectedBlack: 'd7' },
		{ rowCol: [6, 5], expectedWhite: 'f2', expectedBlack: 'c7' },
		{ rowCol: [6, 6], expectedWhite: 'g2', expectedBlack: 'b7' },
		{ rowCol: [6, 7], expectedWhite: 'h2', expectedBlack: 'a7' },
		{ rowCol: [7, 0], expectedWhite: 'a1', expectedBlack: 'h8' },
		{ rowCol: [7, 1], expectedWhite: 'b1', expectedBlack: 'g8' },
		{ rowCol: [7, 2], expectedWhite: 'c1', expectedBlack: 'f8' },
		{ rowCol: [7, 3], expectedWhite: 'd1', expectedBlack: 'e8' },
		{ rowCol: [7, 4], expectedWhite: 'e1', expectedBlack: 'd8' },
		{ rowCol: [7, 5], expectedWhite: 'f1', expectedBlack: 'c8' },
		{ rowCol: [7, 6], expectedWhite: 'g1', expectedBlack: 'b8' },
		{ rowCol: [7, 7], expectedWhite: 'h1', expectedBlack: 'a8' },
	];

	for (const tc of testCases) {
		await t.test(`coordFromRowCol for: ${tc.rowCol}`, () => {
			const whiteResult = coordFromRowCol(tc.rowCol[0], tc.rowCol[1], 'w');
			const blackResult = coordFromRowCol(tc.rowCol[0], tc.rowCol[1], 'b');
			assert.strictEqual(whiteResult, tc.expectedWhite);
			assert.strictEqual(blackResult, tc.expectedBlack);
		});
	}
});

test('rowColFromRankFile', async t => {
	const testCases: { rankFile: RankFile; expectedWhite: RowCol; expectedBlack: RowCol }[] = [
		{ rankFile: ['8', 'a'], expectedWhite: [0, 0], expectedBlack: [7, 7] },
		{ rankFile: ['8', 'b'], expectedWhite: [0, 1], expectedBlack: [7, 6] },
		{ rankFile: ['8', 'c'], expectedWhite: [0, 2], expectedBlack: [7, 5] },
		{ rankFile: ['8', 'd'], expectedWhite: [0, 3], expectedBlack: [7, 4] },
		{ rankFile: ['8', 'e'], expectedWhite: [0, 4], expectedBlack: [7, 3] },
		{ rankFile: ['8', 'f'], expectedWhite: [0, 5], expectedBlack: [7, 2] },
		{ rankFile: ['8', 'g'], expectedWhite: [0, 6], expectedBlack: [7, 1] },
		{ rankFile: ['8', 'h'], expectedWhite: [0, 7], expectedBlack: [7, 0] },
		{ rankFile: ['7', 'a'], expectedWhite: [1, 0], expectedBlack: [6, 7] },
		{ rankFile: ['7', 'b'], expectedWhite: [1, 1], expectedBlack: [6, 6] },
		{ rankFile: ['7', 'c'], expectedWhite: [1, 2], expectedBlack: [6, 5] },
		{ rankFile: ['7', 'd'], expectedWhite: [1, 3], expectedBlack: [6, 4] },
		{ rankFile: ['7', 'e'], expectedWhite: [1, 4], expectedBlack: [6, 3] },
		{ rankFile: ['7', 'f'], expectedWhite: [1, 5], expectedBlack: [6, 2] },
		{ rankFile: ['7', 'g'], expectedWhite: [1, 6], expectedBlack: [6, 1] },
		{ rankFile: ['7', 'h'], expectedWhite: [1, 7], expectedBlack: [6, 0] },
		{ rankFile: ['6', 'a'], expectedWhite: [2, 0], expectedBlack: [5, 7] },
		{ rankFile: ['6', 'b'], expectedWhite: [2, 1], expectedBlack: [5, 6] },
		{ rankFile: ['6', 'c'], expectedWhite: [2, 2], expectedBlack: [5, 5] },
		{ rankFile: ['6', 'd'], expectedWhite: [2, 3], expectedBlack: [5, 4] },
		{ rankFile: ['6', 'e'], expectedWhite: [2, 4], expectedBlack: [5, 3] },
		{ rankFile: ['6', 'f'], expectedWhite: [2, 5], expectedBlack: [5, 2] },
		{ rankFile: ['6', 'g'], expectedWhite: [2, 6], expectedBlack: [5, 1] },
		{ rankFile: ['6', 'h'], expectedWhite: [2, 7], expectedBlack: [5, 0] },
		{ rankFile: ['5', 'a'], expectedWhite: [3, 0], expectedBlack: [4, 7] },
		{ rankFile: ['5', 'b'], expectedWhite: [3, 1], expectedBlack: [4, 6] },
		{ rankFile: ['5', 'c'], expectedWhite: [3, 2], expectedBlack: [4, 5] },
		{ rankFile: ['5', 'd'], expectedWhite: [3, 3], expectedBlack: [4, 4] },
		{ rankFile: ['5', 'e'], expectedWhite: [3, 4], expectedBlack: [4, 3] },
		{ rankFile: ['5', 'f'], expectedWhite: [3, 5], expectedBlack: [4, 2] },
		{ rankFile: ['5', 'g'], expectedWhite: [3, 6], expectedBlack: [4, 1] },
		{ rankFile: ['5', 'h'], expectedWhite: [3, 7], expectedBlack: [4, 0] },
		{ rankFile: ['4', 'a'], expectedWhite: [4, 0], expectedBlack: [3, 7] },
		{ rankFile: ['4', 'b'], expectedWhite: [4, 1], expectedBlack: [3, 6] },
		{ rankFile: ['4', 'c'], expectedWhite: [4, 2], expectedBlack: [3, 5] },
		{ rankFile: ['4', 'd'], expectedWhite: [4, 3], expectedBlack: [3, 4] },
		{ rankFile: ['4', 'e'], expectedWhite: [4, 4], expectedBlack: [3, 3] },
		{ rankFile: ['4', 'f'], expectedWhite: [4, 5], expectedBlack: [3, 2] },
		{ rankFile: ['4', 'g'], expectedWhite: [4, 6], expectedBlack: [3, 1] },
		{ rankFile: ['4', 'h'], expectedWhite: [4, 7], expectedBlack: [3, 0] },
		{ rankFile: ['3', 'a'], expectedWhite: [5, 0], expectedBlack: [2, 7] },
		{ rankFile: ['3', 'b'], expectedWhite: [5, 1], expectedBlack: [2, 6] },
		{ rankFile: ['3', 'c'], expectedWhite: [5, 2], expectedBlack: [2, 5] },
		{ rankFile: ['3', 'd'], expectedWhite: [5, 3], expectedBlack: [2, 4] },
		{ rankFile: ['3', 'e'], expectedWhite: [5, 4], expectedBlack: [2, 3] },
		{ rankFile: ['3', 'f'], expectedWhite: [5, 5], expectedBlack: [2, 2] },
		{ rankFile: ['3', 'g'], expectedWhite: [5, 6], expectedBlack: [2, 1] },
		{ rankFile: ['3', 'h'], expectedWhite: [5, 7], expectedBlack: [2, 0] },
		{ rankFile: ['2', 'a'], expectedWhite: [6, 0], expectedBlack: [1, 7] },
		{ rankFile: ['2', 'b'], expectedWhite: [6, 1], expectedBlack: [1, 6] },
		{ rankFile: ['2', 'c'], expectedWhite: [6, 2], expectedBlack: [1, 5] },
		{ rankFile: ['2', 'd'], expectedWhite: [6, 3], expectedBlack: [1, 4] },
		{ rankFile: ['2', 'e'], expectedWhite: [6, 4], expectedBlack: [1, 3] },
		{ rankFile: ['2', 'f'], expectedWhite: [6, 5], expectedBlack: [1, 2] },
		{ rankFile: ['2', 'g'], expectedWhite: [6, 6], expectedBlack: [1, 1] },
		{ rankFile: ['2', 'h'], expectedWhite: [6, 7], expectedBlack: [1, 0] },
		{ rankFile: ['1', 'a'], expectedWhite: [7, 0], expectedBlack: [0, 7] },
		{ rankFile: ['1', 'b'], expectedWhite: [7, 1], expectedBlack: [0, 6] },
		{ rankFile: ['1', 'c'], expectedWhite: [7, 2], expectedBlack: [0, 5] },
		{ rankFile: ['1', 'd'], expectedWhite: [7, 3], expectedBlack: [0, 4] },
		{ rankFile: ['1', 'e'], expectedWhite: [7, 4], expectedBlack: [0, 3] },
		{ rankFile: ['1', 'f'], expectedWhite: [7, 5], expectedBlack: [0, 2] },
		{ rankFile: ['1', 'g'], expectedWhite: [7, 6], expectedBlack: [0, 1] },
		{ rankFile: ['1', 'h'], expectedWhite: [7, 7], expectedBlack: [0, 0] },
	];

	for (const tc of testCases) {
		await t.test(`rowColFromRankFile for: ${tc.rankFile}`, () => {
			const whiteResult = rowColFromRankFile(tc.rankFile[0], tc.rankFile[1], 'w');
			const blackResult = rowColFromRankFile(tc.rankFile[0], tc.rankFile[1], 'b');
			assert.deepStrictEqual(whiteResult, tc.expectedWhite);
			assert.deepStrictEqual(blackResult, tc.expectedBlack);
		});
	}
});

test('coordFromRankFile', async t => {
	const testCases: { rankFile: RankFile; expected: Coord }[] = [
		{ rankFile: ['8', 'a'], expected: 'a8' },
		{ rankFile: ['8', 'b'], expected: 'b8' },
		{ rankFile: ['8', 'c'], expected: 'c8' },
		{ rankFile: ['8', 'd'], expected: 'd8' },
		{ rankFile: ['8', 'e'], expected: 'e8' },
		{ rankFile: ['8', 'f'], expected: 'f8' },
		{ rankFile: ['8', 'g'], expected: 'g8' },
		{ rankFile: ['8', 'h'], expected: 'h8' },
		{ rankFile: ['7', 'a'], expected: 'a7' },
		{ rankFile: ['7', 'b'], expected: 'b7' },
		{ rankFile: ['7', 'c'], expected: 'c7' },
		{ rankFile: ['7', 'd'], expected: 'd7' },
		{ rankFile: ['7', 'e'], expected: 'e7' },
		{ rankFile: ['7', 'f'], expected: 'f7' },
		{ rankFile: ['7', 'g'], expected: 'g7' },
		{ rankFile: ['7', 'h'], expected: 'h7' },
		{ rankFile: ['6', 'a'], expected: 'a6' },
		{ rankFile: ['6', 'b'], expected: 'b6' },
		{ rankFile: ['6', 'c'], expected: 'c6' },
		{ rankFile: ['6', 'd'], expected: 'd6' },
		{ rankFile: ['6', 'e'], expected: 'e6' },
		{ rankFile: ['6', 'f'], expected: 'f6' },
		{ rankFile: ['6', 'g'], expected: 'g6' },
		{ rankFile: ['6', 'h'], expected: 'h6' },
		{ rankFile: ['5', 'a'], expected: 'a5' },
		{ rankFile: ['5', 'b'], expected: 'b5' },
		{ rankFile: ['5', 'c'], expected: 'c5' },
		{ rankFile: ['5', 'd'], expected: 'd5' },
		{ rankFile: ['5', 'e'], expected: 'e5' },
		{ rankFile: ['5', 'f'], expected: 'f5' },
		{ rankFile: ['5', 'g'], expected: 'g5' },
		{ rankFile: ['5', 'h'], expected: 'h5' },
		{ rankFile: ['4', 'a'], expected: 'a4' },
		{ rankFile: ['4', 'b'], expected: 'b4' },
		{ rankFile: ['4', 'c'], expected: 'c4' },
		{ rankFile: ['4', 'd'], expected: 'd4' },
		{ rankFile: ['4', 'e'], expected: 'e4' },
		{ rankFile: ['4', 'f'], expected: 'f4' },
		{ rankFile: ['4', 'g'], expected: 'g4' },
		{ rankFile: ['4', 'h'], expected: 'h4' },
		{ rankFile: ['3', 'a'], expected: 'a3' },
		{ rankFile: ['3', 'b'], expected: 'b3' },
		{ rankFile: ['3', 'c'], expected: 'c3' },
		{ rankFile: ['3', 'd'], expected: 'd3' },
		{ rankFile: ['3', 'e'], expected: 'e3' },
		{ rankFile: ['3', 'f'], expected: 'f3' },
		{ rankFile: ['3', 'g'], expected: 'g3' },
		{ rankFile: ['3', 'h'], expected: 'h3' },
		{ rankFile: ['2', 'a'], expected: 'a2' },
		{ rankFile: ['2', 'b'], expected: 'b2' },
		{ rankFile: ['2', 'c'], expected: 'c2' },
		{ rankFile: ['2', 'd'], expected: 'd2' },
		{ rankFile: ['2', 'e'], expected: 'e2' },
		{ rankFile: ['2', 'f'], expected: 'f2' },
		{ rankFile: ['2', 'g'], expected: 'g2' },
		{ rankFile: ['2', 'h'], expected: 'h2' },
		{ rankFile: ['1', 'a'], expected: 'a1' },
		{ rankFile: ['1', 'b'], expected: 'b1' },
		{ rankFile: ['1', 'c'], expected: 'c1' },
		{ rankFile: ['1', 'd'], expected: 'd1' },
		{ rankFile: ['1', 'e'], expected: 'e1' },
		{ rankFile: ['1', 'f'], expected: 'f1' },
		{ rankFile: ['1', 'g'], expected: 'g1' },
		{ rankFile: ['1', 'h'], expected: 'h1' },
	];

	for (const tc of testCases) {
		await t.test(`coordFromRankFile for: ${tc.rankFile}`, () => {
			const expected = coordFromRankFile(tc.rankFile[0], tc.rankFile[1]);
			assert.strictEqual(expected, tc.expected);
		});
	}
});

test('rankFileFromCoord', async t => {
	const testCases: { coord: Coord; expected: RankFile }[] = [
		{ coord: 'a8', expected: ['8', 'a'] },
		{ coord: 'b8', expected: ['8', 'b'] },
		{ coord: 'c8', expected: ['8', 'c'] },
		{ coord: 'd8', expected: ['8', 'd'] },
		{ coord: 'e8', expected: ['8', 'e'] },
		{ coord: 'f8', expected: ['8', 'f'] },
		{ coord: 'g8', expected: ['8', 'g'] },
		{ coord: 'h8', expected: ['8', 'h'] },
		{ coord: 'a7', expected: ['7', 'a'] },
		{ coord: 'b7', expected: ['7', 'b'] },
		{ coord: 'c7', expected: ['7', 'c'] },
		{ coord: 'd7', expected: ['7', 'd'] },
		{ coord: 'e7', expected: ['7', 'e'] },
		{ coord: 'f7', expected: ['7', 'f'] },
		{ coord: 'g7', expected: ['7', 'g'] },
		{ coord: 'h7', expected: ['7', 'h'] },
		{ coord: 'a6', expected: ['6', 'a'] },
		{ coord: 'b6', expected: ['6', 'b'] },
		{ coord: 'c6', expected: ['6', 'c'] },
		{ coord: 'd6', expected: ['6', 'd'] },
		{ coord: 'e6', expected: ['6', 'e'] },
		{ coord: 'f6', expected: ['6', 'f'] },
		{ coord: 'g6', expected: ['6', 'g'] },
		{ coord: 'h6', expected: ['6', 'h'] },
		{ coord: 'a5', expected: ['5', 'a'] },
		{ coord: 'b5', expected: ['5', 'b'] },
		{ coord: 'c5', expected: ['5', 'c'] },
		{ coord: 'd5', expected: ['5', 'd'] },
		{ coord: 'e5', expected: ['5', 'e'] },
		{ coord: 'f5', expected: ['5', 'f'] },
		{ coord: 'g5', expected: ['5', 'g'] },
		{ coord: 'h5', expected: ['5', 'h'] },
		{ coord: 'a4', expected: ['4', 'a'] },
		{ coord: 'b4', expected: ['4', 'b'] },
		{ coord: 'c4', expected: ['4', 'c'] },
		{ coord: 'd4', expected: ['4', 'd'] },
		{ coord: 'e4', expected: ['4', 'e'] },
		{ coord: 'f4', expected: ['4', 'f'] },
		{ coord: 'g4', expected: ['4', 'g'] },
		{ coord: 'h4', expected: ['4', 'h'] },
		{ coord: 'a3', expected: ['3', 'a'] },
		{ coord: 'b3', expected: ['3', 'b'] },
		{ coord: 'c3', expected: ['3', 'c'] },
		{ coord: 'd3', expected: ['3', 'd'] },
		{ coord: 'e3', expected: ['3', 'e'] },
		{ coord: 'f3', expected: ['3', 'f'] },
		{ coord: 'g3', expected: ['3', 'g'] },
		{ coord: 'h3', expected: ['3', 'h'] },
		{ coord: 'a2', expected: ['2', 'a'] },
		{ coord: 'b2', expected: ['2', 'b'] },
		{ coord: 'c2', expected: ['2', 'c'] },
		{ coord: 'd2', expected: ['2', 'd'] },
		{ coord: 'e2', expected: ['2', 'e'] },
		{ coord: 'f2', expected: ['2', 'f'] },
		{ coord: 'g2', expected: ['2', 'g'] },
		{ coord: 'h2', expected: ['2', 'h'] },
		{ coord: 'a1', expected: ['1', 'a'] },
		{ coord: 'b1', expected: ['1', 'b'] },
		{ coord: 'c1', expected: ['1', 'c'] },
		{ coord: 'd1', expected: ['1', 'd'] },
		{ coord: 'e1', expected: ['1', 'e'] },
		{ coord: 'f1', expected: ['1', 'f'] },
		{ coord: 'g1', expected: ['1', 'g'] },
		{ coord: 'h1', expected: ['1', 'h'] },
	];

	for (const tc of testCases) {
		await t.test(`rankFileFromCoord for: ${tc.coord}`, () => {
			const expected = rankFileFromCoord(tc.coord);
			assert.deepStrictEqual(expected, tc.expected);
		});
	}
});

test('rowColFromCoord', async t => {
	const testCases: { coord: Coord; expectedWhite: RowCol; expectedBlack: RowCol }[] = [
		{ coord: 'a8', expectedWhite: [0, 0], expectedBlack: [7, 7] },
		{ coord: 'b8', expectedWhite: [0, 1], expectedBlack: [7, 6] },
		{ coord: 'c8', expectedWhite: [0, 2], expectedBlack: [7, 5] },
		{ coord: 'd8', expectedWhite: [0, 3], expectedBlack: [7, 4] },
		{ coord: 'e8', expectedWhite: [0, 4], expectedBlack: [7, 3] },
		{ coord: 'f8', expectedWhite: [0, 5], expectedBlack: [7, 2] },
		{ coord: 'g8', expectedWhite: [0, 6], expectedBlack: [7, 1] },
		{ coord: 'h8', expectedWhite: [0, 7], expectedBlack: [7, 0] },
		{ coord: 'a7', expectedWhite: [1, 0], expectedBlack: [6, 7] },
		{ coord: 'b7', expectedWhite: [1, 1], expectedBlack: [6, 6] },
		{ coord: 'c7', expectedWhite: [1, 2], expectedBlack: [6, 5] },
		{ coord: 'd7', expectedWhite: [1, 3], expectedBlack: [6, 4] },
		{ coord: 'e7', expectedWhite: [1, 4], expectedBlack: [6, 3] },
		{ coord: 'f7', expectedWhite: [1, 5], expectedBlack: [6, 2] },
		{ coord: 'g7', expectedWhite: [1, 6], expectedBlack: [6, 1] },
		{ coord: 'h7', expectedWhite: [1, 7], expectedBlack: [6, 0] },
		{ coord: 'a6', expectedWhite: [2, 0], expectedBlack: [5, 7] },
		{ coord: 'b6', expectedWhite: [2, 1], expectedBlack: [5, 6] },
		{ coord: 'c6', expectedWhite: [2, 2], expectedBlack: [5, 5] },
		{ coord: 'd6', expectedWhite: [2, 3], expectedBlack: [5, 4] },
		{ coord: 'e6', expectedWhite: [2, 4], expectedBlack: [5, 3] },
		{ coord: 'f6', expectedWhite: [2, 5], expectedBlack: [5, 2] },
		{ coord: 'g6', expectedWhite: [2, 6], expectedBlack: [5, 1] },
		{ coord: 'h6', expectedWhite: [2, 7], expectedBlack: [5, 0] },
		{ coord: 'a5', expectedWhite: [3, 0], expectedBlack: [4, 7] },
		{ coord: 'b5', expectedWhite: [3, 1], expectedBlack: [4, 6] },
		{ coord: 'c5', expectedWhite: [3, 2], expectedBlack: [4, 5] },
		{ coord: 'd5', expectedWhite: [3, 3], expectedBlack: [4, 4] },
		{ coord: 'e5', expectedWhite: [3, 4], expectedBlack: [4, 3] },
		{ coord: 'f5', expectedWhite: [3, 5], expectedBlack: [4, 2] },
		{ coord: 'g5', expectedWhite: [3, 6], expectedBlack: [4, 1] },
		{ coord: 'h5', expectedWhite: [3, 7], expectedBlack: [4, 0] },
		{ coord: 'a4', expectedWhite: [4, 0], expectedBlack: [3, 7] },
		{ coord: 'b4', expectedWhite: [4, 1], expectedBlack: [3, 6] },
		{ coord: 'c4', expectedWhite: [4, 2], expectedBlack: [3, 5] },
		{ coord: 'd4', expectedWhite: [4, 3], expectedBlack: [3, 4] },
		{ coord: 'e4', expectedWhite: [4, 4], expectedBlack: [3, 3] },
		{ coord: 'f4', expectedWhite: [4, 5], expectedBlack: [3, 2] },
		{ coord: 'g4', expectedWhite: [4, 6], expectedBlack: [3, 1] },
		{ coord: 'h4', expectedWhite: [4, 7], expectedBlack: [3, 0] },
		{ coord: 'a3', expectedWhite: [5, 0], expectedBlack: [2, 7] },
		{ coord: 'b3', expectedWhite: [5, 1], expectedBlack: [2, 6] },
		{ coord: 'c3', expectedWhite: [5, 2], expectedBlack: [2, 5] },
		{ coord: 'd3', expectedWhite: [5, 3], expectedBlack: [2, 4] },
		{ coord: 'e3', expectedWhite: [5, 4], expectedBlack: [2, 3] },
		{ coord: 'f3', expectedWhite: [5, 5], expectedBlack: [2, 2] },
		{ coord: 'g3', expectedWhite: [5, 6], expectedBlack: [2, 1] },
		{ coord: 'h3', expectedWhite: [5, 7], expectedBlack: [2, 0] },
		{ coord: 'a2', expectedWhite: [6, 0], expectedBlack: [1, 7] },
		{ coord: 'b2', expectedWhite: [6, 1], expectedBlack: [1, 6] },
		{ coord: 'c2', expectedWhite: [6, 2], expectedBlack: [1, 5] },
		{ coord: 'd2', expectedWhite: [6, 3], expectedBlack: [1, 4] },
		{ coord: 'e2', expectedWhite: [6, 4], expectedBlack: [1, 3] },
		{ coord: 'f2', expectedWhite: [6, 5], expectedBlack: [1, 2] },
		{ coord: 'g2', expectedWhite: [6, 6], expectedBlack: [1, 1] },
		{ coord: 'h2', expectedWhite: [6, 7], expectedBlack: [1, 0] },
		{ coord: 'a1', expectedWhite: [7, 0], expectedBlack: [0, 7] },
		{ coord: 'b1', expectedWhite: [7, 1], expectedBlack: [0, 6] },
		{ coord: 'c1', expectedWhite: [7, 2], expectedBlack: [0, 5] },
		{ coord: 'd1', expectedWhite: [7, 3], expectedBlack: [0, 4] },
		{ coord: 'e1', expectedWhite: [7, 4], expectedBlack: [0, 3] },
		{ coord: 'f1', expectedWhite: [7, 5], expectedBlack: [0, 2] },
		{ coord: 'g1', expectedWhite: [7, 6], expectedBlack: [0, 1] },
		{ coord: 'h1', expectedWhite: [7, 7], expectedBlack: [0, 0] },
	];

	for (const tc of testCases) {
		await t.test(`rowColFromCoord for: ${tc.coord}`, () => {
			const expectedWhite = rowColFromCoord(tc.coord, 'w');
			const expectedBlack = rowColFromCoord(tc.coord, 'b');
			assert.deepStrictEqual(expectedWhite, tc.expectedWhite);
			assert.deepStrictEqual(expectedBlack, tc.expectedBlack);
		});
	}
});

test('getSquareColor', async t => {
	const testCases: { coord: Coord; color: Color }[] = [
		{ coord: 'a8', color: 'w' },
		{ coord: 'b8', color: 'b' },
		{ coord: 'c8', color: 'w' },
		{ coord: 'd8', color: 'b' },
		{ coord: 'e8', color: 'w' },
		{ coord: 'f8', color: 'b' },
		{ coord: 'g8', color: 'w' },
		{ coord: 'h8', color: 'b' },
		{ coord: 'a7', color: 'b' },
		{ coord: 'b7', color: 'w' },
		{ coord: 'c7', color: 'b' },
		{ coord: 'd7', color: 'w' },
		{ coord: 'e7', color: 'b' },
		{ coord: 'f7', color: 'w' },
		{ coord: 'g7', color: 'b' },
		{ coord: 'h7', color: 'w' },
		{ coord: 'a6', color: 'w' },
		{ coord: 'b6', color: 'b' },
		{ coord: 'c6', color: 'w' },
		{ coord: 'd6', color: 'b' },
		{ coord: 'e6', color: 'w' },
		{ coord: 'f6', color: 'b' },
		{ coord: 'g6', color: 'w' },
		{ coord: 'h6', color: 'b' },
		{ coord: 'a5', color: 'b' },
		{ coord: 'b5', color: 'w' },
		{ coord: 'c5', color: 'b' },
		{ coord: 'd5', color: 'w' },
		{ coord: 'e5', color: 'b' },
		{ coord: 'f5', color: 'w' },
		{ coord: 'g5', color: 'b' },
		{ coord: 'h5', color: 'w' },
		{ coord: 'a4', color: 'w' },
		{ coord: 'b4', color: 'b' },
		{ coord: 'c4', color: 'w' },
		{ coord: 'd4', color: 'b' },
		{ coord: 'e4', color: 'w' },
		{ coord: 'f4', color: 'b' },
		{ coord: 'g4', color: 'w' },
		{ coord: 'h4', color: 'b' },
		{ coord: 'a3', color: 'b' },
		{ coord: 'b3', color: 'w' },
		{ coord: 'c3', color: 'b' },
		{ coord: 'd3', color: 'w' },
		{ coord: 'e3', color: 'b' },
		{ coord: 'f3', color: 'w' },
		{ coord: 'g3', color: 'b' },
		{ coord: 'h3', color: 'w' },
		{ coord: 'a2', color: 'w' },
		{ coord: 'b2', color: 'b' },
		{ coord: 'c2', color: 'w' },
		{ coord: 'd2', color: 'b' },
		{ coord: 'e2', color: 'w' },
		{ coord: 'f2', color: 'b' },
		{ coord: 'g2', color: 'w' },
		{ coord: 'h2', color: 'b' },
		{ coord: 'a1', color: 'b' },
		{ coord: 'b1', color: 'w' },
		{ coord: 'c1', color: 'b' },
		{ coord: 'd1', color: 'w' },
		{ coord: 'e1', color: 'b' },
		{ coord: 'f1', color: 'w' },
		{ coord: 'g1', color: 'b' },
		{ coord: 'h1', color: 'w' },
	];

	for (const tc of testCases) {
		await t.test(`getSquareColor for: ${tc.coord}`, () => {
			const expected = getSquareColor(tc.coord, 'w');
			assert.strictEqual(expected, tc.color);
		});
	}
});

test('getDistanceDelta', async t => {
	const testCases: { src: Coord; dest: Coord; orientation: Color; expected: NumPair }[] = [
		{ src: 'a8', dest: 'a1', orientation: 'w', expected: [7, 0] },
		{ src: 'a1', dest: 'h8', orientation: 'w', expected: [-7, 7] },
		{ src: 'h8', dest: 'h1', orientation: 'w', expected: [7, 0] },
		{ src: 'a8', dest: 'h8', orientation: 'w', expected: [0, 7] },
		{ src: 'a1', dest: 'h1', orientation: 'w', expected: [0, 7] },
		{ src: 'e4', dest: 'd5', orientation: 'w', expected: [-1, -1] },
		{ src: 'b2', dest: 'f6', orientation: 'w', expected: [-4, 4] },
		{ src: 'g3', dest: 'b5', orientation: 'w', expected: [-2, -5] },
		{ src: 'e4', dest: 'e4', orientation: 'w', expected: [0, 0] },
		{ src: 'a8', dest: 'a1', orientation: 'b', expected: [-7, 0] },
		{ src: 'a1', dest: 'h8', orientation: 'b', expected: [7, -7] },
		{ src: 'h8', dest: 'h1', orientation: 'b', expected: [-7, 0] },
		{ src: 'a8', dest: 'h8', orientation: 'b', expected: [0, -7] },
		{ src: 'a1', dest: 'h1', orientation: 'b', expected: [0, -7] },
		{ src: 'e4', dest: 'd5', orientation: 'b', expected: [1, 1] },
		{ src: 'b2', dest: 'f6', orientation: 'b', expected: [4, -4] },
		{ src: 'g3', dest: 'b5', orientation: 'b', expected: [2, 5] },
	];

	for (const tc of testCases) {
		await t.test(`getDistanceDelta for src-dest: ${tc.src} - ${tc.dest}`, () => {
			const expected = getDistanceDelta(tc.src, tc.dest, tc.orientation);
			assert.deepStrictEqual(expected, tc.expected);
		});
	}
});

test('getDistance', async t => {
	const testCases: { src: Coord; dest: Coord; orientation: Color; expected: number }[] = [
		{ src: 'a8', dest: 'a1', orientation: 'w', expected: 7 },
		{ src: 'a1', dest: 'h8', orientation: 'w', expected: 7 },
		{ src: 'h8', dest: 'h1', orientation: 'w', expected: 7 },
		{ src: 'a8', dest: 'h8', orientation: 'w', expected: 7 },
		{ src: 'a1', dest: 'h1', orientation: 'w', expected: 7 },
		{ src: 'e4', dest: 'd5', orientation: 'w', expected: 1 },
		{ src: 'b2', dest: 'f6', orientation: 'w', expected: 4 },
		{ src: 'g3', dest: 'b5', orientation: 'w', expected: 5 },
		{ src: 'e4', dest: 'e4', orientation: 'w', expected: 0 },
		{ src: 'a8', dest: 'a1', orientation: 'b', expected: 7 },
		{ src: 'a1', dest: 'h8', orientation: 'b', expected: 7 },
		{ src: 'h8', dest: 'h1', orientation: 'b', expected: 7 },
		{ src: 'a8', dest: 'h8', orientation: 'b', expected: 7 },
		{ src: 'a1', dest: 'h1', orientation: 'b', expected: 7 },
		{ src: 'e4', dest: 'd5', orientation: 'b', expected: 1 },
		{ src: 'b2', dest: 'f6', orientation: 'b', expected: 4 },
		{ src: 'g3', dest: 'b5', orientation: 'b', expected: 5 },
	];

	for (const tc of testCases) {
		await t.test(`getDistance for src-dest: ${tc.src} - ${tc.dest}`, () => {
			const expected = getDistance(tc.src, tc.dest, tc.orientation);
			assert.deepStrictEqual(expected, tc.expected);
		});
	}
});

test('getDeltaXYFromCoord', async t => {
	const testCases: { coord: Coord; squareSize: number; orientation: Color; expected: NumPair }[] = [
		{ coord: 'a8', squareSize: 50, orientation: 'w', expected: [0, 0] },
		{ coord: 'a1', squareSize: 50, orientation: 'w', expected: [0, 350] },
		{ coord: 'h8', squareSize: 50, orientation: 'w', expected: [350, 0] },
		{ coord: 'h1', squareSize: 50, orientation: 'w', expected: [350, 350] },
		{ coord: 'e4', squareSize: 50, orientation: 'w', expected: [200, 200] },
		{ coord: 'a8', squareSize: 50, orientation: 'b', expected: [350, 350] },
		{ coord: 'a1', squareSize: 50, orientation: 'b', expected: [350, 0] },
		{ coord: 'h8', squareSize: 50, orientation: 'b', expected: [0, 350] },
		{ coord: 'h1', squareSize: 50, orientation: 'b', expected: [0, 0] },
		{ coord: 'e4', squareSize: 50, orientation: 'b', expected: [150, 150] },
	];

	for (const tc of testCases) {
		await t.test(`getDeltaXYFromCoord for: ${tc.coord}`, () => {
			const expected = getDeltaXYFromCoord(tc.coord, tc.squareSize, tc.squareSize, tc.orientation);
			assert.deepStrictEqual(expected, tc.expected);
		});
	}
});

test('getSquareCoordFromPointer', async t => {
	const mockBase = {
		target: { clientWidth: 50, clientHeight: 50, offsetParent: { offsetLeft: 0, offsetTop: 0 } },
		clientX: 0,
		clientY: 0,
	};

	const testCases: { clientXY: NumPair; orientation: Color; expected: Coord | null }[] = [
		{ clientXY: [0, 0], orientation: 'w', expected: 'a8' },
		{ clientXY: [399, 399], orientation: 'w', expected: 'h1' },
		{ clientXY: [75, 75], orientation: 'w', expected: 'b7' },
		{ clientXY: [357, 217], orientation: 'w', expected: 'h4' },
		{ clientXY: [257, 69], orientation: 'w', expected: 'f7' },
		{ clientXY: [401, 401], orientation: 'w', expected: null },
	];

	for (const tc of testCases) {
		await t.test(`getSquareCoordFromPointer for clientXY: ${tc.clientXY}`, () => {
			const mockEvent = { ...mockBase, clientX: tc.clientXY[0], clientY: tc.clientXY[1] };
			const expected = getSquareCoordFromPointer(mockEvent as any, tc.orientation);
			assert.strictEqual(expected, tc.expected);
		});
	}
});

test('getPositionChanges', async t => {
	const testCases: { fromFen: string; toFen: string; expected: Change[] }[] = [
		{ fromFen: FEN_EMPTY, toFen: FEN_EMPTY, expected: [] },
		{ fromFen: FEN_START, toFen: FEN_START, expected: [] },
		{
			fromFen: FEN_EMPTY,
			toFen: FEN_START,
			expected: [
				{ op: 'add', coord: 'a8', pieceData: { id: '', piece: 'r' } },
				{ op: 'add', coord: 'b8', pieceData: { id: '', piece: 'n' } },
				{ op: 'add', coord: 'c8', pieceData: { id: '', piece: 'b' } },
				{ op: 'add', coord: 'd8', pieceData: { id: '', piece: 'q' } },
				{ op: 'add', coord: 'e8', pieceData: { id: '', piece: 'k' } },
				{ op: 'add', coord: 'f8', pieceData: { id: '', piece: 'b' } },
				{ op: 'add', coord: 'g8', pieceData: { id: '', piece: 'n' } },
				{ op: 'add', coord: 'h8', pieceData: { id: '', piece: 'r' } },
				{ op: 'add', coord: 'a7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'b7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'c7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'd7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'e7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'f7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'g7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'h7', pieceData: { id: '', piece: 'p' } },
				{ op: 'add', coord: 'a2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'b2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'c2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'd2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'e2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'f2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'g2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'h2', pieceData: { id: '', piece: 'P' } },
				{ op: 'add', coord: 'a1', pieceData: { id: '', piece: 'R' } },
				{ op: 'add', coord: 'b1', pieceData: { id: '', piece: 'N' } },
				{ op: 'add', coord: 'c1', pieceData: { id: '', piece: 'B' } },
				{ op: 'add', coord: 'd1', pieceData: { id: '', piece: 'Q' } },
				{ op: 'add', coord: 'e1', pieceData: { id: '', piece: 'K' } },
				{ op: 'add', coord: 'f1', pieceData: { id: '', piece: 'B' } },
				{ op: 'add', coord: 'g1', pieceData: { id: '', piece: 'N' } },
				{ op: 'add', coord: 'h1', pieceData: { id: '', piece: 'R' } },
			],
		},
		{
			fromFen: FEN_START,
			toFen: FEN_EMPTY,
			expected: [
				{ op: 'remove', coord: 'a8', pieceData: { id: '', piece: 'r' } },
				{ op: 'remove', coord: 'b8', pieceData: { id: '', piece: 'n' } },
				{ op: 'remove', coord: 'c8', pieceData: { id: '', piece: 'b' } },
				{ op: 'remove', coord: 'd8', pieceData: { id: '', piece: 'q' } },
				{ op: 'remove', coord: 'e8', pieceData: { id: '', piece: 'k' } },
				{ op: 'remove', coord: 'f8', pieceData: { id: '', piece: 'b' } },
				{ op: 'remove', coord: 'g8', pieceData: { id: '', piece: 'n' } },
				{ op: 'remove', coord: 'h8', pieceData: { id: '', piece: 'r' } },
				{ op: 'remove', coord: 'a7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'b7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'c7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'd7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'e7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'f7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'g7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'h7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'a2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'b2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'c2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'd2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'e2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'f2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'g2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'h2', pieceData: { id: '', piece: 'P' } },
				{ op: 'remove', coord: 'a1', pieceData: { id: '', piece: 'R' } },
				{ op: 'remove', coord: 'b1', pieceData: { id: '', piece: 'N' } },
				{ op: 'remove', coord: 'c1', pieceData: { id: '', piece: 'B' } },
				{ op: 'remove', coord: 'd1', pieceData: { id: '', piece: 'Q' } },
				{ op: 'remove', coord: 'e1', pieceData: { id: '', piece: 'K' } },
				{ op: 'remove', coord: 'f1', pieceData: { id: '', piece: 'B' } },
				{ op: 'remove', coord: 'g1', pieceData: { id: '', piece: 'N' } },
				{ op: 'remove', coord: 'h1', pieceData: { id: '', piece: 'R' } },
			],
		},
		{
			fromFen: FEN_START,
			toFen: '8/8/8/8/3P1B2/1QP2NP1/PP1NPPBP/R3K2R w KQha - 0 1',
			expected: [
				{ op: 'move', src: 'c2', dest: 'c3', pieceData: { id: '', piece: 'P' } },
				{ op: 'move', src: 'd2', dest: 'd4', pieceData: { id: '', piece: 'P' } },
				{ op: 'move', src: 'g2', dest: 'g3', pieceData: { id: '', piece: 'P' } },
				{ op: 'move', src: 'b1', dest: 'd2', pieceData: { id: '', piece: 'N' } },
				{ op: 'move', src: 'c1', dest: 'f4', pieceData: { id: '', piece: 'B' } },
				{ op: 'move', src: 'd1', dest: 'b3', pieceData: { id: '', piece: 'Q' } },
				{ op: 'move', src: 'f1', dest: 'g2', pieceData: { id: '', piece: 'B' } },
				{ op: 'move', src: 'g1', dest: 'f3', pieceData: { id: '', piece: 'N' } },
				{ op: 'remove', coord: 'a8', pieceData: { id: '', piece: 'r' } },
				{ op: 'remove', coord: 'b8', pieceData: { id: '', piece: 'n' } },
				{ op: 'remove', coord: 'c8', pieceData: { id: '', piece: 'b' } },
				{ op: 'remove', coord: 'd8', pieceData: { id: '', piece: 'q' } },
				{ op: 'remove', coord: 'e8', pieceData: { id: '', piece: 'k' } },
				{ op: 'remove', coord: 'f8', pieceData: { id: '', piece: 'b' } },
				{ op: 'remove', coord: 'g8', pieceData: { id: '', piece: 'n' } },
				{ op: 'remove', coord: 'h8', pieceData: { id: '', piece: 'r' } },
				{ op: 'remove', coord: 'a7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'b7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'c7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'd7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'e7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'f7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'g7', pieceData: { id: '', piece: 'p' } },
				{ op: 'remove', coord: 'h7', pieceData: { id: '', piece: 'p' } },
			],
		},
	];

	const formatOutput = (changes: Change[]): Change[] =>
		changes.map(c => ({ ...c, pieceData: { ...c.pieceData, id: '' } }));

	for (const tc of testCases) {
		await t.test(`getPositionChanges for: ${tc.fromFen} - ${tc.toFen}`, () => {
			const before = fenToPosition(tc.fromFen);
			const after = fenToPosition(tc.toFen);
			const expected = getPositionChanges(before, after, 'w');
			assert.deepStrictEqual(formatOutput(expected), formatOutput(tc.expected));
		});
	}
});

test('fenToPosition', async t => {
	const testCases: { fen: string; orientation: Color; expected: Position }[] = [
		{ fen: FEN_EMPTY, orientation: 'w', expected: new Map() },
		{
			fen: FEN_START,
			orientation: 'w',
			expected: new Map([
				['a8', { id: '', piece: 'r' }],
				['b8', { id: '', piece: 'n' }],
				['c8', { id: '', piece: 'b' }],
				['d8', { id: '', piece: 'q' }],
				['e8', { id: '', piece: 'k' }],
				['f8', { id: '', piece: 'b' }],
				['g8', { id: '', piece: 'n' }],
				['h8', { id: '', piece: 'r' }],
				['a7', { id: '', piece: 'p' }],
				['b7', { id: '', piece: 'p' }],
				['c7', { id: '', piece: 'p' }],
				['d7', { id: '', piece: 'p' }],
				['e7', { id: '', piece: 'p' }],
				['f7', { id: '', piece: 'p' }],
				['g7', { id: '', piece: 'p' }],
				['h7', { id: '', piece: 'p' }],
				['a2', { id: '', piece: 'P' }],
				['b2', { id: '', piece: 'P' }],
				['c2', { id: '', piece: 'P' }],
				['d2', { id: '', piece: 'P' }],
				['e2', { id: '', piece: 'P' }],
				['f2', { id: '', piece: 'P' }],
				['g2', { id: '', piece: 'P' }],
				['h2', { id: '', piece: 'P' }],
				['a1', { id: '', piece: 'R' }],
				['b1', { id: '', piece: 'N' }],
				['c1', { id: '', piece: 'B' }],
				['d1', { id: '', piece: 'Q' }],
				['e1', { id: '', piece: 'K' }],
				['f1', { id: '', piece: 'B' }],
				['g1', { id: '', piece: 'N' }],
				['h1', { id: '', piece: 'R' }],
			]),
		},
	];

	const formatOutput = (pos: Position) =>
		pos
			.entries()
			.toArray()
			.map(([coord, pd]) => `${coord}-${pd.piece}`);

	for (const tc of testCases) {
		await t.test(`fenToPosition for fen: ${tc.fen}`, () => {
			const pos = fenToPosition(tc.fen);
			const expected = formatOutput(pos);
			assert.deepStrictEqual(expected, formatOutput(tc.expected));
		});
	}
});

// test('positionToFen', async t => {
// 	const testCases: { position: Position; expected: string }[] = [
// 		{ position: new Map(), expected: FEN_EMPTY },
// 		{
// 			position: new Map([
// 				['a8', { id: '', piece: 'r' }],
// 				['b8', { id: '', piece: 'n' }],
// 				['c8', { id: '', piece: 'b' }],
// 				['d8', { id: '', piece: 'q' }],
// 				['e8', { id: '', piece: 'k' }],
// 				['f8', { id: '', piece: 'b' }],
// 				['g8', { id: '', piece: 'n' }],
// 				['h8', { id: '', piece: 'r' }],
// 				['a7', { id: '', piece: 'p' }],
// 				['b7', { id: '', piece: 'p' }],
// 				['c7', { id: '', piece: 'p' }],
// 				['d7', { id: '', piece: 'p' }],
// 				['e7', { id: '', piece: 'p' }],
// 				['f7', { id: '', piece: 'p' }],
// 				['g7', { id: '', piece: 'p' }],
// 				['h7', { id: '', piece: 'p' }],
// 				['a2', { id: '', piece: 'P' }],
// 				['b2', { id: '', piece: 'P' }],
// 				['c2', { id: '', piece: 'P' }],
// 				['d2', { id: '', piece: 'P' }],
// 				['e2', { id: '', piece: 'P' }],
// 				['f2', { id: '', piece: 'P' }],
// 				['g2', { id: '', piece: 'P' }],
// 				['h2', { id: '', piece: 'P' }],
// 				['a1', { id: '', piece: 'R' }],
// 				['b1', { id: '', piece: 'N' }],
// 				['c1', { id: '', piece: 'B' }],
// 				['d1', { id: '', piece: 'Q' }],
// 				['e1', { id: '', piece: 'K' }],
// 				['f1', { id: '', piece: 'B' }],
// 				['g1', { id: '', piece: 'N' }],
// 				['h1', { id: '', piece: 'R' }],
// 			]),
// 			expected: FEN_START,
// 		},
// 	];

// 	for (const tc of testCases) {
// 		await t.test(`positionToFen`, () => {
// 			const expected = positionToFen(tc.position);
// 			assert.strictEqual(expected, tc.expected.trim().split(' ')[0]);
// 		});
// 	}
// });
