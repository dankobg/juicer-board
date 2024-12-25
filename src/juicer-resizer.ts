import { LitElement, PropertyValues, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import juicerResizerStyles from './juicer-resizer.css?inline';

@customElement('juicer-resizer')
export class JuicerResizer extends LitElement {
	static override styles = unsafeCSS(juicerResizerStyles);

	@property({ type: Object }) target!: HTMLElement;
	@property({ type: Boolean }) disabled: boolean = false;
	@property({ type: Number, attribute: 'min-size' }) minSize: number = 240;
	@state() resizing: boolean = false;
	@state() startWidth: number = 0;
	@state() startHeight: number = 0;
	@state() startX: number = 0;
	@state() startY: number = 0;
	@query('.resizer') resizerElm!: HTMLElement;

	private startResize(event: PointerEvent) {
		if (this.disabled) {
			return;
		}
		if (!this.target) {
			console.log('no target (resizable element) provided');
			return;
		}
		this.resizing = true;
		const { clientX, clientY, target } = event;
		(target as HTMLElement).setPointerCapture(event.pointerId);
		this.startX = clientX;
		this.startY = clientY;
		const computed = getComputedStyle(this.target);
		this.startWidth = Number.parseFloat(computed.width);
		this.startHeight = Number.parseFloat(computed.height);
		this.addEventListener('pointermove', this.resize.bind(this));
		this.addEventListener('pointerup', this.stopResize.bind(this));
	}

	private stopResize(event: PointerEvent) {
		const { target } = event;
		(target as HTMLElement).releasePointerCapture(event.pointerId);
		this.resizing = false;
		this.removeEventListener('pointermove', this.resize.bind(this));
		this.removeEventListener('pointerup', this.stopResize.bind(this));
	}

	private resize(event: PointerEvent) {
		if (this.disabled || !this.resizing) {
			return;
		}
		if (!this.target) {
			console.log('no resizableElm provided');
			return;
		}
		const { clientX, clientY } = event;
		const diffX = clientX - this.startX;
		const diffY = clientY - this.startY;
		const newSize = Math.max(this.startWidth + diffX, this.startHeight + diffY, this.minSize);
		this.target.style.setProperty('width', `${newSize}px`);
		this.target.style.setProperty('height', `${newSize}px`);
	}

	protected updated(changedProperties: PropertyValues): void {
		if (changedProperties.has('minSize')) {
			if (this.target.clientWidth < this.minSize) {
				this.target.style.setProperty('width', `${this.minSize}px`);
				this.target.style.setProperty('height', `${this.minSize}px`);
			}
		}
	}

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

declare global {
	interface HTMLElementTagNameMap {
		'juicer-resizer': JuicerResizer;
	}
}
