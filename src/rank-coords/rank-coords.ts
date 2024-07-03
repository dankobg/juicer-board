import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Color, RANKS, WHITE } from '../model';
import rankCoordsCss from './rank-coords.css?inline';

@customElement('rank-coords')
export class RankCoords extends LitElement {
	static override styles = unsafeCSS(rankCoordsCss);

	@property() orientation: Color = WHITE;
	@property() coords: 'outside' | 'inside' = 'inside';
	@property() position: 'start' | 'end' | 'both' = 'start';

	protected override render() {
		return html`
			<div
				class="rank-coords"
				data-orientation="${this.orientation}"
				data-coords="${this.coords}"
				data-position="${this.position}"
			>
				${RANKS.map(row => html`<div>${row}</div>`)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'rank-coords': RankCoords;
	}
}
