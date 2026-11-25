import { useRef } from 'preact/hooks'
import { ui } from '../../config'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { isAtLeast } from '../../features/experience/reducer'
import { useInkReveal } from '../../hooks/useInkReveal'
import '../../styles/finale.css'
import { Envelope } from '../envelopes/Envelope'
import { PromiseLetter } from './PromiseLetter'
import { WaxSeal } from './WaxSeal'

/** Transition lumineuse, seconde enveloppe bordeaux, puis promesse. Monté dès l'étape LETTER, après la lettre. */
export function SecondEnvelopeSection() {
	const { transition, promise } = useContent()
	const { state, send } = useExperience()
	const root = useRef<HTMLElement>(null)

	useInkReveal(root)

	const opened = isAtLeast(state, 'PROMISE')

	return (
		<section ref={root} id='seconde-enveloppe'>
			<div class='finale-transition'>
				<p class='finale-transition-text' data-ink>
					{transition.content}
				</p>
			</div>
			<div class='envelope-stage'>
				<Envelope
					variant='bordeaux'
					inscription={promise.envelopeText}
					label={`${ui.openEnvelope} : ${promise.envelopeText}`}
					seal={<WaxSeal />}
					opened={opened}
					onOpen={() => send({ type: 'PROMISE_OPENED' })}
				/>
			</div>
			{opened && <PromiseLetter />}
		</section>
	)
}
