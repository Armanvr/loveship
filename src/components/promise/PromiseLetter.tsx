import { useEffect, useRef } from 'preact/hooks'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { useInkReveal } from '../../hooks/useInkReveal'
import { useOnReach } from '../../hooks/useOnReach'
import '../../styles/finale.css'
import { split } from '../letter/Letter'

/** La promesse intime : colonne étroite, grand air, signature. Monté à l'ouverture de la seconde enveloppe. */
export function PromiseLetter() {
	const { promise } = useContent()
	const { send } = useExperience()
	const root = useRef<HTMLElement>(null)
	const end = useRef<HTMLDivElement>(null)

	useInkReveal(root)
	useOnReach(end, () => send({ type: 'PROMISE_END_REACHED' }), '0px 0px -10% 0px')
	// Le texte reçoit le focus (lecteurs d'écran, clavier) sans faire sauter le défilement.
	useEffect(() => root.current?.focus({ preventScroll: true }), [])

	return (
		<article ref={root} id='promesse' tabIndex={-1} aria-label={promise.envelopeText} class='promise'>
			{split(promise.content).map((paragraph, index) => (
				<p key={index} class='promise-text' data-ink>
					{paragraph}
				</p>
			))}
			<p class='promise-signature' data-ink>
				{promise.signature}
			</p>
			<div ref={end} aria-hidden='true' class='h-px' />
		</article>
	)
}
