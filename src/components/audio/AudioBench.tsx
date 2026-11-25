// Banc d'essai audio : DÉVELOPPEMENT UNIQUEMENT (chargé par import() derrière import.meta.env.DEV, absent du build).
// Couches synthétiques rendues par OfflineAudioContext : aucun fichier, aucune requête, aucune musique externe.
// `?audio-bench&fail` simule l'échec de la couche texture (elle doit être ignorée, le reste continue).
import { useEffect, useState } from 'preact/hooks'
import { mix } from '../../config/audio'
import { type AudioEngine, createAudioEngine, type LoadBuffer } from '../../lib/audio/engine'
import { type LayerSource, layerGains, masterGain } from '../../lib/audio/mix'
import type { AudioLayerId, Mood } from '../../types/content.ts'

const RATE = 32000
const LOOP = 8 // secondes ; les quatre couches bouclent sur la même durée pour que la synchro s'entende
const LAYERS: LayerSource[] = (['piano', 'texture', 'harmony', 'pads'] as const).map((id) => ({
	id,
	assetId: `bench-${id}`,
}))
const MOODS = Object.keys(mix) as Mood[]

const note = (
	ctx: OfflineAudioContext,
	freq: number,
	at: number,
	length: number,
	level: number,
	type: OscillatorType,
) => {
	const osc = ctx.createOscillator()
	const gain = ctx.createGain()
	osc.type = type
	osc.frequency.value = freq
	gain.gain.setValueAtTime(0, at)
	gain.gain.linearRampToValueAtTime(level, at + 0.02)
	gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
	osc.connect(gain).connect(ctx.destination)
	osc.start(at)
	osc.stop(at + length)
}

const SYNTH: Record<AudioLayerId, (ctx: OfflineAudioContext) => void> = {
	// Une note toutes les 2 s : repère net pour entendre que les couches partent ensemble.
	piano: (ctx) => {
		for (const [i, freq] of [220, 277.18, 329.63, 440].entries()) note(ctx, freq, i * 2, 1.9, 0.5, 'triangle')
	},
	// Souffle filtré, très léger.
	texture: (ctx) => {
		const buffer = ctx.createBuffer(1, RATE * LOOP, RATE)
		for (const [i] of buffer.getChannelData(0).entries()) buffer.getChannelData(0)[i] = Math.random() - 0.5
		const source = ctx.createBufferSource()
		const filter = ctx.createBiquadFilter()
		source.buffer = buffer
		filter.type = 'bandpass'
		filter.frequency.value = 2400
		source.connect(filter).connect(ctx.destination)
		source.start()
	},
	// Deux accords de 4 s, enveloppe nulle aux jointures (boucle sans clic).
	harmony: (ctx) => {
		for (const [i, chord] of [
			[261.63, 329.63, 392],
			[246.94, 311.13, 369.99],
		].entries())
			for (const freq of chord) note(ctx, freq, i * 4, 3.9, 0.15, 'sine')
	},
	// Nappe lente : un souffle unique sur 8 s.
	pads: (ctx) => {
		for (const freq of [110, 164.81, 329.63]) {
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			osc.frequency.value = freq
			gain.gain.setValueAtTime(0, 0)
			gain.gain.linearRampToValueAtTime(0.25, LOOP / 2)
			gain.gain.linearRampToValueAtTime(0, LOOP)
			osc.connect(gain).connect(ctx.destination)
			osc.start(0)
			osc.stop(LOOP)
		}
	},
}

const loadSynthetic: LoadBuffer = async (assetId) => {
	if (assetId === 'bench-texture' && new URLSearchParams(location.search).has('fail')) throw new Error('échec simulé')
	const ctx = new OfflineAudioContext(1, RATE * LOOP, RATE)
	SYNTH[assetId.replace('bench-', '') as AudioLayerId](ctx)
	return ctx.startRendering()
}

const button = 'min-h-11 rounded border border-bordeaux px-4 aria-pressed:bg-bordeaux aria-pressed:text-ivory'

export function AudioBench() {
	const [mood, setMood] = useState<Mood>('playful')
	const [volume, setVolume] = useState(0.6)
	const [playing, setPlaying] = useState(false)
	const [status, setStatus] = useState('arrêté')
	const [engine] = useState<AudioEngine>(() =>
		createAudioEngine({ layers: LAYERS, mood: 'playful', volume: 0.6, loadBuffer: loadSynthetic }),
	)
	useEffect(() => () => engine.dispose(), [engine])

	const toggle = () => {
		if (playing) {
			engine.pause()
			setStatus('en pause')
		} else {
			setStatus('chargement')
			engine.play().then((ok) => setStatus(ok ? 'lecture' : 'aucune couche chargée'))
		}
		setPlaying(!playing)
	}

	const gains = layerGains(
		mood,
		LAYERS.map((layer) => layer.id),
	)
	return (
		<main class='mx-auto flex max-w-letter flex-col gap-6 p-6 font-text'>
			<h1 class='font-display text-3xl'>Banc d’essai audio (dev)</h1>
			<p>
				État : {status}. Boucle de {LOOP} s, un piano toutes les 2 s (repère de synchro).
			</p>
			<button type='button' class={button} aria-pressed={playing} onClick={toggle}>
				{playing ? 'Pause' : 'Lecture'}
			</button>
			<fieldset class='flex flex-wrap gap-2'>
				<legend class='sr-only'>Ambiance</legend>
				{MOODS.map((m) => (
					<button
						type='button'
						key={m}
						class={button}
						aria-pressed={mood === m}
						onClick={() => {
							setMood(m)
							engine.setMood(m)
						}}
					>
						{m}
					</button>
				))}
			</fieldset>
			<label class='flex items-center gap-3'>
				Volume
				<input
					type='range'
					min={0}
					max={1}
					step={0.01}
					value={volume}
					class='h-11 flex-1 accent-bordeaux'
					onInput={(event) => {
						setVolume(event.currentTarget.valueAsNumber)
						engine.setVolume(event.currentTarget.valueAsNumber)
					}}
				/>
				<output>{masterGain(volume).toFixed(2)}</output>
			</label>
			<ul class='font-mono text-sm'>
				{Object.entries(gains).map(([id, gain]) => (
					<li key={id}>
						{id} : {gain?.toFixed(2)}
					</li>
				))}
			</ul>
		</main>
	)
}
