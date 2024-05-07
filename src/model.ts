import { generateId } from './util';

export type Color = 'w' | 'b';

export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Col = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Coord = `${File}${Rank}`;

export type PieceKind = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type PieceFenSymbol = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type PieceSymbol = Lowercase<PieceFenSymbol>;

export type RowCol = [Row, Col];
export type RankFile = [Rank, File];

export type NumPair = [number, number];

export type SquareData = {
	index: number;
	coord: Coord;
	row: Row;
	col: Col;
	file: File;
	rank: Rank;
};

export type PieceLocation = Map<Coord, Piece>;

export type Change =
	| { op: 'add'; coord: Coord; piece: Piece }
	| { op: 'remove'; coord: Coord; piece: Piece }
	| { op: 'move'; srcCoord: Coord; destCoord: Coord; piece: Piece };

export type GroupedChanges = {
	added: Extract<Change, { op: 'add' }>[];
	removed: Extract<Change, { op: 'remove' }>[];
	moved: Extract<Change, { op: 'move' }>[];
};

// --------------------------------------------------------------------------------

export const ROWS = 8;
export const COLS = 8;
export const TOTAL_SQUARES = 64;

export const FEN_EMPTY = '8/8/8/8/8/8/8/8';
export const FEN_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const WHITE = 'w';
export const BLACK = 'b';

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const PIECE_KINDS: readonly PieceKind[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
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

export const NONE_SQUARE = -1;

export const kindToSymbol: Map<PieceKind, PieceSymbol> = new Map([
	['king', 'k'],
	['queen', 'q'],
	['rook', 'r'],
	['bishop', 'b'],
	['knight', 'n'],
	['pawn', 'p'],
]);

export const symbolToKind: Map<PieceSymbol, PieceKind> = new Map([
	['k', 'king'],
	['q', 'queen'],
	['r', 'rook'],
	['b', 'bishop'],
	['n', 'knight'],
	['p', 'pawn'],
]);

// --------------------------------------------------------------------------------

export class Board {
	squares!: Square[];
	pieceLocation!: PieceLocation;

	constructor(
		public fen: string = FEN_EMPTY,
		public orientation: Color = WHITE
	) {
		this.initSquares();
		this.loadFromFen(fen);
	}

	static indexInBounds(squareIndex: number): boolean {
		return squareIndex >= 0 && squareIndex < TOTAL_SQUARES;
	}

	private getSquares(): Square[] {
		const coordinates = this.orientationIsWhite() ? COORDS : COORDS_REVERSED;
		return coordinates.map(coord => new Square(coord, this.orientation));
	}

	private fenToPieces(fen: string): PieceLocation {
		const pieceLocation: PieceLocation = new Map();
		const [boardPosition] = fen.split(' ');

		let row = 0;
		let col = 0;

		for (const char of boardPosition) {
			if (char === '/') {
				row++;
				col = 0;
			} else if (Number.isNaN(Number.parseInt(char))) {
				const coord = Square.rowColToCoord(row as Row, col as Col, this.orientation);
				const kind = symbolToKind.get(char.toLowerCase() as PieceSymbol)!;
				const color = char === char.toUpperCase() ? WHITE : BLACK;
				const piece = new Piece(kind, color);
				pieceLocation.set(coord, piece);
				col++;
			} else {
				const numEmptySquares = Number.parseInt(char);
				col += numEmptySquares;
			}
		}

		return pieceLocation;
	}

	private piecesToFen(): string {
		let fen = '';
		let emptySquareCount = 0;

		for (let i = 0; i < this.squares.length; i++) {
			const sq = this.squares[i];
			const piece = this.pieceLocation.get(sq.coord);

			if (!piece) {
				emptySquareCount++;
			} else {
				if (emptySquareCount > 0) {
					fen += emptySquareCount.toString();
					emptySquareCount = 0;
				}

				fen += piece.fenSymbol;
			}
			if ((i + 1) % 8 === 0 && i < 63) {
				if (emptySquareCount > 0) {
					fen += emptySquareCount.toString();
					emptySquareCount = 0;
				}

				fen += '/';
			}
		}

		return fen;
	}

	initSquares(): void {
		this.squares = this.getSquares();
	}

	loadFromFen(fen = FEN_START): void {
		this.pieceLocation = this.fenToPieces(fen);
	}

	getFen(): string {
		return this.piecesToFen();
	}

	setOrientation(orientation: Color): void {
		this.orientation = orientation;
	}

	flipOrientation(): void {
		this.orientation = this.orientationIsWhite() ? BLACK : WHITE;
		this.initSquares();
	}

	orientationIsWhite(): boolean {
		return this.orientation === WHITE;
	}

	orientationIsBlack(): boolean {
		return this.orientation === BLACK;
	}

	print(): string {
		const border = '+------------------------+';
		let s = `   ${border}\n`;

		for (let i = 0; i < this.squares.length; i++) {
			let rank: number = 8 - Math.floor(i / 8);

			if (this.orientationIsBlack()) {
				rank = Math.floor(i / ROWS) + 1;
			}

			if (i % ROWS === 0) {
				s += ` ${rank} |`;
			}

			const piece = this.pieceLocation.get(this.squares[i].coord);
			s += ` ${piece?.fenSymbol ?? '-'} `;

			if (i % COLS === 7) {
				s += '| \n';
			}
		}

		s += `   ${border}\n`;
		const letters = this.orientationIsWhite() ? FILES : FILES.toReversed();
		s += '     ' + letters.join('  ');

		return s;
	}

	setPiece(coord: Coord, piece: Piece, onlyOnEmpty: boolean = false): void {
		if (!onlyOnEmpty) {
			this.pieceLocation.set(coord, piece);
			return;
		}
		if (!this.pieceLocation.get(coord)) {
			this.pieceLocation.set(coord, piece);
		}
	}

	setPieces(pieces: PieceLocation): void {
		this.pieceLocation = pieces;
	}

	getPiece(coord: Coord): Piece | null {
		return this.pieceLocation.get(coord) ?? null;
	}

	removePiece(coord: Coord): void {
		this.pieceLocation.delete(coord);
	}

	movePiece(srcCoord: Coord, destCoord: Coord): void {
		const srcPiece = this.pieceLocation.get(srcCoord);
		if (!srcPiece) {
			return;
		}
		this.pieceLocation.set(destCoord, srcPiece);
		this.pieceLocation.delete(srcCoord);
	}

	getPiecesCount(): number {
		return this.pieceLocation.size;
	}

	clear(): void {
		this.fen = FEN_EMPTY;
		this.orientation = WHITE;
		this.pieceLocation.clear();
	}

	clone(): Board {
		const clone = new Board();
		clone.fen = this.fen;
		clone.orientation = this.orientation;
		clone.squares = this.squares.map(sq => sq.clone());
		clone.pieceLocation = new Map(this.pieceLocation);
		return clone;
	}
}

export class Square {
	index: number;
	row: Row;
	col: Col;
	file: File;
	rank: Rank;
	color: Color;

	constructor(
		public coord: Coord,
		public orientation: Color
	) {
		const { index, row, col, file, rank } = Square.getDataFromCoord(coord, orientation);
		this.index = index;
		this.row = row;
		this.col = col;
		this.file = file;
		this.rank = rank;
		this.color = Square.getSquareColor(row, col);
	}

	static coordToIndex(coord: Coord, orientation: Color): number {
		const coordinates = orientation === 'w' ? COORDS : COORDS_REVERSED;
		return coordinates.indexOf(coord);
	}

	static indexToCoord(index: number, orientation: Color): Coord | null {
		const coordinates = orientation === 'w' ? COORDS : COORDS_REVERSED;
		return coordinates[index] ?? null;
	}

	static rowColToRankFile(row: Row, col: Col, orientation: Color): RankFile {
		const rank = orientation === 'w' ? RANKS[7 - row] : RANKS[row];
		const file = orientation === 'w' ? FILES[col] : FILES[7 - col];
		return [rank, file];
	}

	static rowColToIndex(row: Row, col: Col): number {
		return row * ROWS + col;
	}

	static rowColToCoord(row: Row, col: Col, orientation: Color): Coord {
		const [rank, file] = Square.rowColToRankFile(row, col, orientation);
		return Square.rankFileToCoord(rank, file);
	}

	static rankFileToRowCol(rank: Rank, file: File, orientation: Color): RowCol {
		const row = orientation === 'w' ? ((7 - RANKS.indexOf(rank)) as Row) : (RANKS.indexOf(rank) as Row);
		const col = orientation === 'w' ? (FILES.indexOf(file) as Col) : ((7 - FILES.indexOf(file)) as Col);
		return [row, col];
	}

	static rankFileToIndex(rank: Rank, file: File, orientation: Color): number {
		const [row, col] = Square.rankFileToRowCol(rank, file, orientation);
		return Square.rowColToIndex(row, col);
	}

	static rankFileToCoord(rank: Rank, file: File): Coord {
		return `${file}${rank}`;
	}

	static getDataFromCoord(coord: Coord, orientation: Color): SquareData {
		const [rank, file] = [coord[1] as Rank, coord[0] as File];
		const [row, col] = Square.rankFileToRowCol(rank, file, orientation);
		const index = Square.rowColToIndex(row, col);
		return { index, coord, file, rank, row, col };
	}

	static getDataFromIndex(index: number, orientation: Color): SquareData {
		const [row, col] = [Math.floor(index / 8) as Row, (index % 8) as Col];
		const [rank, file] = Square.rowColToRankFile(row, col, orientation);
		const coord = `${file}${rank}` as const;
		return { index, coord, file, rank, row, col };
	}

	static getDistanceDelta(srcSquareIndex: number, destSquareIndex: number, orientation: Color): NumPair {
		const src = Square.getDataFromIndex(srcSquareIndex, orientation);
		const dest = Square.getDataFromIndex(destSquareIndex, orientation);
		return [dest.row - src.row, dest.col - src.col];
	}

	static getDistance(srcSquareIndex: number, destSquareIndex: number, orientation: Color): number {
		const [deltaRows, deltaCols] = Square.getDistanceDelta(srcSquareIndex, destSquareIndex, orientation);
		return Math.max(Math.abs(deltaRows), Math.abs(deltaCols));
	}

	static getSquareColor(row: Row, col: Col): Color {
		return (row + col) % 2 === 0 ? WHITE : BLACK;
	}

	isLight(): boolean {
		return this.color === WHITE;
	}

	isDark(): boolean {
		return this.color === BLACK;
	}

	equals(square: Square): boolean {
		return this.coord === square.coord;
	}

	toString(): string {
		return this.coord;
	}

	clone(): Square {
		return new Square(this.coord, this.orientation);
	}
}

export class Piece {
	id: string;
	fenSymbol: PieceFenSymbol;

	constructor(
		public kind: PieceKind,
		public color: Color
	) {
		this.id = this.generateId();
		const symbol = kindToSymbol.get(this.kind)!;
		this.fenSymbol = this.color === WHITE ? (symbol.toUpperCase() as PieceFenSymbol) : symbol;
	}

	static newFromFenSymbol(pieceFenSymbol: PieceFenSymbol): Piece {
		const kind = symbolToKind.get(pieceFenSymbol.toLowerCase() as PieceSymbol)!;
		const color = pieceFenSymbol === pieceFenSymbol.toUpperCase() ? WHITE : BLACK;
		return new Piece(kind, color);
	}

	static same(p1?: Piece, p2?: Piece): boolean {
		return p1?.color === p2?.color && p1?.kind === p2?.kind;
	}

	private generateId(length = 32): string {
		return generateId(length);
	}

	isWhite(): boolean {
		return this.color === WHITE;
	}

	isBlack(): boolean {
		return this.color === BLACK;
	}

	equals(piece: Piece): boolean {
		return this.id === piece.id;
	}

	toString(): string {
		return this.fenSymbol;
	}

	clone(): Piece {
		const clone = new Piece(this.kind, this.color);
		clone.id = this.id;
		return clone;
	}
}
