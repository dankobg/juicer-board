import { ifDefined } from 'lit/directives/if-defined.js';
import { LitElement, PropertyValues, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import juicerBoardStyles from './juicer-board.css?inline';
import { map } from 'lit/directives/map.js';
import {
	BLACK,
	Color,
	COLS,
	Coord,
	COORDS,
	COORDS_REVERSED,
	CoordsFilesPosition,
	CoordsPlacement,
	CoordsRanksPosition,
	FEN_EMPTY,
	FEN_START,
	FILES,
	getDeltaXYFromCoord,
	getPositionChanges,
	PIECE_SYMBOLS,
	PieceData,
	PieceFenSymbol,
	Position,
	ROWS,
	translateElement,
	WHITE,
	positionToFen,
	fenToPosition,
} from './model';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { JuicerResizer } from './juicer-resizer.ts';

import './juicer-square.ts';
import './juicer-piece.ts';
import './juicer-coords.ts';
import './juicer-resizer.ts';
import { repeat } from 'lit/directives/repeat.js';
import {
	PiecePointerCancelEvent,
	PiecePointerDownEvent,
	PiecePointerMoveEvent,
	PiecePointerUpEvent,
} from './juicer-piece.ts';

@customElement('juicer-board')
export class JuicerBoard extends LitElement {
	static override styles = unsafeCSS(juicerBoardStyles);

	// @ts-ignore
	private resizeObserver = new ResizeController(this, {
		config: { box: 'content-box' },
		callback: (entries: ResizeObserverEntry[]) => {
			if (entries.length > 0) {
				const size = Math.round(entries[0].contentRect.width);
				this.boardSize = size;
				this.style.setProperty('--min-size', `${this.minSize}px`);
				this.style.setProperty('--board-width', `${size}px`);
				this.style.setProperty('--board-height', `${size}px`);
			}
		},
	});

	private _animationInDuration?: number;
	private _animationOutDuration?: number;
	private _animationMoveDuration?: number;
	private lastMoveControlType: 'api' | 'input' | undefined;
	// @ts-ignore
	private vt: ViewTransition | undefined;

	@property() fen: string = FEN_EMPTY;
	@property() orientation: Color = WHITE;
	@property({ type: Number, attribute: 'min-size' }) minSize: number = 240;
	@property({ type: Boolean }) interactive: boolean = false;
	@property({ type: Boolean, attribute: 'show-ghost' }) showGhost: boolean = false;
	@property({ attribute: 'board-theme' }) boardTheme?: string;
	@property({ attribute: 'piece-theme' }) pieceTheme?: (pieceFenSymbol: PieceFenSymbol) => string;
	@property({ attribute: 'coords-placement' }) coordsPlacement: CoordsPlacement;
	@property({ attribute: 'ranks-position' }) ranksPosition: CoordsRanksPosition;
	@property({ attribute: 'files-position' }) filesPosition: CoordsFilesPosition;
	@property({ type: Number, attribute: 'anim-snapback-dur' }) animationSnapbackDuration: number = 0;
	@property({ type: Number, attribute: 'anim-snap-dur' }) animationSnapDuration: number = 0;
	@property({ type: Number, attribute: 'anim-dur' }) animationDuration: number = 300;
	@property({ type: Number, attribute: 'anim-in-dur' })
	get animationInDuration(): number {
		return this._animationInDuration ?? this.animationDuration;
	}
	set animationInDuration(value: number) {
		this._animationInDuration = value;
	}
	@property({ type: Number, attribute: 'anim-out-dur' })
	get animationOutDuration(): number {
		return this._animationOutDuration ?? this.animationDuration;
	}
	set animationOutDuration(value: number) {
		this._animationOutDuration = value;
	}
	@property({ type: Number, attribute: 'anim-move-dur' })
	get animationMoveDuration(): number {
		return this._animationMoveDuration ?? this.animationDuration;
	}
	set animationMoveDuration(value: number) {
		this._animationMoveDuration = value;
	}
	@state() boardSize: number = 0;
	@state() maxSize?: number;
	@state() get coords() {
		return this.orientation === WHITE ? COORDS : COORDS_REVERSED;
	}
	@state() position: Position = new Map();
	@state() positionCopy: Position = new Map();
	@state() dragging: boolean = false;
	@state() draggedElm: HTMLElement | null = null;
	@state() pieceOffsetWidth: number = 0;
	@state() pieceOffsetHeight: number = 0;
	@state() srcSquare: Coord | null = null;
	@state() destSquare: Coord | null = null;
	@state() dragOverSquare: Coord | null = null;
	@state() selectedSquare: Coord | null = null;
	@state() highlightedSquares: Coord[] = [];
	@state() lastPos: { x: number; y: number } = { x: 0, y: 0 };
	@state() ghost: { pieceData: PieceData; coord: Coord } | null = null;
	@query('.board') boardElm!: HTMLElement;
	@query('juicer-resizer') juicerResizerElm!: JuicerResizer;

	private onPiecePointerDown(event: PiecePointerDownEvent): void {
		event.stopPropagation();
		this.lastMoveControlType = 'input';
		const { coord, pieceElement, pieceRect, clientX, clientY } = event.data;
		if (!coord) {
			return;
		}
		const pieceData = this.getPiece(coord);
		if (!pieceData) {
			return;
		}
		const moveStartEvent = new MoveStartEvent({ src: coord, pieceData: pieceData, pieceElement });
		this.dispatchEvent(moveStartEvent);
		if (moveStartEvent.defaultPrevented) {
			return;
		}
		if (this.showGhost) {
			this.ghost = {
				coord,
				pieceData: { id: crypto.randomUUID(), piece: pieceElement.dataset.symbol as PieceFenSymbol },
			};
		}
		this.dragging = true;
		this.draggedElm = pieceElement;
		this.pieceOffsetWidth = pieceRect.width / 2;
		this.pieceOffsetHeight = pieceRect.height / 2;
		this.srcSquare = coord;
		const [x, y] = getDeltaXYFromCoord(this.srcSquare, this.boardSize / 8, this.boardSize / 8, this.orientation);
		this.lastPos = { x, y };
		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight;
		translateElement(this.draggedElm, deltaX, deltaY);
	}

	private onPiecePointerUp(event: PiecePointerUpEvent): void {
		event.stopPropagation();
		this.lastMoveControlType = 'input';
		if (!this.dragging) {
			return;
		}
		const { coord, pieceElement, clientX, clientY } = event.data;
		this.dragging = false;
		this.draggedElm = null;
		this.ghost = null;

		if (coord === null || coord === this.srcSquare) {
			const src = this.srcSquare!;
			const dest = coord;
			const piece = this.getPiece(src)!;
			this.performSnapback(pieceElement, src, dest, pieceElement, piece);
		} else {
			this.performSnapToSquare(pieceElement, coord!, clientX, clientY, this);
		}
	}

	private onPiecePointerMove(event: PiecePointerMoveEvent): void {
		event.stopPropagation();
		if (!this.dragging) {
			return;
		}
		const { coord, pieceElement, clientX, clientY } = event.data;
		this.dragOverSquare = coord;
		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight;
		translateElement(pieceElement, deltaX, deltaY);
	}

	private onPiecePointerCancel(event: PiecePointerCancelEvent): void {
		event.stopPropagation();
		this.lastMoveControlType = 'input';
		this.dragging = false;
		this.draggedElm = null;
		this.ghost = null;
	}

	private onBoardContextMenu(event: Event): void {
		event.preventDefault();
	}

	private setBoardTheme(): void {
		if (this.boardTheme) {
			this.style.setProperty('--board-theme', `url('${this.boardTheme}')`);
		}
	}

	private setPieceTheme() {
		if (!this.pieceTheme) {
			return;
		}
		PIECE_SYMBOLS.forEach(symbol => {
			const name = '--' + (symbol.toUpperCase() === symbol ? 'w' : 'b') + symbol.toLowerCase() + '-theme';
			const theme = `url('${this.pieceTheme!(symbol)}')`;
			this.style.setProperty(name, theme);
		});
	}

	private performSnapback(
		elm: HTMLElement,
		src: Coord,
		dest: Coord | null,
		pieceElement: HTMLElement,
		pieceData: PieceData
	): void {
		this.lastMoveControlType = 'input';
		translateElement(elm, this.lastPos.x, this.lastPos.y);
		this.srcSquare = null;
		this.lastPos = { x: 0, y: 0 };
		const moveCancelEvent = new MoveCancelEvent({ src, dest, pieceElement, pieceData });
		this.dispatchEvent(moveCancelEvent);
	}

	private performSnapToSquare(
		elm: HTMLElement,
		dest: Coord,
		clientX: number,
		clientY: number,
		boardElement: HTMLElement
	) {
		this.lastMoveControlType = 'input';
		const src = this.srcSquare!;
		const pieceData = this.getPiece(src)!;
		const moveFinishEvent = new MoveFinishEvent({ src, dest, pieceElement: elm, pieceData });
		if (moveFinishEvent.defaultPrevented) {
			this.srcSquare = null;
			this.dragOverSquare = null;
			this.lastPos = { x: 0, y: 0 };
			translateElement(elm, this.lastPos.x, this.lastPos.y);
			return;
		}
		const afterPosition = new Map(this.position);
		afterPosition.set(dest, pieceData);
		afterPosition.delete(src);
		this.position = afterPosition;
		this.dispatchEvent(moveFinishEvent);
		const [x, y] = getDeltaXYFromCoord(dest, this.boardSize / 8, this.boardSize / 8, this.orientation);
		const squareTopLeftX = x + boardElement.offsetLeft;
		const squareTopLeftY = y + boardElement.offsetTop;
		const snapDx = clientX - squareTopLeftX - this.pieceOffsetWidth;
		const snapDy = clientY - squareTopLeftY - this.pieceOffsetHeight;
		const deltaX = clientX - this.offsetLeft - this.pieceOffsetWidth - snapDx;
		const deltaY = clientY - this.offsetTop - this.pieceOffsetHeight - snapDy;
		translateElement(elm, deltaX, deltaY);
	}

	private printBoard(position: Position, orientation: Color): string {
		const border = '+------------------------+';
		let s = `   ${border}\n`;
		for (let i = 0; i < this.coords.length; i++) {
			let rank: number = 8 - Math.floor(i / 8);
			if (orientation === BLACK) {
				rank = Math.floor(i / ROWS) + 1;
			}
			if (i % ROWS === 0) {
				s += ` ${rank} |`;
			}
			const pd = position.get(this.coords[i]);
			s += ` ${pd?.piece ?? '-'} `;

			if (i % COLS === 7) {
				s += '| \n';
			}
		}
		s += `   ${border}\n`;
		const letters = orientation === WHITE ? FILES : FILES.toReversed();
		s += '     ' + letters.join('  ');
		return s;
	}

	flip(): void {
		this.orientation = this.orientation === WHITE ? BLACK : WHITE;
	}

	print(): string {
		return this.printBoard(this.position, this.orientation);
	}

	getFen(): string {
		return positionToFen(this.position);
	}

	piecesCount(): number {
		return this.position.size;
	}

	getPiece(coord: Coord): PieceData | null {
		return this.position.get(coord) ?? null;
	}

	loadFromFen(fen: string = FEN_START): void {
		this.lastMoveControlType = 'api';
		const beforePosition = new Map(this.position);
		const afterPosition = fenToPosition(fen);
		const changes = getPositionChanges(beforePosition, afterPosition, this.orientation);
		const movedChanges = changes.filter(c => c.op === 'move');
		for (const mc of movedChanges) {
			afterPosition.set(mc.dest, mc.pieceData);
		}
		this.positionCopy = afterPosition;
		const updater = () => {
			this.position = afterPosition;
		};
		if (document.startViewTransition && this.lastMoveControlType === 'api') {
			this.vt = document.startViewTransition(updater);
		} else {
			updater();
		}
	}

	setPiece(coord: Coord, piece: PieceFenSymbol): void {
		this.lastMoveControlType = 'api';
		const beforePosition = new Map(this.position);
		const afterPosition = new Map(beforePosition);
		afterPosition.set(coord, { id: crypto.randomUUID(), piece });
		this.positionCopy = afterPosition;
		const updater = () => {
			this.position = afterPosition;
		};
		if (document.startViewTransition && this.lastMoveControlType === 'api') {
			this.vt = document.startViewTransition(updater);
		} else {
			updater();
		}
	}

	removePiece(coord: Coord): void {
		this.lastMoveControlType = 'api';
		const beforePosition = new Map(this.position);
		const afterPosition = new Map(beforePosition);
		afterPosition.delete(coord);
		this.positionCopy = afterPosition;
		const updater = () => {
			this.position = afterPosition;
		};
		if (document.startViewTransition && this.lastMoveControlType === 'api') {
			this.vt = document.startViewTransition(updater);
		} else {
			updater();
		}
	}

	movePiece(src: Coord, dest: Coord): void {
		this.lastMoveControlType = 'api';
		const beforePosition = new Map(this.position);
		const srcPieceData = beforePosition.get(src);
		if (!srcPieceData) {
			return;
		}
		const afterPosition = new Map(beforePosition);
		afterPosition.set(dest, srcPieceData);
		afterPosition.delete(src);
		const changes = getPositionChanges(beforePosition, afterPosition, this.orientation);
		const movedChanges = changes.filter(c => c.op === 'move');
		for (const mc of movedChanges) {
			afterPosition.set(mc.dest, mc.pieceData);
		}
		this.positionCopy = afterPosition;
		const updater = () => {
			this.position = afterPosition;
		};
		if (document.startViewTransition && this.lastMoveControlType === 'api') {
			this.vt = document.startViewTransition(updater);
		} else {
			updater();
		}
	}

	clear(): void {
		this.lastMoveControlType = 'api';
		this.fen = FEN_EMPTY;
		this.orientation = WHITE;
		this.pieceOffsetWidth = 0;
		this.pieceOffsetHeight = 0;
		this.srcSquare = null;
		this.destSquare = null;
		this.dragOverSquare = null;
		this.selectedSquare = null;
		this.highlightedSquares = [];
		this.lastPos = { x: 0, y: 0 };
		this.ghost = null;
		const updater = () => {
			this.position = new Map();
		};
		if (document.startViewTransition && this.lastMoveControlType === 'api') {
			this.vt = document.startViewTransition(updater);
		} else {
			updater();
		}
	}

	private updateAdoptedStylesheet(): void {
		const sheet = new CSSStyleSheet();
		const rules = this.positionCopy.values().reduce((acc, pd) => {
			const rule = `juicer-board::part(piece-${pd.id}) { view-transition-name: piece-${pd.id}; }`;
			acc += rule + '\n';
			return acc;
		}, '');
		sheet.replaceSync(rules);
		document.adoptedStyleSheets = [sheet];
	}

	protected firstUpdated(): void {
		this.maxSize = Math.min(window.innerHeight, window.innerWidth);
	}

	protected willUpdate(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('fen')) {
			const fen = ['new', 'start'].includes(this.fen) ? FEN_START : this.fen;
			this.loadFromFen(fen);
		}
		if (changedProperties.has('boardTheme')) {
			this.setBoardTheme();
		}
		if (changedProperties.has('pieceTheme')) {
			this.setPieceTheme();
		}
		if (changedProperties.has('positionCopy')) {
			this.updateAdoptedStylesheet();
		}
	}

	protected override render() {
		return html`
			<div class="board" part="board" style="--rows:${ROWS}; --cols:${COLS};" @contextmenu="${this.onBoardContextMenu}">
				<juicer-coords
					orientation="${this.orientation}"
					placement="${ifDefined(this.coordsPlacement)}"
					ranks-position="${ifDefined(this.ranksPosition)}"
					files-position="${ifDefined(this.filesPosition)}"
				></juicer-coords>
				<juicer-resizer
					.target="${this}"
					min-size="${this.minSize}"
					max-size="${ifDefined(this.maxSize)}"
				></juicer-resizer>
				<div class="squares">
					${map(
						this.coords,
						coord => html`<juicer-square coord="${coord}" orientation="${this.orientation}"></juicer-square>`
					)}
				</div>

				${this.position.size > 0
					? html`
							<div class="pieces">
								${repeat(
									this.position,
									m => m[1].id,
									([coord, pd]) => html`
										<juicer-piece
											exportparts="piece-${pd.id}"
											piece-id="${pd.id}"
											piece="${pd.piece}"
											coord="${coord}"
											?interactive="${this.interactive}"
											?dragging="${this.draggedElm?.dataset?.id === pd.id}"
											orientation="${this.orientation}"
											@piece:pointerdown="${this.onPiecePointerDown}"
											@piece:pointerup="${this.onPiecePointerUp}"
											@piece:pointermove="${this.onPiecePointerMove}"
											@piece:pointercancel="${this.onPiecePointerCancel}"
										></juicer-piece>
									`
								)}
							</div>
						`
					: nothing}
				${this.position.size > 0 && this.showGhost && this.ghost
					? html`
							<div class="ghost">
								<juicer-piece
									piece-id="${this.ghost.pieceData.id}"
									piece="${this.ghost.pieceData.piece}"
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

export class MoveStartEvent extends Event {
	static eventType = 'movestart';
	data: {
		src: Coord;
		pieceElement: HTMLElement;
		pieceData: PieceData;
	};
	constructor(data: MoveStartEvent['data']) {
		super(MoveStartEvent.eventType, { bubbles: true, composed: true, cancelable: true });
		this.data = data;
	}
}

export class MoveFinishEvent extends Event {
	static eventType = 'movefinish';
	data: {
		src: Coord;
		dest: Coord;
		pieceElement: HTMLElement;
		pieceData: PieceData;
	};
	constructor(data: MoveFinishEvent['data']) {
		super(MoveFinishEvent.eventType, { bubbles: true, composed: true, cancelable: true });
		this.data = data;
	}
}

export class MoveCancelEvent extends Event {
	static eventType = 'movecancel';
	data: {
		src: Coord;
		dest: Coord | null;
		pieceElement: HTMLElement;
		pieceData: PieceData;
	};
	constructor(data: MoveCancelEvent['data']) {
		super(MoveCancelEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-board': JuicerBoard;
	}

	interface HTMLElementEventMap {
		movestart: MoveStartEvent;
		movefinish: MoveFinishEvent;
		movecancel: MoveCancelEvent;
	}
}
