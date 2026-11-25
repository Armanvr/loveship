import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AudioLayerId, Mood } from '../../types/content.ts'
import { hasMusic, type LayerSource, layerGains, masterGain, masterTarget, resolveVolume, uniqueLayers } from './mix.ts'

const table = {
	playful: { piano: 0.45, texture: 0.3, harmony: 0, pads: 0 },
	tender: { piano: 2, texture: -1, harmony: Number.NaN, pads: 0.1 },
	intimate: { piano: 0.6, texture: 0.25, harmony: 0.5, pads: 0.25 },
	admiring: { piano: 0.55, texture: 0.2, harmony: 0.55, pads: 0.5 },
	luminous: { piano: 0.5, texture: 0.15, harmony: 0.5, pads: 0.8 },
} satisfies Record<Mood, Record<AudioLayerId, number>>

describe('audio : présence de musique', () => {
	it('sans couche, il n’y a pas de musique (donc ni contrôle ni contexte audio)', () => {
		assert.equal(hasMusic([]), false)
	})

	it('avec au moins une couche, il y a de la musique', () => {
		assert.equal(hasMusic([{ id: 'piano', assetId: 'audio-piano' }]), true)
	})
})

describe('audio : uniqueLayers', () => {
	it('garde la première source quand deux couches ont le même id', () => {
		const layers: LayerSource[] = [
			{ id: 'piano', assetId: 'a' },
			{ id: 'pads', assetId: 'b' },
			{ id: 'piano', assetId: 'c' },
		]
		assert.deepEqual(uniqueLayers(layers), [
			{ id: 'piano', assetId: 'a' },
			{ id: 'pads', assetId: 'b' },
		])
	})

	it('laisse une liste vide ou sans doublon inchangée', () => {
		assert.deepEqual(uniqueLayers([]), [])
		const layers: LayerSource[] = [{ id: 'texture', assetId: 't' }]
		assert.deepEqual(uniqueLayers(layers), layers)
	})
})

describe('audio : layerGains', () => {
	it('ne renvoie que les couches présentes dans le contenu', () => {
		assert.deepEqual(layerGains('intimate', ['piano', 'pads'], table), { piano: 0.6, pads: 0.25 })
	})

	it('renvoie un objet vide sans couche', () => {
		assert.deepEqual(layerGains('luminous', [], table), {})
	})

	it('borne les gains à [0, 1] et ramène NaN à 0', () => {
		assert.deepEqual(layerGains('tender', ['piano', 'texture', 'harmony', 'pads'], table), {
			piano: 1,
			texture: 0,
			harmony: 0,
			pads: 0.1,
		})
	})

	it('utilise la table de mixage réelle par défaut, avec une ambiance qui change les gains', () => {
		const start = layerGains('playful', ['pads'])
		const end = layerGains('luminous', ['pads'])
		assert.ok((end.pads ?? 0) > (start.pads ?? 0))
	})
})

describe('audio : masterGain', () => {
	it('suit une courbe quadratique', () => {
		assert.equal(masterGain(0.5), 0.25)
		assert.equal(masterGain(1), 1)
		assert.equal(masterGain(0), 0)
	})

	it('borne les volumes hors plage et ramène NaN à 0', () => {
		assert.equal(masterGain(-3), 0)
		assert.equal(masterGain(7), 1)
		assert.equal(masterGain(Number.NaN), 0)
	})
})

describe('audio : masterTarget', () => {
	it('vaut le gain maître en lecture sur un onglet visible', () => {
		assert.equal(masterTarget(0.5, true, false), 0.25)
	})

	it('vaut 0 en pause', () => {
		assert.equal(masterTarget(0.9, false, false), 0)
	})

	it('vaut 0 quand l’onglet est masqué', () => {
		assert.equal(masterTarget(0.9, true, true), 0)
	})

	it('vaut 0 si pause et onglet masqué', () => {
		assert.equal(masterTarget(0.9, false, true), 0)
	})
})

describe('audio : resolveVolume', () => {
	it('utilise le défaut quand aucune préférence n’est enregistrée', () => {
		assert.equal(resolveVolume(null, 0.6), 0.6)
	})

	it('restitue la préférence, y compris 0 (silence voulu)', () => {
		assert.equal(resolveVolume(0, 0.6), 0)
		assert.equal(resolveVolume(0.3, 0.6), 0.3)
	})

	it('borne une valeur hors plage', () => {
		assert.equal(resolveVolume(5, 0.6), 1)
		assert.equal(resolveVolume(-1, 0.6), 0)
	})
})
