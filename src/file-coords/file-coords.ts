import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Color, FILES, WHITE } from '../model';
import fileCoordsCss from './file-coords.css?inline';

@customElement('file-coords')
export class FileCoords extends LitElement {
	static override styles = unsafeCSS(fileCoordsCss);

	@property() orientation: Color = WHITE;

	@property() coords: 'outside' | 'inside' = 'inside';

	@property() position: 'start' | 'end' | 'both' = 'start';

	protected override render() {
		return html`
			<div
				class="file-coords"
				data-orientation="${this.orientation}"
				data-coords="${this.coords}"
				data-position="${this.position}"
			>
				${FILES.map(file => html`<div>${file}</div>`)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'file-coords': FileCoords;
	}
}
