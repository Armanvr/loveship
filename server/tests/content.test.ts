import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { LoveshipContent } from '../../src/types/content.js'
import { isLoveshipContent, referencedAssetIds } from '../content/load.js'
import { placeholderContent } from '../content/placeholder.js'

describe('contenu placeholder', () => {
	const blocks = placeholderContent.letter

	it('est un contenu valide, marqué provisoire', () => {
		assert.equal(placeholderContent.placeholder, true)
		assert.equal(placeholderContent.anniversaryDate, null)
		assert.deepEqual(placeholderContent.audio.layers, [])
		assert.equal(isLoveshipContent(placeholderContent), true)
	})

	it('contient 25 à 35 blocs de texte et les humeurs dans l’ordre', () => {
		const text = blocks.filter((b) => b.type === 'text' || b.type === 'poetry')
		assert.ok(text.length >= 25 && text.length <= 35, String(text.length))
		const moods = text.flatMap((b) => ('mood' in b && b.mood ? [b.mood] : []))
		assert.deepEqual(moods, ['playful', 'tender', 'intimate', 'admiring', 'luminous'])
	})

	it('place six photographies puis cinq aquarelles dans l’ordre du cahier des charges', () => {
		const ids = (type: string) => blocks.flatMap((b) => (b.type === type && 'assetId' in b ? [b.assetId] : []))
		assert.deepEqual(ids('photograph'), [
			'photo-versailles',
			'photo-velo',
			'photo-londres',
			'photo-bretagne',
			'photo-aujourdhui',
			'photo-commencement',
		])
		assert.deepEqual(ids('watercolor'), [
			'aquarelle-repas',
			'aquarelle-film',
			'aquarelle-jeux',
			'aquarelle-astronomie-lego',
			'aquarelle-horizon',
		])
	})

	it('référence les fleurs dans les ressources connues', () => {
		const ids = referencedAssetIds(placeholderContent)
		assert.ok(ids.has('fleur-lys') && ids.has('fleur-gerbera'))
		assert.equal(ids.size, 13)
	})
})

describe('validation du contenu', () => {
	const clone = (): LoveshipContent => structuredClone(placeholderContent)

	it('refuse une forme inattendue', () => {
		assert.equal(isLoveshipContent(null), false)
		assert.equal(isLoveshipContent({}), false)
		const noSender: Record<string, unknown> = { ...clone() }
		delete noSender.sender
		assert.equal(isLoveshipContent(noSender), false)
		const badBlock = clone()
		badBlock.letter.push({ id: 'x', type: 'photograph', assetId: '../secret', alt: 'a' })
		assert.equal(isLoveshipContent(badBlock), false)
		const badLayer = clone()
		badLayer.audio.layers.push({ id: 'violon' as 'piano', assetId: 'x' })
		assert.equal(isLoveshipContent(badLayer), false)
	})

	it('vérifie les dimensions facultatives des images', () => {
		const withSize = (size: Record<string, unknown>) => {
			const content = clone()
			content.letter.push({ id: 'x', type: 'watercolor', assetId: 'aquarelle-repas', alt: 'a', ...size } as never)
			return content
		}
		assert.equal(isLoveshipContent(withSize({ width: 1600, height: 900 })), true)
		for (const bad of [
			{ width: 0 },
			{ height: -1 },
			{ width: '1600' },
			{ height: Number.NaN },
			{ width: Infinity },
		]) {
			assert.equal(isLoveshipContent(withSize(bad)), false, JSON.stringify(bad))
		}
	})

	it('renseigne les dimensions de chaque image du placeholder', () => {
		for (const block of placeholderContent.letter) {
			if (block.type === 'photograph' || block.type === 'watercolor') {
				assert.ok(block.width && block.height, block.assetId)
			}
		}
	})

	it('accepte un contenu définitif bien formé', () => {
		const content = clone()
		content.placeholder = false
		content.anniversaryDate = '1er janvier'
		content.audio.layers = [{ id: 'piano', assetId: 'musique-piano' }]
		assert.equal(isLoveshipContent(content), true)
		assert.ok(referencedAssetIds(content).has('musique-piano'))
	})
})
