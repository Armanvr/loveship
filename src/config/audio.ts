// Réglages de l'ambiance musicale : seul endroit à ajuster à l'arrivée de la musique.
// Types uniquement importés (testable avec node:test, sans DOM).
import type { AudioLayerId, Mood } from '../types/content.ts'

/** Niveau de chaque couche (0 à 1) selon l'ambiance. Piano et texture portent le début, les nappes la fin. */
export const mix: Record<Mood, Record<AudioLayerId, number>> = {
	playful: { piano: 0.45, texture: 0.3, harmony: 0, pads: 0 },
	tender: { piano: 0.6, texture: 0.3, harmony: 0.25, pads: 0.1 },
	intimate: { piano: 0.6, texture: 0.25, harmony: 0.5, pads: 0.25 },
	admiring: { piano: 0.55, texture: 0.2, harmony: 0.55, pads: 0.5 },
	luminous: { piano: 0.5, texture: 0.15, harmony: 0.5, pads: 0.8 },
}

/** Durées de fondu en secondes. */
export const fade = {
	/** Entrée des couches au démarrage. */
	start: 4,
	/** Passage d'une ambiance à la suivante : long, pour ne jamais s'entendre comme un changement. */
	mood: 6,
	/** Coupure (pause, onglet masqué) et reprise. */
	pause: 0.6,
	resume: 0.8,
	/** Réglage du volume. */
	volume: 0.15,
} as const

export const DEFAULT_VOLUME = 0.6

/** Délai d'inactivité avant de ranger le réglage de volume révélé au toucher. */
export const VOLUME_PANEL_MS = 4000
