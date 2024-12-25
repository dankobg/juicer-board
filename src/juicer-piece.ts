import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
	PieceFenSymbol,
	Coord,
	Color,
	WHITE,
	BLACK,
	rowColFromCoord,
	getSquareCoordFromPointer,
	indexFromCoord,
} from './model';
import { ifDefined } from 'lit/directives/if-defined.js';
import juicerPieceStyles from './juicer-piece.css?inline';

@customElement('juicer-piece')
export class JuicerPiece extends LitElement {
	static override styles = unsafeCSS(juicerPieceStyles);

	get pieceElement(): HTMLDivElement {
		return this.shadowRoot!.querySelector('.piece')!;
	}

	@property({ attribute: 'piece-id' }) pieceId!: string;
	@property() piece!: PieceFenSymbol;
	@property() coord!: Coord;
	@property() orientation: Color = WHITE;
	@property({ type: Boolean }) interactive: boolean = false;
	@property({ type: Boolean }) ghost: boolean = false;
	@property({ type: Boolean }) checked: boolean = false;
	@property({ type: Boolean }) dragging: boolean = false;
	@property() get color(): Color {
		return this.piece === this.piece.toUpperCase() ? WHITE : BLACK;
	}

	private onPointerDown(event: PointerEvent): void {
		if (event.button !== 0 || event.ctrlKey) {
			return;
		}
		const { target, clientX, clientY, offsetX, offsetY } = event;
		const pieceElement = target as HTMLDivElement;
		const pieceRect = pieceElement.getBoundingClientRect();
		const pieceId = pieceElement.dataset.id!;
		const coord = getSquareCoordFromPointer(event, this.orientation);
		const index = indexFromCoord(coord, this.orientation);
		pieceElement.setPointerCapture(event.pointerId);
		pieceElement.style.setProperty('user-select', 'none');
		const piecePointerDownEvent = new PiecePointerDownEvent({
			pieceElement,
			pieceId,
			pieceRect,
			coord,
			index,
			clientX,
			clientY,
			offsetX,
			offsetY,
		});
		this.dispatchEvent(piecePointerDownEvent);
	}

	private onPointerUp(event: PointerEvent): void {
		if (event.button !== 0 || event.ctrlKey) {
			return;
		}
		const { target, clientX, clientY, offsetX, offsetY } = event;
		const pieceElement = target as HTMLDivElement;
		const pieceId = pieceElement.dataset.id!;
		const coord = getSquareCoordFromPointer(event, this.orientation);
		const index = indexFromCoord(coord, this.orientation);
		pieceElement.releasePointerCapture(event.pointerId);
		pieceElement.style.setProperty('user-select', 'auto');
		const piecePointerUpEvent = new PiecePointerUpEvent({
			pieceElement,
			pieceId,
			coord,
			index,
			clientX,
			clientY,
			offsetX,
			offsetY,
		});
		this.dispatchEvent(piecePointerUpEvent);
	}

	private onPointerMove(event: PointerEvent): void {
		event.stopPropagation();
		if (!this.dragging) {
			return;
		}
		const { target, clientX, clientY, offsetX, offsetY } = event;
		const pieceElement = target as HTMLDivElement;
		const pieceId = pieceElement.dataset.id!;
		const coord = getSquareCoordFromPointer(event, this.orientation);
		const index = indexFromCoord(coord, this.orientation);
		const piecePointerMoveEvent = new PiecePointerMoveEvent({
			pieceElement,
			pieceId,
			coord,
			index,
			clientX,
			clientY,
			offsetX,
			offsetY,
		});
		this.dispatchEvent(piecePointerMoveEvent);
	}

	private onPointerCancel(event: PointerEvent): void {
		const pieceElement = event.target as HTMLDivElement;
		pieceElement.releasePointerCapture(event.pointerId);
		pieceElement.style.setProperty('user-select', 'auto');
		const piecePointerCancelEvent = new PiecePointerCancelEvent();
		this.dispatchEvent(piecePointerCancelEvent);
	}

	private onTouchStart(event: TouchEvent): void {
		event.preventDefault();
	}

	private onDragStart(event: DragEvent): void {
		event.preventDefault();
	}

	protected override render() {
		const [row, col] = rowColFromCoord(this.coord, this.orientation);
		return html`
			<div
				class="piece"
				part="piece-${this.pieceId}"
				style="--row: ${row};--col: ${col}"
				data-id="${this.pieceId}"
				data-coord="${this.coord}"
				data-color="${this.color}"
				data-symbol="${this.piece}"
				data-interactive="${ifDefined(this.interactive ? true : undefined)}"
				data-dragging="${ifDefined(this.dragging && !this.ghost ? true : undefined)}"
				data-ghost="${ifDefined(this.ghost ? true : undefined)}"
				data-checked="${ifDefined(this.checked ? true : undefined)}"
				@pointerdown="${this.interactive && !this.ghost ? this.onPointerDown : undefined}"
				@pointerup="${this.interactive && !this.ghost ? this.onPointerUp : undefined}"
				@pointermove="${this.interactive && !this.ghost ? this.onPointerMove : undefined}"
				@pointercancel="${this.interactive && !this.ghost ? this.onPointerCancel : undefined}"
				@touchstart="${this.interactive && !this.ghost ? this.onTouchStart : undefined}"
				@dragstart="${this.interactive && !this.ghost ? this.onDragStart : undefined}"
			></div>
		`;
	}
}

export class PiecePointerDownEvent extends Event {
	static eventType = 'piece:pointerdown';
	data: {
		pieceElement: HTMLDivElement;
		pieceId: string;
		pieceRect: DOMRect;
		coord: Coord | null;
		index: number;
		clientX: number;
		clientY: number;
		offsetX: number;
		offsetY: number;
	};
	constructor(data: PiecePointerDownEvent['data']) {
		super(PiecePointerDownEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

export class PiecePointerUpEvent extends Event {
	static eventType = 'piece:pointerup';
	data: {
		pieceElement: HTMLDivElement;
		pieceId: string;
		coord: Coord | null;
		index: number;
		clientX: number;
		clientY: number;
		offsetX: number;
		offsetY: number;
	};
	constructor(data: PiecePointerUpEvent['data']) {
		super(PiecePointerUpEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

export class PiecePointerMoveEvent extends Event {
	static eventType = 'piece:pointermove';
	data: {
		pieceElement: HTMLDivElement;
		pieceId: string;
		coord: Coord | null;
		index: number;
		clientX: number;
		clientY: number;
		offsetX: number;
		offsetY: number;
	};
	constructor(data: PiecePointerMoveEvent['data']) {
		super(PiecePointerMoveEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

export class PiecePointerCancelEvent extends Event {
	static eventType = 'piece:pointercancel';
	constructor() {
		super(PiecePointerCancelEvent.eventType, { bubbles: true, composed: true, cancelable: false });
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-piece': JuicerPiece;
	}

	interface HTMLElementEventMap {
		'piece:pointerdown': PiecePointerDownEvent;
		'piece:pointerup': PiecePointerUpEvent;
		'piece:pointermove': PiecePointerMoveEvent;
		'piece:pointercancel': PiecePointerCancelEvent;
	}
}
