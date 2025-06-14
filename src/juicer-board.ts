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
	Change,
	assertUnreachable,
	rowColFromCoord,
	genId,
	hideElement,
} from './model';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { JuicerResizer } from './juicer-resizer.ts';
import './juicer-square.ts';
import './juicer-piece.ts';
import './juicer-coords.ts';
import './juicer-resizer.ts';
import { repeat } from 'lit/directives/repeat.js';
import {
	JuicerPiece,
	PiecePointerCancelEvent,
	PiecePointerDownEvent,
	PiecePointerMoveEvent,
	PiecePointerUpEvent,
} from './juicer-piece.ts';
export type {
	Color,
	Row,
	Col,
	Rank,
	File,
	Coord,
	PieceFenSymbol,
	PieceSymbol,
	RowCol,
	RankFile,
	NumPair,
	CoordsPlacement,
	CoordsRanksPosition,
	CoordsFilesPosition,
	PieceData,
	Position,
	Change,
} from './model';

@customElement('juicer-board')
export class JuicerBoard extends LitElement {
	static override styles = unsafeCSS(juicerBoardStyles);

	// @ts-ignore
	private resizeObserver = new ResizeController(this, {
		config: { box: 'content-box' },
		callback: (entries: ResizeObserverEntry[]) => {
			if (entries.length > 0) {
				const size = Math.round(entries[0]!.contentRect.width);
				this.boardSize = size;
				this.style.setProperty('--board-width', `${size}px`);
				this.style.setProperty('--board-height', `${size}px`);
			}
		},
	});

	private _animationInDuration?: number;
	private _animationOutDuration?: number;
	private _animationMoveDuration?: number;

	@property() fen: string = FEN_EMPTY;
	@property() orientation: Color = WHITE;
	@property({ type: Number, attribute: 'min-size' }) minSize: number = 0;
	@property({ type: Number, attribute: 'max-size' }) maxSize?: number;
	@property({ type: Boolean }) interactive: boolean = false;
	@property({ type: Boolean, attribute: 'show-ghost' }) showGhost: boolean = false;
	@property({ attribute: 'board-theme' }) boardTheme?: string;
	@property({ attribute: 'piece-theme' }) pieceTheme?: (pieceFenSymbol: PieceFenSymbol) => string;
	@property({ attribute: 'coords-placement' }) coordsPlacement: CoordsPlacement;
	@property({ attribute: 'ranks-position' }) ranksPosition: CoordsRanksPosition;
	@property({ attribute: 'files-position' }) filesPosition: CoordsFilesPosition;
	@property({ attribute: 'show-resizer', type: Boolean }) showResizer: boolean = false;
	@property({ attribute: 'check-square' }) checkSquare?: Coord;
	@property({ type: Object }) resizeTarget: HTMLElement | null = null;
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
	@state() get coords() {
		return this.orientation === WHITE ? COORDS : COORDS_REVERSED;
	}
	@state() position: Position = new Map();
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
	@state() animations: Animation[] = [];
	@state() animationsQueued: number = 0;
	@state() animationsFinished: number = 0;
	@state() removeClonesPosition: Position = new Map();
	@query('.board') boardElm!: HTMLElement;
	@query('juicer-resizer') juicerResizerElm!: JuicerResizer;

	private onPiecePointerDown(event: PiecePointerDownEvent): void {
		event.stopPropagation();
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
				pieceData: { id: genId(), piece: pieceElement.dataset['symbol'] as PieceFenSymbol },
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
			this.performSnapback(pieceElement, src, dest, pieceElement, piece, coord === null);
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
		pieceData: PieceData,
		outOufBound?: boolean
	): void {
		translateElement(elm, this.lastPos.x, this.lastPos.y);
		elm.style.removeProperty('transform'); // tmp fix not sure if this is ideal, i need to get rid of the transform so the one with css variable gets used
		this.srcSquare = null;
		this.lastPos = { x: 0, y: 0 };
		const moveCancelEvent = new MoveCancelEvent({
			src,
			dest,
			pieceElement,
			pieceData,
			reason: outOufBound ? 'out-of-bound' : 'same-square',
		});
		this.dispatchEvent(moveCancelEvent);
	}

	private performSnapToSquare(
		elm: HTMLElement,
		dest: Coord,
		clientX: number,
		clientY: number,
		boardElement: HTMLElement
	) {
		const src = this.srcSquare!;
		const pieceData = this.getPiece(src)!;
		const moveFinishEvent = new MoveFinishEvent({ src, dest, pieceElement: elm, pieceData });
		this.dispatchEvent(moveFinishEvent);
		if (moveFinishEvent.defaultPrevented) {
			translateElement(elm, this.lastPos.x, this.lastPos.y);
			this.srcSquare = null;
			this.dragOverSquare = null;
			this.lastPos = { x: 0, y: 0 };
			return;
		}
		const afterPosition = new Map(this.position);
		afterPosition.set(dest, pieceData);
		afterPosition.delete(src);
		this.position = afterPosition;
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
			const pd = position.get(this.coords[i]!);
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

	private getPositionChangesWithMovedPieceIds(
		before: Position,
		after: Position,
		orientation: Color
	): [Change[], Position] {
		const afterPosition = new Map(after);
		const changes = getPositionChanges(before, afterPosition, orientation);
		const movedChanges = changes.filter(c => c.op === 'move');
		for (const mc of movedChanges) {
			afterPosition.set(mc.dest, mc.pieceData);
		}
		return [changes, afterPosition];
	}

	private createPieceEnterAnimation(elm: HTMLElement, coord: Coord): [Animation, () => void] {
		const [row, col] = rowColFromCoord(coord, this.orientation);
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
		const anim = new Animation(new KeyframeEffect(elm, keyframes, options));
		anim.id = `piece-enter-${genId()}`;
		const cb = () => {
			translateElement(elm, deltaX, deltaY);
			elm.style.removeProperty('transform'); // tmp fix not sure if this is ideal, i need to get rid of the transform so the one with css variable gets used
		};
		return [anim, cb];
	}

	private createPieceExitAnimation(elm: HTMLElement): [Animation, () => void] {
		const keyframes: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
		const options: KeyframeAnimationOptions = {
			duration: this.animationOutDuration,
			easing: 'ease-out',
		};
		const anim = new Animation(new KeyframeEffect(elm, keyframes, options));
		anim.id = `piece-exit-${genId()}`;
		const cb = () => {
			hideElement(elm);
		};
		return [anim, cb];
	}

	private createPieceMoveAnimation(elm: HTMLElement, src: Coord, dest: Coord): [Animation, () => void] {
		const [srcRow, srcCol] = rowColFromCoord(src, this.orientation);
		const [destRow, destCol] = rowColFromCoord(dest, this.orientation);
		const srcDeltaX = srcCol * (this.clientWidth / COLS);
		const srcDeltaY = srcRow * (this.clientHeight / ROWS);
		const destDeltaX = destCol * (this.clientWidth / COLS);
		const destDeltaY = destRow * (this.clientHeight / ROWS);
		const keyframes: Keyframe[] = [
			{ transform: `translate(${srcDeltaX}px, ${srcDeltaY}px)` },
			{ transform: `translate(${destDeltaX}px, ${destDeltaY}px)` },
		];
		const options: KeyframeAnimationOptions = {
			duration: this.animationMoveDuration,
			easing: 'ease-in-out',
		};
		const anim = new Animation(new KeyframeEffect(elm, keyframes, options));
		anim.id = `piece-move-${genId()}`;
		const cb = () => {
			translateElement(elm, destDeltaX, destDeltaY);
			elm.style.removeProperty('transform'); // tmp fix not sure if this is ideal, i need to get rid of the transform so the one with css variable gets used
		};
		return [anim, cb];
	}

	private createPieceAnimation(elm: HTMLElement, change: Change): [Animation, () => void] {
		switch (change.op) {
			case 'add':
				return this.createPieceEnterAnimation(elm, change.coord);
			case 'remove':
				return this.createPieceExitAnimation(elm);
			case 'move':
				return this.createPieceMoveAnimation(elm, change.src, change.dest);
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

	private enqueueAnimation(anim: Animation): void {
		this.animations = [...this.animations, anim];
		this.animationsQueued++;
	}

	private dequeueAnimation(): void {
		this.animations = this.animations.toSpliced(0, 1);
		this.animationsFinished++;
	}

	private enqueuePieceAnimations(changes: Change[], afterPosition: Position): void {
		if (changes.length === 0) {
			return;
		}
		const removeClonesPos: Position = new Map();
		const removedChanges = changes.filter(c => c.op === 'remove');
		for (const rc of removedChanges) {
			removeClonesPos.set(rc.coord, rc.pieceData);
		}
		this.removeClonesPosition = removeClonesPos;
		this.position = afterPosition;
		this.updateComplete.then(() => {
			for (const change of changes) {
				const jp = this.shadowRoot!.querySelector(`juicer-piece[piece-id='${change.pieceData.id}']`) as JuicerPiece;
				if (!jp) {
					return;
				}
				const [anim, cb] = this.createPieceAnimation(jp.pieceElement, change);
				this.enqueueAnimation(anim);
				const onDone = () => {
					cb();
					this.dequeueAnimation();
				};
				this.playAnimation(anim, { onFinish: onDone, onCancel: onDone });
			}
		});
	}

	loadFromFen(fen: string = FEN_START): void {
		const beforePosition = new Map(this.position);
		const tmpAfterPosition = fenToPosition(fen);
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	setPosition(position: Position): void {
		const beforePosition = new Map(this.position);
		const tmpAfterPosition = new Map(position);
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	setPiece(coord: Coord, piece: PieceFenSymbol): void {
		const beforePosition = new Map(this.position);
		const tmpAfterPosition = new Map(beforePosition);
		tmpAfterPosition.set(coord, { id: genId(), piece });
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	removePiece(coord: Coord): void {
		const beforePosition = new Map(this.position);
		const tmpAfterPosition = new Map(beforePosition);
		tmpAfterPosition.delete(coord);
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	movePiece(src: Coord, dest: Coord): void {
		const beforePosition = new Map(this.position);
		const srcPieceData = beforePosition.get(src);
		if (!srcPieceData) {
			return;
		}
		const tmpAfterPosition = new Map(beforePosition);
		tmpAfterPosition.set(dest, srcPieceData);
		tmpAfterPosition.delete(src);
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	clear(): void {
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
		const beforePosition = new Map(this.position);
		const tmpAfterPosition = fenToPosition(FEN_EMPTY);
		const [changes, afterPosition] = this.getPositionChangesWithMovedPieceIds(
			beforePosition,
			tmpAfterPosition,
			this.orientation
		);
		this.enqueuePieceAnimations(changes, afterPosition);
	}

	protected override firstUpdated(): void {
		if (!this.maxSize) {
			this.maxSize = Math.min(window.innerHeight, window.innerWidth);
		}
	}

	protected override willUpdate(changedProperties: PropertyValues<this>): void {
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
		if (changedProperties.has('minSize')) {
			this.style.setProperty('--min-size', `${this.minSize}px`);
		}
		if (changedProperties.has('maxSize')) {
			this.style.setProperty('--max-size', `${this.maxSize}px`);
		}
		if (changedProperties.has('animationsFinished')) {
			if (this.animationsFinished === 0) {
				return;
			}
			if (this.animationsFinished === this.animationsQueued) {
				this.animationsQueued = 0;
				this.animationsFinished = 0;
				this.removeClonesPosition = new Map();
			}
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

				${this.showResizer
					? html`
							<juicer-resizer
								.target="${(this.resizeTarget || this) as any}"
								min-size="${this.minSize}"
								max-size="${ifDefined(this.maxSize)}"
							></juicer-resizer>
						`
					: nothing}

				<div class="squares">
					${map(
						this.coords,
						coord =>
							html`<juicer-square coord="${coord}" orientation="${this.orientation}" ?checked="${ifDefined(this.checkSquare === coord || undefined)}"</juicer-square>`
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
											?dragging="${this.draggedElm?.dataset?.['id'] === pd.id}"
											?checked="${ifDefined(this.checkSquare === coord || undefined)}"
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
				${this.removeClonesPosition.size > 0
					? html`
							<div class="remove-clones">
								${repeat(
									this.removeClonesPosition,
									m => m[1].id,
									([coord, pd]) => html`
										<juicer-piece
											exportparts="piece-${pd.id}"
											piece-id="${pd.id}"
											piece="${pd.piece}"
											coord="${coord}"
											orientation="${this.orientation}"
										></juicer-piece>
									`
								)}
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
		reason: 'same-square' | 'out-of-bound';
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
