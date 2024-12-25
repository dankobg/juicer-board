import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import juicerCoordsStyles from './juicer-coords.css?inline';
import { Color, CoordsFilesPosition, CoordsPlacement, CoordsRanksPosition, FILES, RANKS } from './model';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('juicer-coords')
export class JuicerCoords extends LitElement {
	static override styles = unsafeCSS(juicerCoordsStyles);

	@property() orientation!: Color;
	@property() placement: CoordsPlacement;
	@property({ attribute: 'ranks-position' }) ranksPosition: CoordsRanksPosition;
	@property({ attribute: 'files-position' }) filesPosition: CoordsFilesPosition;

	protected override render() {
		if (!this.placement || !(this.ranksPosition && this.filesPosition)) {
			return nothing;
		}

		return html`
			${this.ranksPosition
				? html`
						<div
							class="ranks"
							part="ranks"
							data-orientation="${this.orientation}"
							data-placement="${ifDefined(this.placement)}"
							data-position="${ifDefined(this.ranksPosition)}"
						>
							${RANKS.map(rank => html`<div>${rank}</div>`)}
						</div>
					`
				: nothing}
			${this.filesPosition
				? html`
						<div
							class="files"
							part="files"
							data-orientation="${this.orientation}"
							data-placement="${ifDefined(this.placement)}"
							data-position="${ifDefined(this.filesPosition)}"
						>
							${FILES.map(file => html`<div>${file}</div>`)}
						</div>
					`
				: nothing}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-coords': JuicerCoords;
	}
}
