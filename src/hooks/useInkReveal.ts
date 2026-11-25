import type { RefObject } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import { gsap, NO_PREFERENCE, ScrollTrigger } from '../animations/motion'
import { distance, duration, ease, REVEAL_START } from '../animations/params'

/**
 * Révélation « encre sur papier » des éléments `[data-ink]` du conteneur, au défilement.
 * Le contenu est lisible par défaut : l'état masqué n'est posé que par GSAP, une fois prêt, et jamais en
 * prefers-reduced-motion. `once` : ce qui est découvert ne disparaît jamais, même en remontant.
 */
export function useInkReveal(container: RefObject<HTMLElement | null>) {
	useLayoutEffect(() => {
		const root = container.current
		if (!root) return
		const mm = gsap.matchMedia()
		mm.add(NO_PREFERENCE, () => {
			for (const element of root.querySelectorAll<HTMLElement>('[data-ink]')) {
				gsap.fromTo(
					element,
					{ opacity: 0, y: distance.reveal, filter: `blur(${distance.blur}px)` },
					{
						opacity: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: duration.reveal,
						ease: ease.ink,
						clearProps: 'filter,transform,opacity',
						scrollTrigger: { trigger: element, start: REVEAL_START, once: true },
					},
				)
			}
		})
		return () => {
			mm.revert()
			ScrollTrigger.refresh()
		}
	}, [container])
}
