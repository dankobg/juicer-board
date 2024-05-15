import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { LitElement, PropertyValueMap, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import '../file-coords/file-coords';
import '../juicer-piece/juicer-piece';
import {
	JuicerPiece,
	PiecePointerCancelEvent,
	PiecePointerDownEvent,
	PiecePointerMoveEvent,
	PiecePointerUpEvent,
} from '../juicer-piece/juicer-piece';
import '../juicer-square/juicer-square';
import {
	Board,
	COLS,
	Color,
	Coord,
	FEN_EMPTY,
	FEN_START,
	NONE_SQUARE,
	Piece,
	Change,
	PieceFenSymbol,
	ROWS,
	Square,
	WHITE,
	PieceSymbol,
	NumPair,
	BLACK,
	PIECE_SYMBOLS,
} from '../model';
import '../rank-coords/rank-coords';
import juicerBoardCss from './juicer-board.css?inline';
import { map } from 'lit/directives/map.js';
import {
	assertUnreachable,
	getPositionChanges,
	getDeltaXYFromSquareIndex,
	translateElement,
	getGroupedChangesByOp as getGroupedChanges,
	setZeroOpacityElement,
	generateId,
} from '../util';
import { repeat } from 'lit/directives/repeat.js';

export class MoveStartEvent extends Event {
	static eventType = 'movestart';

	data: {
		srcCoord: Coord;
		pieceElement: HTMLElement;
		piece: Piece;
	};

	constructor(data: MoveStartEvent['data']) {
		super(MoveStartEvent.eventType, { bubbles: true, composed: true, cancelable: true });
		this.data = data;
	}
}

export class MoveFinishEvent extends Event {
	static eventType = 'movefinish';

	data: {
		srcCoord: Coord;
		destCoord: Coord;
		pieceElement: HTMLElement;
		piece: Piece;
	};

	constructor(data: MoveFinishEvent['data']) {
		super(MoveFinishEvent.eventType, { bubbles: true, composed: true, cancelable: true });
		this.data = data;
	}
}

export class MoveCancelEvent extends Event {
	static eventType = 'movecancel';

	data: {
		srcCoord: Coord;
		destCoord: Coord | null;
		pieceElement: HTMLElement;
		piece: Piece;
	};

	constructor(data: MoveCancelEvent['data']) {
		super(MoveCancelEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

@customElement('juicer-board')
export class JuicerBoard extends LitElement {
	static override styles = unsafeCSS(juicerBoardCss);

	private animationDuration: number = 300;

	protected resizeObserver = new ResizeController(this, { config: { box: 'border-box' } });

	@state() board: Board | null = null;

	@state() tmpBoard: Board | null = null;

	@state() pendingAnimations: { animation: Animation; translateTo: NumPair; elm: HTMLElement }[] = [];

	@state() queuedAnimations: number = 0;

	@state() finishedAnimations: number = 0;

	@state() dragging: boolean = false;

	@state() draggedElm: HTMLElement | null = null;

	@state() pieceOffsetWidth: number = 0;

	@state() pieceOffsetHeight: number = 0;

	@state() srcSquareIndex: number = NONE_SQUARE;

	@state() destSquareIndex: number = NONE_SQUARE;

	@state() dragOverSquareIndex: number = NONE_SQUARE;

	@state() selectedSquareIndex: number = NONE_SQUARE;

	@state() highlightedSquareIndexes: number[] = [];

	@state() lastPos: { x: number; y: number } = { x: 0, y: 0 };

	@state() ghost: { piece: Piece; coord: Coord } | null = null;

	@property() fen: string = FEN_EMPTY;

	@property() orientation: Color = WHITE;

	@property({ type: Boolean }) interactive: boolean = false;

	@property({ type: Boolean, attribute: 'show-ghost' }) showGhost: boolean = false;

	@property({ attribute: 'board-theme' }) boardTheme?: string;

	@property({ attribute: 'piece-theme' }) pieceTheme?: (pieceFenSymbol: string) => string;

	@property() coords?: 'outside' | 'inside';

	@property({ attribute: 'ranks-position' }) ranksPosition: 'start' | 'end' | 'both' = 'start';

	@property({ attribute: 'files-position' }) filesPosition: 'start' | 'end' | 'both' = 'start';

	@property({ type: Number, attribute: 'animation-in-duration' }) animationInDuration: number = this.animationDuration;

	@property({ type: Number, attribute: 'animation-out-duration' }) animationOutDuration: number =
		this.animationDuration;

	@property({ type: Number, attribute: 'animation-move-duration' }) animationMoveDuration: number =
		this.animationDuration;

	@property({ type: Number, attribute: 'animation-snapback-duration' }) animationSnapbackDuration: number = 0;

	@property({ type: Number, attribute: 'animation-snap-duration' }) animationSnapDuration: number = 0;

	private onPiecePointerDown(event: PiecePointerDownEvent): void {
		event.stopPropagation();
		const { squareIndex, pieceElement, pieceRect, clientX, clientY } = event.data;

		if (this.pendingAnimations.length > 0) {
			return;
		}

		const srcCoord: Coord = Square.indexToCoord(squareIndex, this.orientation)!;
		const piece = this.getPiece(srcCoord)!;
		const moveStartEvent = new MoveStartEvent({ srcCoord, pieceElement, piece });
		this.dispatchEvent(moveStartEvent);
		if (moveStartEvent.defaultPrevented) {
			return;
		}

		if (this.showGhost) {
			const ghostCoord = Square.indexToCoord(squareIndex, this.orientation)!;
			const ghostPiece = Piece.newFromFenSymbol(pieceElement.dataset.symbol as PieceSymbol);
			this.ghost = { piece: ghostPiece, coord: ghostCoord };
		}

		this.dragging = true;
		this.draggedElm = pieceElement;
		this.pieceOffsetWidth = pieceRect.width / 2;
		this.pieceOffsetHeight = pieceRect.height / 2;

		this.srcSquareIndex = squareIndex;

		const [x, y] = getDeltaXYFromSquareIndex(
			this.srcSquareIndex,
			this.clientWidth / 8,
			this.clientHeight / 8,
			this.orientation
		);
		this.lastPos = { x, y };

		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight;
		translateElement(this.draggedElm, deltaX, deltaY);
	}

	private onPiecePointerUp(event: PiecePointerUpEvent): void {
		event.stopPropagation();
		if (!this.dragging) {
			return;
		}
		const { squareIndex, pieceElement, clientX, clientY } = event.data;

		this.dragging = false;
		this.draggedElm = null;
		this.ghost = null;

		if (squareIndex === NONE_SQUARE || squareIndex === this.srcSquareIndex) {
			const srcCoord = Square.indexToCoord(this.srcSquareIndex, this.orientation)!;
			const destCoord = Square.indexToCoord(squareIndex, this.orientation);
			const piece = this.getPiece(srcCoord)!;

			this.performSnapback(pieceElement, srcCoord, destCoord, pieceElement, piece);
		} else {
			this.performSnapToSquare(pieceElement, squareIndex, clientX, clientY, this);
		}
	}

	private onPiecePointerMove(event: PiecePointerMoveEvent): void {
		event.stopPropagation();
		if (!this.dragging) {
			return;
		}
		const { squareIndex, pieceElement, clientX, clientY } = event.data;

		this.dragOverSquareIndex = squareIndex;

		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight;
		translateElement(pieceElement, deltaX, deltaY);
	}

	private onPiecePointerCancel(event: PiecePointerCancelEvent): void {
		event.stopPropagation();
		this.dragging = false;
		this.draggedElm = null;
		this.ghost = null;
	}

	private onBoardContextMenu(event: Event): void {
		event.preventDefault();
	}

	private performSnapback(
		elm: HTMLElement,
		srcCoord: Coord,
		destCoord: Coord | null,
		pieceElement: HTMLElement,
		piece: Piece
	): void {
		if (this.pendingAnimations.length > 0) {
			return;
		}

		const opts: KeyframeAnimationOptions = { duration: this.animationSnapbackDuration, easing: 'ease-in-out' };
		const keyframes: Keyframe[] = [{ transform: `translate(${this.lastPos.x}px, ${this.lastPos.y}px)` }];
		const animation = new Animation(new KeyframeEffect(elm, keyframes, opts));

		this.playAnimation(animation, {
			onFinish: () => {
				translateElement(elm, this.lastPos.x, this.lastPos.y);
				this.srcSquareIndex = NONE_SQUARE;
				this.lastPos = { x: 0, y: 0 };
				const moveCancelEvent = new MoveCancelEvent({ srcCoord, destCoord, pieceElement, piece });
				this.dispatchEvent(moveCancelEvent);
			},
		});
	}

	private performSnapToSquare(
		elm: HTMLElement,
		squareIndex: number,
		clientX: number,
		clientY: number,
		boardElement: HTMLElement
	) {
		if (this.pendingAnimations.length > 0) {
			return;
		}

		const srcCoord = Square.indexToCoord(this.srcSquareIndex, this.orientation)!;
		const destCoord = Square.indexToCoord(squareIndex, this.orientation)!;

		const piece = this.getPiece(srcCoord)!;
		const moveFinishEvent = new MoveFinishEvent({ srcCoord, destCoord, pieceElement: elm, piece });
		this.dispatchEvent(moveFinishEvent);
		if (moveFinishEvent.defaultPrevented) {
			translateElement(elm, this.lastPos.x, this.lastPos.y);
			this.srcSquareIndex = NONE_SQUARE;
			this.dragOverSquareIndex = NONE_SQUARE;
			this.lastPos = { x: 0, y: 0 };
			return;
		}

		this.tmpBoard!.movePiece(srcCoord, destCoord);
		this.tmpBoard = this.tmpBoard!.clone();

		const [x, y] = getDeltaXYFromSquareIndex(
			squareIndex,
			this.clientWidth / 8,
			this.clientHeight / 8,
			this.orientation
		);

		const squareTopLeftX = x + boardElement.offsetLeft;
		const squareTopLeftY = y + boardElement.offsetTop;
		const snapDx = clientX - squareTopLeftX - this.pieceOffsetWidth;
		const snapDy = clientY - squareTopLeftY - this.pieceOffsetHeight;
		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth - snapDx;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight - snapDy;

		const opts: KeyframeAnimationOptions = { duration: this.animationSnapDuration, easing: 'ease-in-out' };
		const keyframes: Keyframe[] = [{ transform: `translate(${deltaX}px, ${deltaY}px)` }];
		const animation = new Animation(new KeyframeEffect(elm, keyframes, opts));

		this.playAnimation(animation, {
			onFinish: () => {
				translateElement(elm, deltaX, deltaY);
				this.board = this.tmpBoard!.clone();
			},
		});
	}

	private createAnimation(elm: HTMLElement, change: Change): [Animation, NumPair, HTMLElement] {
		switch (change.op) {
			case 'add': {
				const { row, col } = Square.getDataFromCoord(change.coord, this.orientation);
				const deltaX = col * (this.clientWidth / COLS);
				const deltaY = row * (this.clientHeight / ROWS);
				const keyframes: Keyframe[] = [
					{ opacity: 0, transform: `translate(${deltaX}px, ${deltaY}px)` },
					{ opacity: 1, transform: `translate(${deltaX}px, ${deltaY}px)` },
				];
				const options: KeyframeAnimationOptions = {
					duration: this.animationInDuration,
					easing: 'ease-in',
				};
				return [new Animation(new KeyframeEffect(elm, keyframes, options)), [deltaX, deltaY], elm];
			}
			case 'remove': {
				const keyframes: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
				const options: KeyframeAnimationOptions = {
					duration: this.animationOutDuration,
					easing: 'ease-out',
				};
				return [new Animation(new KeyframeEffect(elm, keyframes, options)), [0, 0], elm];
			}
			case 'move': {
				const src = Square.getDataFromCoord(change.srcCoord, this.orientation);
				const dest = Square.getDataFromCoord(change.destCoord, this.orientation);
				const srcDeltaX = src.col * (this.clientWidth / COLS);
				const srcDeltaY = src.row * (this.clientHeight / ROWS);
				const destDeltaX = dest.col * (this.clientWidth / COLS);
				const destDeltaY = dest.row * (this.clientHeight / ROWS);
				const keyframes: Keyframe[] = [
					{ transform: `translate(${srcDeltaX}px, ${srcDeltaY}px)` },
					{ transform: `translate(${destDeltaX}px, ${destDeltaY}px)` },
				];
				const options: KeyframeAnimationOptions = {
					duration: this.animationMoveDuration,
					easing: 'ease-in-out',
				};
				return [new Animation(new KeyframeEffect(elm, keyframes, options)), [destDeltaX, destDeltaY], elm];
			}
			default:
				assertUnreachable(change);
		}
	}

	private playAnimation(
		animation: Animation,
		opts?: { onFinish?: () => void; onCancel?: () => void; onRemove?: () => void }
	): void {
		animation.play();

		if (opts?.onFinish) {
			animation.addEventListener('finish', opts.onFinish, { once: true });
		}
		if (opts?.onCancel) {
			animation.addEventListener('cancel', opts.onCancel, { once: true });
		}
		if (opts?.onRemove) {
			animation.addEventListener('remove', opts.onRemove, { once: true });
		}
	}

	private enqueuePendingAnimation(
		animation: Animation,
		translateTo: NumPair,
		elm: HTMLElement,
		parallelAnimations: boolean = false
	): void {
		if (!parallelAnimations) {
			this.pendingAnimations.forEach(({ animation }) => {
				animation.finish();
			});
		}
		this.pendingAnimations = [...this.pendingAnimations, { animation, translateTo, elm }];
		this.queuedAnimations++;
	}

	private dequeuePendingAnimation(): void {
		this.pendingAnimations = this.pendingAnimations.toSpliced(0, 1);
	}

	private enqueueAnimations(changes: Change[], parallelAnimations: boolean = false): void {
		if (changes.length === 0) {
			return;
		}

		for (const change of getGroupedChanges(changes).added) {
			this.board!.setPiece(change.coord, change.piece);
		}
		this.board = this.board!.clone();
		this.updateComplete.then(() => {
			for (const change of changes) {
				const jp = this.shadowRoot!.querySelector(`juicer-piece[id='${change.piece.id}']`) as JuicerPiece;
				const [animation, translateTo, elm] = this.createAnimation(jp.pieceElement, change);
				animation.id = `${change.op}_${generateId(16)}`;
				this.enqueuePendingAnimation(animation, translateTo, elm, parallelAnimations);
				this.playAnimation(animation, {
					onFinish: () => {
						if (animation.id.startsWith('remove')) {
							setZeroOpacityElement(elm);
						} else {
							translateElement(elm, translateTo[0], translateTo[1]);
						}
						this.dequeuePendingAnimation();
						this.finishedAnimations++;
					},
				});
			}
		});
	}

	protected updated(changedProperties: PropertyValueMap<JuicerBoard> | Map<PropertyKey, unknown>): void {
		if (changedProperties.has('boardTheme')) {
			this.initBoardTheme();
		}
		if (changedProperties.has('pieceTheme')) {
			this.initPieceTheme();
		}

		if (changedProperties.has('fen')) {
			const fen = ['new', 'start'].includes(this.fen) ? FEN_START : this.fen;
			if (this.board) {
				this.load(fen);
			} else {
				this.board = new Board(fen, this.orientation);
			}
			this.tmpBoard = this.board.clone();
		}

		if (changedProperties.has('finishedAnimations')) {
			if (this.finishedAnimations === 0) {
				return;
			}

			if (this.finishedAnimations === this.queuedAnimations) {
				this.board = this.tmpBoard!.clone();
				this.queuedAnimations = 0;
				this.finishedAnimations = 0;
			}
		}
	}

	setPiece(
		src: Coord,
		pieceFenSymbol: PieceFenSymbol,
		parallelAnimations: boolean = false,
		onlyOnEmpty: boolean = false
	): void {
		const prePieces = new Map(this.tmpBoard!.pieceLocation);
		this.tmpBoard!.setPiece(src, Piece.newFromFenSymbol(pieceFenSymbol), onlyOnEmpty);
		this.tmpBoard = this.tmpBoard!.clone();
		const curPieces = new Map(this.tmpBoard!.pieceLocation);
		const changes = getPositionChanges(prePieces, curPieces, this.orientation);
		this.enqueueAnimations(changes, parallelAnimations);
	}

	removePiece(src: Coord, parallelAnimations: boolean = false): void {
		const prePieces = new Map(this.tmpBoard!.pieceLocation);
		this.tmpBoard!.removePiece(src);
		this.tmpBoard = this.tmpBoard!.clone();
		const curPieces = new Map(this.tmpBoard!.pieceLocation);
		const changes = getPositionChanges(prePieces, curPieces, this.orientation);
		this.enqueueAnimations(changes, parallelAnimations);
	}

	movePiece(src: Coord, dest: Coord, parallelAnimations: boolean = false): void {
		const prePieces = new Map(this.tmpBoard!.pieceLocation);
		this.tmpBoard!.movePiece(src, dest);
		this.tmpBoard = this.tmpBoard!.clone();
		const curPieces = new Map(this.tmpBoard!.pieceLocation);
		const changes = getPositionChanges(prePieces, curPieces, this.orientation);
		this.enqueueAnimations(changes, parallelAnimations);
	}

	clear(parallelAnimations: boolean = true): void {
		const prePieces = new Map(this.tmpBoard!.pieceLocation);
		this.tmpBoard!.clear();
		this.tmpBoard = this.tmpBoard!.clone();
		const curPieces = new Map(this.tmpBoard!.pieceLocation);
		const changes = getPositionChanges(prePieces, curPieces, this.orientation);
		this.enqueueAnimations(changes, parallelAnimations);
	}

	load(fen = FEN_START, parallelAnimations: boolean = true): void {
		const prePieces = new Map(this.tmpBoard!.pieceLocation);
		this.tmpBoard!.loadFromFen(fen);
		this.tmpBoard = this.tmpBoard!.clone();
		const curPieces = new Map(this.tmpBoard!.pieceLocation);
		const changes = getPositionChanges(prePieces, curPieces, this.orientation).map(change => {
			if (change.op !== 'move') {
				return change;
			}
			if (Piece.same(change.piece, prePieces.get(change.srcCoord))) {
				change.piece.id = prePieces.get(change.srcCoord)!.id;
			}
			return change;
		});

		this.enqueueAnimations(changes, parallelAnimations);
	}

	getPiece(coord: Coord): Piece | null {
		return this.board?.getPiece(coord) ?? null;
	}

	getPiecesCount(): number {
		return this.board?.getPiecesCount() ?? 0;
	}

	flip(): void {
		if (this.pendingAnimations.length > 0) {
			return;
		}
		this.board!.flipOrientation();
		this.board = this.board!.clone();
		this.orientation = this.orientation === WHITE ? BLACK : WHITE;
	}

	print(): string {
		return this.board?.print() ?? '';
	}

	private initBoardTheme(): void {
		if (this.boardTheme) {
			this.style.setProperty('--board-theme', `url('${this.boardTheme}')`);
		}
	}

	private initPieceTheme() {
		if (!this.pieceTheme) {
			return;
		}

		PIECE_SYMBOLS.forEach(symbol => {
			const name = '--' + (symbol.toUpperCase() === symbol ? 'w' : 'b') + symbol.toLowerCase() + '-theme';
			const theme = `url('${this.pieceTheme!(symbol)}')`;
			this.style.setProperty(name, theme);
		});
	}

	protected override render() {
		return html`
			<div
				class="board"
				part="board"
				style="${styleMap({
					'--rows': ROWS,
					'--cols': COLS,
					'--board-width': this.clientWidth + 'px',
					'--board-height': this.clientHeight + 'px',
				})}"
				@contextmenu="${this.onBoardContextMenu}"
			>
				${this.coords
					? html`
							<div class="coords">
								<rank-coords
									orientation="${this.orientation}"
									coords="${this.coords}"
									position="${this.ranksPosition}"
								></rank-coords>
								<file-coords
									orientation="${this.orientation}"
									coords="${this.coords}"
									position="${this.filesPosition}"
								></file-coords>
							</div>
						`
					: nothing}

				<div class="squares">
					${map(this.board?.squares, sq => html`<juicer-square .square="${sq}"></juicer-square>`)}
				</div>

				<div class="pieces">
					${this.board?.pieceLocation
						? repeat(
								this.board.pieceLocation,
								m => m[1].id,
								([coord, piece]) => html`
									<juicer-piece
										.piece="${piece!}"
										coord="${coord}"
										?interactive="${this.interactive}"
										?dragging="${this.draggedElm?.dataset?.id === piece.id}"
										orientation="${this.orientation}"
										@piece:pointerdown="${this.onPiecePointerDown}"
										@piece:pointerup="${this.onPiecePointerUp}"
										@piece:pointermove="${this.onPiecePointerMove}"
										@piece:pointercancel="${this.onPiecePointerCancel}"
									></juicer-piece>
								`
							)
						: nothing}
				</div>

				${this.board && this.showGhost && this.ghost
					? html`
							<div class="ghost">
								<juicer-piece
									.piece="${this.ghost.piece}"
									coord="${this.ghost.coord}"
									?ghost="${true}"
									orientation="${this.orientation}"
								></juicer-piece>
							</div>
						`
					: nothing}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-board': JuicerBoard;
	}
}
