// Timelines de la fin de l'expérience : conclusion florale, bouquet -> carte, révélation de la carte.
// Uniquement transform, opacity et stroke-dashoffset. Créées dans un gsap.context() par les composants (revert au démontage).
import { FLOWERS } from '../components/bouquet/geometry.ts'
import { gsap } from './motion'
import { ease, finale } from './params'

const part = (root: Element, name: string) => root.querySelector<SVGElement>(`[data-part="${name}"]`)

/** Cinq temps : apparition séparée, rapprochement, tiges qui s'entrelacent, fil doré, composition. Met en pause, au départ. */
export function bouquetTimeline(art: Element, onDone: () => void) {
	const lily = part(art, 'lily')
	const gerbera = part(art, 'gerbera')
	const stems = [part(art, 'stem-lily'), part(art, 'stem-gerbera')]
	const thread = part(art, 'thread')
	const origin = (flower: { cx: number; cy: number }) => `${flower.cx} ${flower.cy}`

	// Départ : fleurs éloignées et invisibles, tiges et fil non dessinés (dasharray et pathLength valent 1 dans le SVG).
	gsap.set(lily, { autoAlpha: 0, x: -130, y: -60, rotation: -7, svgOrigin: origin(FLOWERS.lily) })
	gsap.set(gerbera, { autoAlpha: 0, x: 130, y: 40, rotation: 7, svgOrigin: origin(FLOWERS.gerbera) })
	gsap.set([...stems, thread], { autoAlpha: 0, strokeDashoffset: 1 })

	return gsap
		.timeline({ paused: true, defaults: { ease: ease.paper }, onComplete: onDone })
		.to(lily, { autoAlpha: 1, duration: finale.appear, ease: ease.soft }, 0)
		.to(gerbera, { autoAlpha: 1, duration: finale.appear, ease: ease.soft }, '>0.1')
		.to([lily, gerbera], { x: 0, y: 0, duration: finale.approach }, '>0.25')
		.set(stems, { autoAlpha: 1 })
		.to(stems, { strokeDashoffset: 0, duration: finale.stems, stagger: 0.3, ease: ease.soft }, '>-0.1')
		.set(thread, { autoAlpha: 1 })
		.to(thread, { strokeDashoffset: 0, duration: finale.thread, ease: ease.soft }, '>0.1')
		.to([lily, gerbera], { rotation: 0, duration: finale.settle }, '>-0.3')
}

/** Le bouquet quitte sa pose de scène (centrée, agrandie, par CSS) pour sa place sur la carte. */
export const morphToCard = (art: Element) =>
	gsap.to(art, { x: 0, y: 0, scale: 1, duration: finale.morph, delay: finale.morphDelay, ease: ease.paper })

/** La carte se découvre sous le bouquet : le papier d'abord, puis les lignes de texte. */
export function revealKeepsake(card: Element) {
	const paper = card.querySelector('[data-part="paper"]')
	const lines = card.querySelectorAll('[data-part="text"]')
	const actions = card.parentElement?.querySelector('.keepsake-actions') ?? null
	return gsap
		.timeline({ defaults: { ease: ease.ink } })
		.fromTo(
			paper,
			{ opacity: 0 },
			{ opacity: 1, duration: finale.morph * 0.8, ease: ease.paper },
			finale.morphDelay * 0.5,
		)
		.fromTo(
			lines,
			{ opacity: 0 },
			{ opacity: 1, duration: 1.2, stagger: 0.3 },
			finale.morphDelay + finale.morph * 0.7,
		)
		.fromTo(actions, { opacity: 0 }, { opacity: 1, duration: 1.2 }, '>')
}
