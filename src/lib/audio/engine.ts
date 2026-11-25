// Moteur Web Audio : couches synchronisées sur une même horloge, fondus par rampes, pause/reprise.
// Indépendant de Preact et du contenu : les buffers viennent d'une source injectable (`loadBuffer`).

import { fade } from '../../config/audio'
import type { Mood } from '../../types/content.ts'
import { assetUrl } from '../api'
import { type LayerSource, layerGains, masterTarget, uniqueLayers } from './mix'

/** Fournit le buffer décodé d'une couche. Peut rejeter : la couche est alors ignorée. */
export type LoadBuffer = (assetId: string, context: AudioContext) => Promise<AudioBuffer>

const fetchBuffer: LoadBuffer = async (assetId, context) => {
	const response = await fetch(assetUrl(assetId), { credentials: 'same-origin' })
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	return context.decodeAudioData(await response.arrayBuffer())
}

export interface AudioEngine {
	/** À appeler dans un geste de l'utilisatrice (autoplay). Idempotent. false : aucune couche n'a pu être chargée. */
	play(): Promise<boolean>
	pause(): void
	setMood(mood: Mood): void
	/** Volume général de 0 à 1. */
	setVolume(volume: number): void
	/** Vrai quand le contexte tourne réellement (faux tant qu'un geste manque). */
	readonly running: boolean
	dispose(): void
}

interface Options {
	layers: readonly LayerSource[]
	mood: Mood
	volume: number
	loadBuffer?: LoadBuffer
}

/** Rampe linéaire depuis la valeur courante : jamais de saut. */
function ramp(param: AudioParam, context: AudioContext, target: number, seconds: number, from = param.value) {
	const now = context.currentTime
	param.cancelScheduledValues(now)
	param.setValueAtTime(from, now)
	param.linearRampToValueAtTime(target, now + seconds)
}

export function createAudioEngine({
	layers: allLayers,
	mood: initialMood,
	volume: initialVolume,
	loadBuffer = fetchBuffer,
}: Options): AudioEngine {
	const layers = uniqueLayers(allLayers)
	let mood = initialMood
	let volume = initialVolume
	let playing = false
	let hidden = document.hidden
	let disposed = false
	let suspendTimer: ReturnType<typeof setTimeout> | undefined

	let context: AudioContext | undefined
	let master: GainNode | undefined
	const gains = new Map<string, GainNode>()
	const sources: AudioBufferSourceNode[] = []
	let loading: Promise<boolean> | undefined

	/** Aligne le contexte et le gain maître sur l'intention courante (lecture voulue, onglet visible). */
	function sync() {
		if (!context || !master || disposed) return
		clearTimeout(suspendTimer)
		const audible = playing && !hidden
		if (audible) {
			if (context.state !== 'running') context.resume().catch(() => {})
			ramp(master.gain, context, masterTarget(volume, playing, hidden), fade.resume)
		} else {
			ramp(master.gain, context, 0, fade.pause)
			// Suspendre après le fondu : le processeur audio s'arrête vraiment (batterie, onglet masqué).
			suspendTimer = setTimeout(() => context?.suspend().catch(() => {}), fade.pause * 1000 + 50)
		}
	}

	function applyMood(seconds: number) {
		if (!context) return
		const targets = layerGains(
			mood,
			layers.map((layer) => layer.id),
		)
		for (const [id, gain] of gains) ramp(gain.gain, context, targets[id as keyof typeof targets] ?? 0, seconds)
	}

	async function load(ctx: AudioContext) {
		const results = await Promise.allSettled(layers.map(async (layer) => loadBuffer(layer.assetId, ctx)))
		if (disposed) return false
		// Une couche en échec est ignorée : l'expérience continue avec les autres, ou en silence.
		const loaded = layers.flatMap((layer, i) => {
			const result = results[i]
			return result?.status === 'fulfilled' ? [{ id: layer.id, buffer: result.value }] : []
		})
		if (loaded.length === 0) return false

		// Horloge commune : tous les départs sont planifiés au même instant, les boucles tournent ensuite sans dérive.
		const t0 = ctx.currentTime + 0.15
		for (const { id, buffer } of loaded) {
			const source = ctx.createBufferSource()
			source.buffer = buffer
			source.loop = true
			const gain = gains.get(id)
			if (!gain) continue
			source.connect(gain)
			source.start(t0)
			sources.push(source)
			// Entrée en fondu depuis le silence, sans toucher aux couches qui échouent.
			ramp(gain.gain, ctx, layerGains(mood, [id])[id] ?? 0, fade.start, 0)
		}
		return true
	}

	function onVisibility() {
		hidden = document.hidden
		sync()
	}
	document.addEventListener('visibilitychange', onVisibility)

	return {
		play() {
			playing = true
			if (disposed) return Promise.resolve(false)
			if (!context) {
				// Le contexte naît ici, dans le geste. resume() est appelé de façon synchrone (Safari iOS l'exige).
				context = new AudioContext({ latencyHint: 'playback' })
				// iOS : sans cela le commutateur silencieux coupe le Web Audio.
				const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
				if (session) session.type = 'playback'
				master = context.createGain()
				master.gain.value = 0
				master.connect(context.destination)
				for (const { id } of layers) {
					const gain = context.createGain()
					gain.gain.value = 0
					gain.connect(master)
					gains.set(id, gain)
				}
				loading = load(context)
			}
			sync()
			// biome-ignore lint/style/noNonNullAssertion: `loading` est posé avec le contexte
			return loading!
		},
		pause() {
			playing = false
			sync()
		},
		setMood(next) {
			mood = next
			applyMood(fade.mood)
		},
		setVolume(next) {
			volume = next
			if (context && master && playing && !hidden)
				ramp(master.gain, context, masterTarget(volume, playing, hidden), fade.volume)
		},
		get running() {
			return context?.state === 'running' && playing && !hidden
		},
		dispose() {
			disposed = true
			clearTimeout(suspendTimer)
			document.removeEventListener('visibilitychange', onVisibility)
			for (const source of sources) {
				try {
					source.stop()
				} catch {
					// déjà arrêtée
				}
			}
			context?.close().catch(() => {})
		},
	}
}
