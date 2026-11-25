import type { RefObject } from 'preact'
import { useEffect } from 'preact/hooks'

/**
 * Appelle `callback` une seule fois quand l'élément entre dans la zone `rootMargin` du viewport.
 * Indépendant des animations : fonctionne aussi en prefers-reduced-motion.
 */
export function useOnReach(
	target: RefObject<Element | null>,
	callback: () => void,
	rootMargin = '0px 0px -30% 0px',
	enabled = true,
) {
	useEffect(() => {
		const element = target.current
		if (!element || !enabled) return
		const observer = new IntersectionObserver(
			(entries) => {
				// « atteint » = dans la zone ou déjà dépassé (défilement rapide, rechargement en milieu de page)
				if (
					entries.some(
						(entry) => entry.isIntersecting || entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
					)
				) {
					observer.disconnect()
					callback()
				}
			},
			{ rootMargin },
		)
		observer.observe(element)
		return () => observer.disconnect()
	}, [target, rootMargin, enabled])
}
