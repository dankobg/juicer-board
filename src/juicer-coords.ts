import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import juicerCoordsStyles from './juicer-coords.css?inline';
import {
	type Color,
	type CoordsFilesPosition,
	type CoordsPlacement,
	type CoordsRanksPosition,
	type File,
	type Rank,
	FILES,
	RANKS,
	coordFromRankFile,
	getSquareColor,
} from './model';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('juicer-coords')
export class JuicerCoords extends LitElement {
	static override styles = unsafeCSS(juicerCoordsStyles);

	@property() orientation!: Color;
	@property() placement: CoordsPlacement;
	@property({ attribute: 'ranks-position' }) ranksPosition: CoordsRanksPosition;
	@property({ attribute: 'files-position' }) filesPosition: CoordsFilesPosition;

	private getRankCoordColor(rank: Rank): Color {
		const file = this.ranksPosition === 'left' ? 'a' : 'h';
		return getSquareColor(coordFromRankFile(rank, file), this.orientation);
	}

	private getFileCoordColor(file: File): Color {
		const rank = this.filesPosition === 'bottom' ? '1' : '8';
		return getSquareColor(coordFromRankFile(rank, file), this.orientation);
	}

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
							data-ranks="${ifDefined(this.ranksPosition)}"
							data-files="${ifDefined(this.filesPosition)}"
						>
							${RANKS.map(rank => html`<div data-color="${this.getRankCoordColor(rank)}">${rank}</div>`)}
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
							data-ranks="${ifDefined(this.ranksPosition)}"
							data-files="${ifDefined(this.filesPosition)}"
						>
							${FILES.map(file => html`<div data-color="${this.getFileCoordColor(file)}">${file}</div>`)}
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
