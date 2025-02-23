export type Color = 'w' | 'b';

export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Col = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Coord = `${File}${Rank}`;

export type PieceFenSymbol = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type PieceSymbol = Lowercase<PieceFenSymbol>;

export type RowCol = [Row, Col];
export type RankFile = [Rank, File];

export type NumPair = [number, number];

export type CoordsPlacement = 'outside' | 'inside' | undefined;
export type CoordsRanksPosition = 'left' | 'right' | 'both' | undefined;
export type CoordsFilesPosition = 'top' | 'bottom' | 'both' | undefined;

export type PieceData = { id: string; piece: PieceFenSymbol };
export type Position = Map<Coord, PieceData>;

export type Change =
	| { op: 'add'; coord: Coord; pieceData: PieceData }
	| { op: 'remove'; coord: Coord; pieceData: PieceData }
	| { op: 'move'; src: Coord; dest: Coord; pieceData: PieceData };

// --------------------------------------------------------------------------------

export const ROWS = 8;
export const COLS = 8;
export const TOTAL_SQUARES = 64;
export const SQUARE_NONE = -1;

export const FEN_EMPTY = '8/8/8/8/8/8/8/8';
export const FEN_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const WHITE = 'w';
export const BLACK = 'b';

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const WHITE_PIECE_SYMBOLS: readonly Uppercase<PieceFenSymbol>[] = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const BLACK_PIECE_SYMBOLS: readonly Lowercase<PieceFenSymbol>[] = ['k', 'q', 'r', 'b', 'n', 'p'];
export const PIECE_SYMBOLS: readonly PieceFenSymbol[] = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];

// prettier-ignore
export const COORDS: readonly Coord[] = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
];

export const COORDS_REVERSED: Coord[] = COORDS.toReversed();

export function fenToPosition(fen: string): Position {
	const position: Position = new Map();
	const [boardPosition] = fen.split(' ');
	let row = 0;
	let col = 0;
	for (const char of boardPosition!) {
		if (char === '/') {
			row++;
			col = 0;
		} else if (Number.isNaN(Number.parseInt(char))) {
			const coord = coordFromRowCol(row as Row, col as Col, 'w');
			position.set(coord, { id: crypto.randomUUID(), piece: char as PieceFenSymbol });
			col++;
		} else {
			const numEmptySquares = Number.parseInt(char);
			col += numEmptySquares;
		}
	}
	return position;
}

export function positionToFen(position: Position): string {
	let fen = '';
	let emptySquareCount = 0;
	for (let i = 0; i < COORDS.length; i++) {
		const coord = COORDS[i]!;
		const pd = position.get(coord);
		if (!pd) {
			emptySquareCount++;
		} else {
			if (emptySquareCount > 0) {
				fen += emptySquareCount.toString();
				emptySquareCount = 0;
			}
			fen += pd.piece;
		}
		if ((i + 1) % 8 === 0) {
			if (emptySquareCount > 0) {
				fen += emptySquareCount.toString();
				emptySquareCount = 0;
			}
			if (i < COORDS.length - 1) {
				fen += '/';
			}
		}
	}
	return fen;
}
export function indexFromCoord(coord: Coord | null, orientation: Color): number {
	if (coord === null) {
		return SQUARE_NONE;
	}
	const coordinates = orientation === 'w' ? COORDS : COORDS_REVERSED;
	return coordinates.indexOf(coord);
}

export function rankFileFromRowCol(row: Row, col: Col, orientation: Color): RankFile {
	const rank = orientation === 'w' ? RANKS[7 - row]! : RANKS[row]!;
	const file = orientation === 'w' ? FILES[col]! : FILES[7 - col]!;
	return [rank, file];
}

export function coordFromRowCol(row: Row, col: Col, orientation: Color): Coord {
	const [rank, file] = rankFileFromRowCol(row, col, orientation);
	return coordFromRankFile(rank, file);
}

export function rowColFromRankFile(rank: Rank, file: File, orientation: Color): RowCol {
	const row = orientation === 'w' ? ((7 - RANKS.indexOf(rank)) as Row) : (RANKS.indexOf(rank) as Row);
	const col = orientation === 'w' ? (FILES.indexOf(file) as Col) : ((7 - FILES.indexOf(file)) as Col);
	return [row, col];
}

export function coordFromRankFile(rank: Rank, file: File): Coord {
	return `${file}${rank}`;
}

export function rankFileFromCoord(coord: Coord): RankFile {
	return [coord[1] as Rank, coord[0] as File];
}

export function rowColFromCoord(coord: Coord, orientation: Color): RowCol {
	const [rank, file] = rankFileFromCoord(coord);
	return rowColFromRankFile(rank, file, orientation);
}

export function getDistanceDelta(src: Coord, dest: Coord, orientation: Color): NumPair {
	const [srcRow, srcCol] = rowColFromCoord(src, orientation);
	const [destRow, destCol] = rowColFromCoord(dest, orientation);
	return [destRow - srcRow, destCol - srcCol];
}

export function getDistance(src: Coord, dest: Coord, orientation: Color): number {
	const [deltaRows, deltaCols] = getDistanceDelta(src, dest, orientation);
	return Math.max(Math.abs(deltaRows), Math.abs(deltaCols));
}

export function getSquareColor(coord: Coord, orientation: Color): Color {
	const [row, col] = rowColFromCoord(coord, orientation);
	return (row + col) % 2 === 0 ? WHITE : BLACK;
}

export function getSquareCoordFromPointer(event: PointerEvent, orientation: Color): Coord | null {
	const elm = event.target as HTMLElement;
	const boardElement = elm.offsetParent as HTMLElement;
	const squareWidth = elm.clientWidth;
	const squareHeight = elm.clientHeight;
	const deltaX = event.clientX - boardElement.offsetLeft;
	const deltaY = event.clientY - boardElement.offsetTop;
	const col = Math.floor(deltaX / squareWidth);
	const row = Math.floor(deltaY / squareHeight);
	if (row < 0 || row > ROWS - 1 || col < 0 || col > COLS - 1) {
		return null;
	}
	return coordFromRowCol(row as Row, col as Col, orientation);
}

export function translateElement(element: HTMLElement, deltaX: number, deltaY: number): void {
	element.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`);
}

export function hideElement(element: HTMLElement): void {
	element.style.setProperty('display', 'none');
}

export function assertUnreachable(value: never): never {
	throw new Error(`Unexpected value: ${value}`);
}

export function getDeltaXYFromCoord(
	coord: Coord,
	squareWidth: number,
	squareHeight: number,
	orientation: Color
): NumPair {
	const [row, col] = rowColFromCoord(coord, orientation);
	return [col * squareWidth, row * squareHeight];
}

export function getPositionChanges(beforePosition: Position, afterPosition: Position, orientation: Color): Change[] {
	const added: Position = new Map();
	const removed: Position = new Map();
	const changes: Change[] = [];
	for (const coord of COORDS) {
		const [beforePieceData, afterPieceData] = [beforePosition.get(coord), afterPosition.get(coord)];
		if (beforePieceData?.piece !== afterPieceData?.piece) {
			if (afterPieceData) {
				added.set(coord, afterPieceData);
			}
			if (beforePieceData) {
				removed.set(coord, beforePieceData);
			}
		}
	}
	for (const [removedCoord, removedPieceData] of removed.entries()) {
		let minDistance: number = 8;
		let found: { pieceData: PieceData; removedCoord: Coord; addedCoord: Coord } | null = null;
		for (const [addedCoord, addedPieceData] of added.entries()) {
			if (removedPieceData.piece === addedPieceData.piece) {
				const distance = getDistance(removedCoord, addedCoord, orientation);
				if (distance < minDistance) {
					minDistance = distance;
					found = { pieceData: addedPieceData, addedCoord, removedCoord };
				}
			}
		}
		if (found) {
			added.delete(found.addedCoord);
			removed.delete(found.removedCoord);
			changes.push({
				op: 'move',
				src: found.removedCoord,
				dest: found.addedCoord,
				pieceData: {
					id: beforePosition.get(found.removedCoord)!.id,
					piece: found.pieceData.piece,
				},
			});
		}
	}
	for (const [coord, pieceData] of added.entries()) {
		changes.push({ op: 'add', coord, pieceData });
	}
	for (const [coord, pieceData] of removed.entries()) {
		changes.push({ op: 'remove', coord, pieceData });
	}
	return changes;
}

export function genId(): string {
	return crypto.randomUUID();
}
