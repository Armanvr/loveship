import { useEffect, useRef } from 'preact/hooks'
import { gsap, prefersReducedMotion } from '../../animations/motion'
import { duration, ease } from '../../animations/params'
import { ui } from '../../config'
import { useContent } from '../../contexts/content'
import { useSession } from '../../features/authentication/session'
import { useExperience } from '../../features/experience/context'
import { Envelope } from './Envelope'

/**
 * Première enveloppe, posée en plein écran par-dessus la page. À l'ouverture, la lettre est déjà montée dessous :
 * l'enveloppe se retire et le papier se découvre, sans rupture. `onDone` signale que l'overlay peut être démonté.
 */
export function IntroOverlay({ onDone }: { onDone: () => void }) {
	const { introduction } = useContent()
	const { send } = useExperience()
	const { logout } = useSession()
	const overlay = useRef<HTMLDivElement>(null)
	const group = useRef<HTMLDivElement>(null)
	const timeline = useRef<gsap.core.Timeline>(null)

	useEffect(() => {
		// Le focus va sur l'enveloppe (premier bouton) : à l'arrivée comme après « Relire depuis le début ».
		overlay.current?.querySelector('button')?.focus({ preventScroll: true })
		return () => void timeline.current?.kill()
	}, [])

	const handover = () => {
		send({ type: 'ENVELOPE_OPENED' })
		if (overlay.current) overlay.current.style.pointerEvents = 'none'
		// reduced-motion : aucun mouvement, la lettre est simplement découverte. Différé : onDone donne le focus à
		// #lettre, qui n'est monté qu'après le rendu déclenché par ENVELOPE_OPENED.
		if (prefersReducedMotion()) return void setTimeout(onDone, 0)
		// Préférence lue une fois : un changement en cours de retrait ne doit pas laisser l'overlay figé sur la lettre.
		timeline.current = gsap
			.timeline({ defaults: { ease: ease.paper }, onComplete: onDone })
			.to(group.current, { y: 48, opacity: 0, duration: duration.handover * 0.7 }, 0)
			.to(overlay.current, { opacity: 0, duration: duration.handover }, 0.25)
	}

	return (
		<div ref={overlay} class='paper fixed inset-0 z-40 grid place-items-center overflow-hidden'>
			<div ref={group} class='flex flex-col items-center gap-14 pt-[12svh]'>
				<Envelope
					variant='ivory'
					inscription={introduction.envelopeText}
					label={ui.openEnvelope}
					onOpen={handover}
				/>
				<p aria-hidden='true' class='font-display text-lg italic text-ink/55'>
					{ui.openEnvelope}
				</p>
			</div>
			<button
				type='button'
				class='text-action absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))]'
				onClick={logout}
			>
				{ui.logout}
			</button>
		</div>
	)
}
