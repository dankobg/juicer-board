import {
	COLS,
	COORDS,
	Col,
	Coord,
	Piece,
	Change,
	PieceLocation,
	ROWS,
	Row,
	Square,
	NumPair,
	NONE_SQUARE,
	GroupedChanges,
	Color,
} from './model';

export function assertUnreachable(value: never): never {
	throw new Error(`Unexpected value: ${value}`);
}

export function translateElement(element: HTMLElement, deltaX: number, deltaY: number): void {
	element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
}

export function setZeroOpacityElement(element: HTMLElement): void {
	element.style.opacity = `0`;
}

export function getSquareIndexFromPointer(event: PointerEvent): number {
	const elm = event.target as HTMLElement;
	const boardElement = elm.offsetParent as HTMLElement;
	const squareWidth = boardElement.clientWidth / COLS;
	const squareHeight = boardElement.clientHeight / ROWS;

	const deltaX = event.clientX - boardElement.offsetLeft;
	const deltaY = event.clientY - boardElement.offsetTop;
	const col = Math.floor(deltaX / squareWidth);
	const row = Math.floor(deltaY / squareHeight);

	if (row < 0 || row > ROWS - 1 || col < 0 || col > COLS - 1) {
		return NONE_SQUARE;
	}

	return Square.rowColToIndex(row as Row, col as Col);
}

export function getDeltaXYFromSquareIndex(
	squareIndex: number,
	squareWidth: number,
	squareHeight: number,
	orientation: Color
): NumPair {
	const { row, col } = Square.getDataFromIndex(squareIndex, orientation);
	return [col * squareWidth, row * squareHeight];
}

export function getPositionChanges(prePieces: PieceLocation, curPieces: PieceLocation, orientation: Color): Change[] {
	const added: PieceLocation = new Map();
	const removed: PieceLocation = new Map();
	const changes: Change[] = [];

	for (const coord of COORDS) {
		const [prePiece, curPiece] = [prePieces.get(coord), curPieces.get(coord)];

		if (!Piece.same(prePiece, curPiece)) {
			if (curPiece) {
				added.set(coord, curPiece);
			}
			if (prePiece) {
				removed.set(coord, prePiece);
			}
		}
	}

	for (const [removedCoord, removedPiece] of removed.entries()) {
		const removedIndex = Square.coordToIndex(removedCoord, orientation);

		let minDistance: number = 8;
		let found: { piece: Piece; removedCoord: Coord; addedCoord: Coord } | null = null;

		for (const [addedCoord, addedPiece] of added.entries()) {
			const addedIndex = Square.coordToIndex(addedCoord, orientation);

			if (Piece.same(removedPiece, addedPiece)) {
				const distance = Square.getDistance(removedIndex, addedIndex, orientation);
				if (distance < minDistance) {
					minDistance = distance;
					found = { piece: addedPiece, addedCoord, removedCoord };
				}
			}
		}

		if (found) {
			added.delete(found.addedCoord);
			removed.delete(found.removedCoord);
			changes.push({ op: 'move', srcCoord: found.removedCoord, destCoord: found.addedCoord, piece: found.piece });
		}
	}

	for (const [coord, piece] of added.entries()) {
		changes.push({ op: 'add', coord, piece });
	}
	for (const [coord, piece] of removed.entries()) {
		changes.push({ op: 'remove', coord, piece });
	}

	return changes;
}

export function getGroupedChangesByOp(changes: Change[]): GroupedChanges {
	return changes.reduce<GroupedChanges>(
		(acc, change) => {
			if (change.op === 'add') {
				acc.added.push(change);
			} else if (change.op === 'remove') {
				acc.removed.push(change);
			} else if (change.op === 'move') {
				acc.moved.push(change);
			}
			return acc;
		},
		{ added: [], removed: [], moved: [] }
	);
}
