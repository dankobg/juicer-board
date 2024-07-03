import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import juicerSquareCss from './juicer-square.css?inline';
import { Square } from '../model';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('juicer-square')
export class JuicerSquare extends LitElement {
	static override styles = unsafeCSS(juicerSquareCss);

	@property({ type: Object }) square!: Square;
	@property({ type: Boolean }) checked: boolean = false;
	@property({ type: Boolean }) selected: boolean = false;
	@property({ type: Boolean }) bordered: boolean = false;
	@property({ type: Boolean }) highlighted: boolean = false;

	protected override render() {
		return html`
			<div
				class="square"
				data-coord="${this.square.coord}"
				data-index="${this.square.index}"
				data-checked="${ifDefined(this.checked ? true : undefined)}"
				data-selected="${ifDefined(this.selected ? true : undefined)}"
				data-bordered="${ifDefined(this.bordered ? true : undefined)}"
				data-highlighted="${ifDefined(this.highlighted ? true : undefined)}"
				data-color="${this.square.color}"
			></div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-square': JuicerSquare;
	}
}
