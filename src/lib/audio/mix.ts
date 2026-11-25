// Décisions pures du moteur audio : aucun import navigateur, testable avec node:test.
import { mix } from '../../config/audio.ts'
import type { AudioLayerId, Mood } from '../../types/content.ts'

export interface LayerSource {
	id: AudioLayerId
	assetId: string
}

type Mix = Record<Mood, Record<AudioLayerId, number>>

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0)

/** Sans couche, aucun contrôle, aucun contexte audio, aucune requête. */
export const hasMusic = (layers: readonly LayerSource[]) => layers.length > 0

/** Une seule source par couche (la première l'emporte) : deux sources de même id se doubleraient. */
export const uniqueLayers = (layers: readonly LayerSource[]) =>
	layers.filter((layer, i) => layers.findIndex((other) => other.id === layer.id) === i)

/** Gain de chaque couche présente pour une ambiance. Les couches absentes du contenu ne figurent pas. */
export function layerGains(
	mood: Mood,
	layerIds: readonly AudioLayerId[],
	table: Mix = mix,
): Partial<Record<AudioLayerId, number>> {
	return Object.fromEntries(layerIds.map((id) => [id, clamp01(table[mood][id])]))
}

/** Volume général perçu : courbe quadratique, plus fine dans les bas niveaux qu'un gain linéaire. */
export const masterGain = (volume: number) => clamp01(volume) ** 2

/** Gain maître visé : silence tant que la lecture est en pause ou l'onglet masqué. */
export const masterTarget = (volume: number, playing: boolean, hidden: boolean) =>
	playing && !hidden ? masterGain(volume) : 0

/** Volume restitué par le réglage (0 à 1) ; une préférence absente ou invalide vaut le défaut. */
export const resolveVolume = (stored: number | null, fallback: number) => clamp01(stored ?? fallback)
