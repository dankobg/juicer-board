import { JuicerBoard } from './src/juicer-board';
import { Coord, COORDS, FEN_EMPTY, FEN_START, PIECE_SYMBOLS, PieceFenSymbol } from './src/model';

const b: JuicerBoard = document.querySelector('juicer-board')!;
const elm = (s: string): HTMLElement => document.querySelector(s)!;

const update = () => {
	elm('.out-board').innerText = b.print();
	elm('.out-initial-fen').innerText = 'Initial FEN: ' + b.fen;
	elm('.out-fen').innerText = 'FEN: ' + b.getFen();
	elm('.out-orientation').innerText = 'Orientation: ' + b.orientation;
	elm('.out-pieces-count').innerText = 'Pieces count: ' + b.piecesCount();
};

const fillCoordOpts = () => {
	const el = elm('#list-coords');
	COORDS.forEach(c => {
		el.innerHTML += `<option>${c}</option>`;
	});
};

const fillPieceOpts = () => {
	const el = elm('#list-pieces');
	PIECE_SYMBOLS.forEach(c => {
		el.innerHTML += `<option>${c}</option>`;
	});
};

update();
fillCoordOpts();
fillPieceOpts();

b.addEventListener('movestart', e => {
	// console.log('movestart', e);
});

b.addEventListener('movecancel', e => {
	// console.log('movecancel', e);
});

b.addEventListener('movefinish', e => {
	// console.log('movefinish', e);
	update();
});

elm('.cmd-flip-board').onclick = () => {
	b.flip();
	update();
};

elm('.cmd-clear-board').onclick = () => {
	b.clear();
	update();
};

elm('.cmd-set-position-empty').onclick = () => {
	b.loadFromFen(FEN_EMPTY);
	update();
};

elm('.cmd-set-position-start').onclick = () => {
	b.loadFromFen(FEN_START);
	update();
};

elm('.cmd-set-position-custom').onclick = () => {
	const fen = (elm('.input-fen') as HTMLInputElement).value;
	if (!fen) {
		alert('fen cant be empty');
		return;
	}
	b.loadFromFen(fen);
	update();
};

elm('.cmd-set-piece').onclick = () => {
	const coord = (elm('.input-set-piece-coord') as HTMLInputElement).value as Coord;
	const piece = (elm('.input-set-piece-piece') as HTMLInputElement).value as PieceFenSymbol;
	b.setPiece(coord, piece);
	update();
};

elm('.cmd-remove-piece').onclick = () => {
	const coord = (elm('.input-remove-piece') as HTMLInputElement).value as Coord;
	b.removePiece(coord);
	update();
};

elm('.cmd-get-piece').onclick = () => {
	const coord = (elm('.input-get-piece') as HTMLInputElement).value as Coord;
	const pd = b.getPiece(coord);
	if (!pd) {
		elm('.out-get-piece').innerText = `No piece at: ${coord}`;
		return;
	}
	elm('.out-get-piece').innerText = `${pd.id} ${pd.piece}`;
	update();
};

elm('.cmd-move-piece').onclick = () => {
	const src = (elm('.input-move-piece-src') as HTMLInputElement).value as Coord;
	const dest = (elm('.input-move-piece-dest') as HTMLInputElement).value as Coord;
	if (!COORDS.includes(src) || !COORDS.includes(dest)) {
		alert('invalid src or dest coord');
		return;
	}
	b.movePiece(src, dest);
	update();
};
