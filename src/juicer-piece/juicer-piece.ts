import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Color, Coord, Piece, Square, WHITE } from '../model';
import { getSquareIndexFromPointer } from '../util';
import juicerPieceCss from './juicer-piece.css?inline';
import { ifDefined } from 'lit/directives/if-defined.js';

export class PiecePointerDownEvent extends Event {
	static eventType = 'piece:pointerdown';

	data: {
		pieceElement: HTMLDivElement;
		pieceId: string;
		pieceRect: DOMRect;
		squareIndex: number;
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
		squareIndex: number;
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
		squareIndex: number;
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

@customElement('juicer-piece')
export class JuicerPiece extends LitElement {
	static override styles = unsafeCSS(juicerPieceCss);

	@property({ type: Boolean }) interactive: boolean = false;

	@property({ type: Boolean }) ghost: boolean = false;

	@property({ type: Boolean }) checked: boolean = false;

	@property({ type: Object }) piece!: Piece;

	@property() coord!: Coord;

	@property({ type: Boolean }) dragging: boolean = false;

	@property() orientation: Color = WHITE;

	@property({ reflect: true }) get id(): string {
		return this.piece.id;
	}

	private onPointerDown(event: PointerEvent): void {
		if (event.button !== 0 || event.ctrlKey) {
			return;
		}

		const { target, clientX, clientY, offsetX, offsetY } = event;
		const pieceElement = target as HTMLDivElement;
		const pieceRect = pieceElement.getBoundingClientRect();
		const pieceId = pieceElement.dataset.id!;
		const squareIndex = getSquareIndexFromPointer(event);

		pieceElement.setPointerCapture(event.pointerId);
		pieceElement.style.userSelect = 'none';

		const piecePointerDownEvent = new PiecePointerDownEvent({
			pieceElement,
			pieceId,
			pieceRect,
			squareIndex,
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
		const squareIndex = getSquareIndexFromPointer(event);

		pieceElement.releasePointerCapture(event.pointerId);
		pieceElement.style.userSelect = 'auto';

		const piecePointerUpEvent = new PiecePointerUpEvent({
			pieceElement,
			pieceId,
			squareIndex,
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
		const squareIndex = getSquareIndexFromPointer(event);

		const piecePointerMoveEvent = new PiecePointerMoveEvent({
			pieceElement,
			pieceId,
			squareIndex,
			clientX,
			clientY,
			offsetX,
			offsetY,
		});
		this.dispatchEvent(piecePointerMoveEvent);
	}

	private onPointerCancel(event: PointerEvent): void {
		const pieceElement = event.target as HTMLDivElement;
		pieceElement.style.userSelect = 'auto';

		const piecePointerCancelEvent = new PiecePointerCancelEvent();
		this.dispatchEvent(piecePointerCancelEvent);
	}

	private onTouchStart(event: TouchEvent): void {
		event.preventDefault();
	}

	private onDragStart(event: DragEvent): void {
		event.preventDefault();
	}

	get pieceElement(): HTMLDivElement {
		return this.shadowRoot!.querySelector('.piece')!;
	}

	protected override render() {
		const { row, col } = Square.getDataFromCoord(this.coord, this.orientation);
		const translate = `transform: translate(${col * 70}px, ${row * 70}px)`;

		return html`
			<div
				class="piece"
				data-id="${this.piece.id}"
				data-coord="${this.coord}"
				data-color="${this.piece.color}"
				data-symbol="${this.piece.fenSymbol}"
				data-dragging="${ifDefined(this.dragging && !this.ghost ? true : undefined)}"
				data-ghost="${ifDefined(this.ghost ? true : undefined)}"
				data-checked="${ifDefined(this.checked ? true : undefined)}"
				@pointerdown="${this.interactive && !this.ghost ? this.onPointerDown : undefined}"
				@pointerup="${this.interactive && !this.ghost ? this.onPointerUp : undefined}"
				@pointermove="${this.interactive && !this.ghost ? this.onPointerMove : undefined}"
				@pointercancel="${this.interactive && !this.ghost ? this.onPointerCancel : undefined}"
				@touchstart="${this.interactive && !this.ghost ? this.onTouchStart : undefined}"
				@dragstart="${this.interactive && !this.ghost ? this.onDragStart : undefined}"
				style="${translate}"
			></div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-piece': JuicerPiece;
	}
}
