import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Mood } from '../../types/content.ts'
import {
	type ExperienceEvent,
	type ExperienceState,
	initialState,
	isAtLeast,
	MOODS,
	reducer,
	STEPS,
	type Step,
} from './reducer.ts'

const run = (state: ExperienceState, ...events: ExperienceEvent[]) => events.reduce(reducer, state)

const FORWARD: ExperienceEvent[] = [
	{ type: 'ENVELOPE_OPENED' },
	{ type: 'LETTER_END_REACHED' },
	{ type: 'PROMISE_OPENED' },
	{ type: 'PROMISE_END_REACHED' },
	{ type: 'BOUQUET_COMPLETED' },
]

describe('moteur narratif : état initial', () => {
	it('commence à INTRODUCTION si l’enveloppe n’a jamais été ouverte', () => {
		assert.equal(initialState(false).step, 'INTRODUCTION')
	})

	it('passe directement à LETTER si l’enveloppe a déjà été ouverte', () => {
		assert.equal(initialState(true).step, 'LETTER')
	})

	it('démarre toujours sur la première ambiance', () => {
		assert.equal(initialState(true).mood, 'playful')
		assert.equal(initialState(false).mood, 'playful')
	})

	it('n’inclut pas l’authentification dans les étapes', () => {
		assert.ok(!(STEPS as readonly string[]).includes('AUTHENTICATION'))
	})
})

describe('moteur narratif : transitions', () => {
	it('suit INTRODUCTION > LETTER > SECOND_ENVELOPE > PROMISE > BOUQUET > KEEPSAKE', () => {
		const seen: Step[] = []
		let state = initialState(false)
		for (const event of FORWARD) {
			state = reducer(state, event)
			seen.push(state.step)
		}
		assert.deepEqual(seen, ['LETTER', 'SECOND_ENVELOPE', 'PROMISE', 'BOUQUET', 'KEEPSAKE'])
	})

	it('chaque événement mène à son étape depuis l’introduction', () => {
		const expected: Step[] = ['LETTER', 'SECOND_ENVELOPE', 'PROMISE', 'BOUQUET', 'KEEPSAKE']
		for (const [i, event] of FORWARD.entries()) {
			assert.equal(reducer(initialState(false), event).step, expected[i])
		}
	})

	it('autorise de sauter des étapes vers l’avant (défilement rapide)', () => {
		assert.equal(run(initialState(true), { type: 'PROMISE_END_REACHED' }).step, 'BOUQUET')
	})
})

describe('moteur narratif : progression uniquement vers l’avant', () => {
	it('ignore un événement répété (même référence d’état)', () => {
		const state = run(initialState(true), { type: 'LETTER_END_REACHED' })
		assert.equal(reducer(state, { type: 'LETTER_END_REACHED' }), state)
	})

	it('ne recule jamais sur un événement hors ordre', () => {
		const atPromise = run(initialState(false), ...FORWARD.slice(0, 3))
		assert.equal(atPromise.step, 'PROMISE')
		for (const late of [FORWARD[0], FORWARD[1], FORWARD[2]] as ExperienceEvent[]) {
			assert.equal(reducer(atPromise, late), atPromise)
		}
	})

	it('ne revient pas de KEEPSAKE, quel que soit l’événement', () => {
		const end = run(initialState(false), ...FORWARD)
		for (const event of FORWARD) assert.equal(reducer(end, event).step, 'KEEPSAKE')
	})

	it('rejoue l’ordre inverse sans jamais baisser de rang', () => {
		let state = initialState(false)
		let best = 0
		for (const event of [...FORWARD].reverse().concat(FORWARD)) {
			state = reducer(state, event)
			const rank = STEPS.indexOf(state.step)
			assert.ok(rank >= best)
			best = rank
		}
		assert.equal(state.step, 'KEEPSAKE')
	})
})

describe('moteur narratif : ambiance monotone', () => {
	it('avance vers une ambiance plus avancée', () => {
		assert.equal(run(initialState(true), { type: 'MOOD_REACHED', mood: 'intimate' }).mood, 'intimate')
	})

	it('ignore une ambiance antérieure ou identique (remonter dans la lettre)', () => {
		const state = run(initialState(true), { type: 'MOOD_REACHED', mood: 'admiring' })
		for (const mood of ['playful', 'tender', 'intimate', 'admiring'] as Mood[]) {
			assert.equal(reducer(state, { type: 'MOOD_REACHED', mood }), state)
		}
	})

	it('accepte de sauter des ambiances', () => {
		assert.equal(run(initialState(true), { type: 'MOOD_REACHED', mood: 'luminous' }).mood, 'luminous')
	})

	it('n’affecte pas l’étape, et l’étape n’affecte pas l’ambiance', () => {
		const withMood = run(initialState(false), { type: 'MOOD_REACHED', mood: 'tender' })
		assert.equal(withMood.step, 'INTRODUCTION')
		assert.equal(run(withMood, ...FORWARD).mood, 'tender')
	})

	it('suit l’ordre déclaré dans MOODS', () => {
		assert.deepEqual([...MOODS], ['playful', 'tender', 'intimate', 'admiring', 'luminous'])
	})
})

describe('moteur narratif : REPLAY', () => {
	it('revient à INTRODUCTION et à la première ambiance, même depuis KEEPSAKE', () => {
		const end = run(initialState(false), ...FORWARD, { type: 'MOOD_REACHED', mood: 'luminous' })
		assert.deepEqual(reducer(end, { type: 'REPLAY' }), { step: 'INTRODUCTION', mood: 'playful' })
	})

	it('autorise ensuite de nouveau la progression', () => {
		const again = run(initialState(false), ...FORWARD, { type: 'REPLAY' }, FORWARD[0] as ExperienceEvent)
		assert.equal(again.step, 'LETTER')
	})
})

describe('moteur narratif : isAtLeast', () => {
	it('compare au rang de l’étape la plus avancée atteinte', () => {
		const state = run(initialState(false), FORWARD[0] as ExperienceEvent, FORWARD[1] as ExperienceEvent)
		assert.equal(state.step, 'SECOND_ENVELOPE')
		assert.ok(isAtLeast(state, 'INTRODUCTION'))
		assert.ok(isAtLeast(state, 'LETTER'))
		assert.ok(isAtLeast(state, 'SECOND_ENVELOPE'))
		assert.ok(!isAtLeast(state, 'PROMISE'))
		assert.ok(!isAtLeast(state, 'KEEPSAKE'))
	})
})
