import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { revealKeepsake } from '../../animations/finale'
import { gsap, prefersReducedMotion } from '../../animations/motion'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { isAtLeast } from '../../features/experience/reducer'
import { deliverKeepsake, renderKeepsake } from '../../lib/keepsake-export'
import { keepsakeDateLabel, keepsakeLayout, stageVars } from '../../lib/keepsake-layout'
import '../../styles/finale.css'
import { keepsakeCopy } from '../../config'

type Status = 'idle' | 'working' | 'done' | 'error'

const vars = stageVars()
// L'export est préparé en avance, une fois la carte posée : le partage natif exige un geste récent, et le rendu
// ne doit pas tomber au milieu de la transition.
const PREPARE_DELAY_MS = 4500

/** Carte souvenir : conclusion définitive, aucun message après elle. Le bouquet (scène) vient s'y poser à gauche. */
export function Keepsake() {
	const { recipient, sender, anniversaryDate, bouquet } = useContent()
	const dateLabel = keepsakeDateLabel(anniversaryDate)
	const layout = keepsakeLayout(100, { recipient, sender, dateLabel }) // en cqw : 1 = 1 % de la largeur de la carte
	const card = useRef<HTMLDivElement>(null)
	const prepared = useRef<Promise<Blob> | null>(null)
	const [status, setStatus] = useState<Status>('idle')
	const [preview, setPreview] = useState<string | null>(null)

	// Monté dès BOUQUET, mais la carte ne se découvre qu'une fois le bouquet achevé (KEEPSAKE).
	const ready = isAtLeast(useExperience().state, 'KEEPSAKE')

	useLayoutEffect(() => {
		if (!ready || prefersReducedMotion() || !card.current) return
		const context = gsap.context(() => void revealKeepsake(card.current as HTMLDivElement), card.current)
		return () => context.revert()
	}, [ready])

	const prepare = () => {
		prepared.current ??= renderKeepsake({
			recipient,
			sender,
			dateLabel,
			lilyId: bouquet.lily.assetId,
			gerberaId: bouquet.gerbera.assetId,
		}).catch((error) => {
			prepared.current = null // la prochaine demande retente
			throw error
		})
		return prepared.current
	}

	useEffect(() => {
		if (!ready) return
		const timer = setTimeout(() => prepare().catch(() => {}), PREPARE_DELAY_MS)
		return () => clearTimeout(timer)
	}, [ready])

	useEffect(() => {
		if (!preview) return
		return () => URL.revokeObjectURL(preview)
	}, [preview])

	const save = async () => {
		setStatus('working')
		try {
			const blob = await prepare()
			const outcome = await deliverKeepsake(blob)
			if (outcome === 'preview') setPreview(URL.createObjectURL(blob))
			setStatus(outcome === 'cancelled' ? 'idle' : 'done')
		} catch {
			setStatus('error')
		}
	}

	const message = {
		idle: '',
		working: keepsakeCopy.saving,
		done: preview ? '' : keepsakeCopy.saved,
		error: keepsakeCopy.error,
	}[status]

	return (
		<section
			id='souvenir'
			aria-label={keepsakeCopy.region}
			class='finale-frame keepsake'
			data-ready={ready || undefined}
			aria-hidden={ready ? undefined : 'true'}
			style={vars}
		>
			<div ref={card} class='finale-stage'>
				<div data-part='paper' class='keepsake-paper' aria-hidden='true' />
				<span
					data-part='text'
					aria-hidden='true'
					class='keepsake-rule'
					style={{
						left: `${layout.rule.x1}cqw`,
						width: `${layout.rule.x2 - layout.rule.x1}cqw`,
						top: `${layout.rule.y}cqw`,
					}}
				/>
				{layout.items.map((item) => (
					<p
						key={item.text}
						data-part='text'
						data-kind={item.kind}
						class='keepsake-line'
						style={{
							left: `${item.cx - item.maxWidth / 2}cqw`,
							width: `${item.maxWidth}cqw`,
							top: `${item.cy - item.size / 2}cqw`,
							height: `${item.size}cqw`,
							fontSize: `${item.size}cqw`,
							fontStyle: item.italic ? 'italic' : 'normal',
							fontWeight: item.weight,
							letterSpacing: `${item.tracking}em`,
						}}
					>
						{item.text}
					</p>
				))}
			</div>
			<div class='keepsake-actions'>
				<button type='button' class='text-action' onClick={save} disabled={status === 'working'}>
					{status === 'error' ? keepsakeCopy.retry : keepsakeCopy.save}
				</button>
				{/* La confirmation de succès n'est qu'annoncée (lecteurs d'écran) : aucun texte visible après la carte. */}
				<p class={status === 'done' && !preview ? 'sr-only' : 'keepsake-status'} role='status'>
					{message}
				</p>
				{preview && (
					<>
						<img class='keepsake-preview' src={preview} alt={keepsakeCopy.previewAlt} />
						<p class='keepsake-status'>{keepsakeCopy.pressHold}</p>
					</>
				)}
			</div>
		</section>
	)
}
