import { useEffect, useRef, useState } from 'preact/hooks'
import { DEFAULT_VOLUME, VOLUME_PANEL_MS } from '../../config/audio'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { createAudioEngine } from '../../lib/audio/engine'
import { hasMusic, type LayerSource, resolveVolume } from '../../lib/audio/mix'
import { storage } from '../../lib/storage'

// Gestes volontaires qui débloquent l'audio (iOS ne compte ni pointerdown ni un glissement de défilement).
const GESTURES = ['pointerup', 'touchend', 'keydown'] as const

/** Contrôle flottant de la musique. Sans couche audio dans le contenu : rien n'est rendu, rien n'est créé. */
export function AudioControl() {
	const { layers } = useContent().audio
	return hasMusic(layers) ? <MusicControl layers={layers} /> : null
}

function MusicControl({ layers }: { layers: LayerSource[] }) {
	const { state } = useExperience()
	const [enabled, setEnabled] = useState(storage.getAudioEnabled)
	const [volume, setVolume] = useState(() => resolveVolume(storage.getAudioVolume(), DEFAULT_VOLUME))
	// Horodatage de la dernière interaction : révèle le volume au toucher, puis le range après un temps d'inactivité.
	const [touched, setTouched] = useState(0)
	const root = useRef<HTMLDivElement>(null)
	// Le moteur ne crée aucun AudioContext avant play() : le construire ici est sans effet audible ni réseau.
	const [engine] = useState(() => createAudioEngine({ layers, mood: state.mood, volume }))

	useEffect(() => () => engine.dispose(), [engine])
	useEffect(() => engine.setMood(state.mood), [engine, state.mood])

	// Préférence « activée » mémorisée : la lecture ne démarre qu'au premier geste sur la page, jamais seule.
	useEffect(() => {
		if (!enabled) return
		const stop = () => {
			for (const type of GESTURES) window.removeEventListener(type, onGesture, true)
		}
		const onGesture = (event: Event) => {
			if (root.current?.contains(event.target as Node)) return // le bouton gère son propre geste
			engine.play().then((ok) => ok && engine.running && stop())
		}
		for (const type of GESTURES) window.addEventListener(type, onGesture, true)
		return stop
	}, [enabled, engine])

	useEffect(() => {
		if (!touched) return
		const timer = setTimeout(() => setTouched(0), VOLUME_PANEL_MS)
		return () => clearTimeout(timer)
	}, [touched])

	const toggle = () => {
		const next = !enabled
		setEnabled(next)
		storage.setAudioEnabled(next)
		setTouched(Date.now())
		if (next) engine.play().then((ok) => ok || setEnabled(false))
		else engine.pause()
	}

	const changeVolume = (value: number) => {
		setVolume(value)
		setTouched(Date.now())
		engine.setVolume(value)
		storage.setAudioVolume(value)
	}

	return (
		<div
			ref={root}
			class='group fixed z-40 flex items-center gap-1 bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]'
		>
			{enabled && (
				<div
					data-open={touched ? '' : undefined}
					class='pointer-events-none flex h-11 items-center rounded-full border border-champagne bg-ivory px-4 opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 data-open:pointer-events-auto data-open:opacity-100'
				>
					<input
						type='range'
						min={0}
						max={1}
						step={0.01}
						value={volume}
						aria-label='Volume de la musique'
						class='h-11 w-28 accent-bordeaux'
						onInput={(event) => changeVolume(event.currentTarget.valueAsNumber)}
					/>
				</div>
			)}
			<button
				type='button'
				aria-pressed={enabled}
				aria-label={enabled ? 'Couper la musique' : 'Activer la musique'}
				onClick={toggle}
				class='grid size-11 place-items-center rounded-full border border-champagne bg-ivory text-bordeaux shadow-print transition-colors hover:bg-ivory-deep motion-reduce:transition-none'
			>
				<svg
					viewBox='0 0 24 24'
					width='22'
					height='22'
					fill='none'
					stroke='currentColor'
					stroke-width='1.25'
					stroke-linecap='round'
					stroke-linejoin='round'
					aria-hidden='true'
				>
					<path d='M4 9.5h3.5L12 6v12l-4.5-3.5H4z' />
					{enabled ? (
						<path d='M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11' />
					) : (
						<path d='M16 10l4 4m0-4l-4 4' />
					)}
				</svg>
			</button>
		</div>
	)
}
