// Reducer pur du moteur narratif : aucun import DOM/GSAP, testable avec node:test.
// L'authentification n'en fait pas partie : l'étape affichée est `authentifié ? state.step : 'AUTHENTICATION'`.
import type { Mood } from '../../types/content.ts'

export const STEPS = ['INTRODUCTION', 'LETTER', 'SECOND_ENVELOPE', 'PROMISE', 'BOUQUET', 'KEEPSAKE'] as const
export type Step = (typeof STEPS)[number]

export const MOODS = ['playful', 'tender', 'intimate', 'admiring', 'luminous'] as const satisfies readonly Mood[]

export interface ExperienceState {
	/** Étape la plus avancée atteinte : ne recule jamais, hors REPLAY. */
	step: Step
	/** Ambiance la plus avancée atteinte (monotone : remonter dans la lettre ne change ni lumière ni musique). */
	mood: Mood
}

export type ExperienceEvent =
	| { type: 'ENVELOPE_OPENED' } // première enveloppe ouverte -> LETTER
	| { type: 'LETTER_END_REACHED' } // fin de la lettre atteinte -> SECOND_ENVELOPE
	| { type: 'PROMISE_OPENED' } // seconde enveloppe ouverte -> PROMISE
	| { type: 'PROMISE_END_REACHED' } // fin de la promesse atteinte -> BOUQUET
	| { type: 'BOUQUET_COMPLETED' } // bouquet achevé -> KEEPSAKE
	| { type: 'MOOD_REACHED'; mood: Mood }
	| { type: 'REPLAY' }

export const rank = (step: Step) => STEPS.indexOf(step)
/** Vrai si l'étape la plus avancée atteinte est `step` ou au-delà. */
export const isAtLeast = (state: ExperienceState, step: Step) => rank(state.step) >= rank(step)

export const initialState = (introductionSeen: boolean): ExperienceState => ({
	step: introductionSeen ? 'LETTER' : 'INTRODUCTION',
	mood: MOODS[0],
})

const TARGET: Record<Exclude<ExperienceEvent['type'], 'MOOD_REACHED' | 'REPLAY'>, Step> = {
	ENVELOPE_OPENED: 'LETTER',
	LETTER_END_REACHED: 'SECOND_ENVELOPE',
	PROMISE_OPENED: 'PROMISE',
	PROMISE_END_REACHED: 'BOUQUET',
	BOUQUET_COMPLETED: 'KEEPSAKE',
}

export function reducer(state: ExperienceState, event: ExperienceEvent): ExperienceState {
	switch (event.type) {
		case 'REPLAY':
			return initialState(false)
		case 'MOOD_REACHED':
			return MOODS.indexOf(event.mood) > MOODS.indexOf(state.mood) ? { ...state, mood: event.mood } : state
		default:
			return rank(TARGET[event.type]) > rank(state.step) ? { ...state, step: TARGET[event.type] } : state
	}
}
