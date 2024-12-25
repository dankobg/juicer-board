import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
	Color,
	Coord,
	indexFromCoord,
	getSquareColor,
	RankFile,
	rankFileFromCoord,
	RowCol,
	rowColFromCoord,
} from './model';
import { ifDefined } from 'lit/directives/if-defined.js';
import juicerSquareStyles from './juicer-square.css?inline';

@customElement('juicer-square')
export class JuicerSquare extends LitElement {
	static override styles = unsafeCSS(juicerSquareStyles);

	@property({ reflect: true }) coord!: Coord;
	@property() orientation!: Color;
	@property({ type: Boolean }) checked: boolean = false;
	@property({ type: Boolean }) selected: boolean = false;
	@property({ type: Boolean }) bordered: boolean = false;
	@property({ type: Boolean }) highlighted: boolean = false;
	@property({ type: Number }) get index(): number {
		return indexFromCoord(this.coord, this.orientation);
	}
	@property({ type: Array }) get rankFile(): RankFile {
		return rankFileFromCoord(this.coord);
	}
	@property({ type: Array }) get rowCol(): RowCol {
		return rowColFromCoord(this.coord, this.orientation);
	}
	@property() get color(): Color {
		return getSquareColor(this.coord, this.orientation);
	}

	protected override render() {
		return html`
			<div
				class="square"
				part="square"
				data-coord="${this.coord}"
				data-index="${this.index}"
				data-color="${this.color}"
				data-checked="${ifDefined(this.checked ? true : undefined)}"
				data-selected="${ifDefined(this.selected ? true : undefined)}"
				data-bordered="${ifDefined(this.bordered ? true : undefined)}"
				data-highlighted="${ifDefined(this.highlighted ? true : undefined)}"
			></div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'juicer-square': JuicerSquare;
	}
}
