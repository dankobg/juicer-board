import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import juicerResizerStyles from './juicer-resizer.css?inline';

@customElement('juicer-resizer')
export class JuicerResizer extends LitElement {
	static override styles = unsafeCSS(juicerResizerStyles);

	@property({ type: Object }) resizable!: HTMLElement;
	@property({ type: Boolean }) disabled: boolean = false;
	@property({ type: Number }) scale: number = 100;
	@property({ attribute: 'scale-factor', type: Number }) scaleFactor: number = 0.2;
	@state() resizing: boolean = false;
	@state() startX: number = 0;
	@state() startY: number = 0;
	@state() startScale: number = 0;

	@query('.resizer') resizerElm!: HTMLElement;

	private startResize = (event: PointerEvent) => {
		if (this.disabled || !this.resizable) {
			return;
		}
		if (!this.resizable) {
			console.log('no target (resizable element) provided');
			return;
		}
		this.resizing = true;
		const { clientX, clientY, target } = event;
		(target as HTMLElement).setPointerCapture(event.pointerId);
		this.startX = clientX;
		this.startY = clientY;
		this.startScale = this.scale;
		this.addEventListener('pointermove', this.resize.bind(this));
		this.addEventListener('pointerup', this.stopResize.bind(this));
	};

	private stopResize(event: PointerEvent) {
		const { target } = event;
		(target as HTMLElement).releasePointerCapture(event.pointerId);
		this.resizing = false;
		this.removeEventListener('pointermove', this.resize.bind(this));
		this.removeEventListener('pointerup', this.stopResize.bind(this));
	}

	private resize = (event: PointerEvent) => {
		if (this.disabled || !this.resizing) {
			return;
		}
		const { clientX } = event;
		const diffX = clientX - this.startX;
		const newScale = this.startScale + diffX * this.scaleFactor;
		const newScaleClamped = Math.max(1, Math.min(100, newScale));
		this.scale = newScaleClamped;
		this.dispatchEvent(new ResizerScaleChangeEvent({ scale: newScaleClamped }));
	};

	protected override render() {
		return html`
			<div class="resizer" @pointerdown="${this.startResize}">
				<svg width="800px" height="800px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" mirror-in-rtl="true">
					<path
						d="M14.228 16.227a1 1 0 0 1-.707-1.707l1-1a1 1 0 0 1 1.416 1.414l-1 1a1 1 0 0 1-.707.293zm-5.638 0a1 1 0 0 1-.707-1.707l6.638-6.638a1 1 0 0 1 1.416 1.414l-6.638 6.638a1 1 0 0 1-.707.293zm-5.84 0a1 1 0 0 1-.707-1.707L14.52 2.043a1 1 0 1 1 1.415 1.414L3.457 15.934a1 1 0 0 1-.707.293z"
					/>
				</svg>
			</div>
		`;
	}
}

export class ResizerScaleChangeEvent extends Event {
	static eventType = 'resizer:scale-changed';
	data: { scale: number };
	constructor(data: ResizerScaleChangeEvent['data']) {
		super(ResizerScaleChangeEvent.eventType, { bubbles: true, composed: true, cancelable: false });
		this.data = data;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-resizer': JuicerResizer;
	}
}
