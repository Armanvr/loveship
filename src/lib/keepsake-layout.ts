// Géométrie de la carte souvenir : fonctions pures, sans DOM. Partagée par l'affichage et l'export Canvas.
import { BOUQUET_ASPECT } from '../components/bouquet/geometry.ts'
import { KEEPSAKE_DATE_PLACEHOLDER } from '../config/index.ts'

export const CARD_ASPECT = 3 / 2

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}

export interface TextItem {
	kind: 'name' | 'date'
	text: string
	/** Centre de la ligne. */
	cx: number
	cy: number
	/** Corps de la police, en pixels de la carte. */
	size: number
	maxWidth: number
	italic: boolean
	weight: number
	/** Interlettrage en em. */
	tracking: number
}

export interface KeepsakeLayout {
	width: number
	height: number
	bouquet: Rect
	items: TextItem[]
	/** Filet fin entre les noms et la date. */
	rule: { x1: number; x2: number; y: number }
}

/**
 * Variables CSS communes à la scène florale et à la carte (même emprise, même repère en cqw = 1 % de la largeur).
 * --dx/--dy : décalage du bouquet de sa place sur la carte vers le centre de la scène ; --extra : demi-hauteur du bouquet.
 */
export function stageVars() {
	const { height, bouquet } = keepsakeLayout(100, { recipient: '', sender: '', dateLabel: '' })
	return {
		'--dx': `${50 - (bouquet.x + bouquet.w / 2)}cqw`,
		'--dy': `${height / 2 - (bouquet.y + bouquet.h / 2)}cqw`,
		'--extra': bouquet.h / 2,
	}
}

export const keepsakeDateLabel = (date: string | null) => date?.trim() || KEEPSAKE_DATE_PLACEHOLDER

/** Toutes les mesures en pixels pour une carte de `width` px de large ; linéaire en `width`. */
export function keepsakeLayout(
	width: number,
	{ recipient, sender, dateLabel }: { recipient: string; sender: string; dateLabel: string },
): KeepsakeLayout {
	const height = width / CARD_ASPECT
	const bouquetHeight = height * 0.82
	const bouquet = {
		x: width * 0.08,
		y: (height - bouquetHeight) / 2,
		w: bouquetHeight * BOUQUET_ASPECT,
		h: bouquetHeight,
	}

	const cx = width * 0.745
	const maxWidth = width * 0.39
	const nameSize = width * 0.074
	const nameLine = nameSize * 1.12
	const dateSize = width * 0.044
	const gapAbove = width * 0.05
	const gapBelow = width * 0.045
	const top = (height - (2 * nameLine + gapAbove + gapBelow + dateSize)) / 2
	const ruleY = top + 2 * nameLine + gapAbove

	const name = { kind: 'name', cx, size: nameSize, maxWidth, italic: true, weight: 500, tracking: 0.01 } as const
	return {
		width,
		height,
		bouquet,
		items: [
			{ ...name, text: recipient, cy: top + nameLine / 2 },
			{ ...name, text: `& ${sender}`, cy: top + nameLine * 1.5 },
			{
				kind: 'date',
				text: dateLabel,
				cx,
				cy: ruleY + gapBelow + dateSize / 2,
				size: dateSize,
				maxWidth,
				italic: false,
				weight: 500,
				tracking: 0.1,
			},
		],
		rule: { x1: cx - width * 0.03, x2: cx + width * 0.03, y: ruleY },
	}
}
