import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { KEEPSAKE_DATE_PLACEHOLDER } from '../config/index.ts'
import { keepsakeDateLabel, keepsakeLayout } from './keepsake-layout.ts'

const texts = { recipient: 'Victoria', sender: 'Arman', dateLabel: 'date à venir' }

describe('carte souvenir : géométrie', () => {
	it('reste horizontale en 3:2 et se met à l’échelle linéairement', () => {
		const big = keepsakeLayout(2400, texts)
		const small = keepsakeLayout(1200, texts)
		assert.equal(big.height, 1600)
		assert.equal(small.height, 800)
		assert.equal(big.bouquet.x, small.bouquet.x * 2)
		assert.equal(big.bouquet.h, small.bouquet.h * 2)
		assert.equal(big.items[0]?.size, (small.items[0]?.size ?? 0) * 2)
	})

	it('place le bouquet à gauche, entièrement dans la carte, en 3:4', () => {
		const { width, height, bouquet } = keepsakeLayout(2400, texts)
		assert.ok(bouquet.x > 0 && bouquet.x + bouquet.w < width / 2)
		assert.ok(bouquet.y > 0 && bouquet.y + bouquet.h < height)
		assert.ok(Math.abs(bouquet.w / bouquet.h - 3 / 4) < 1e-9)
	})

	it('place tout le texte à droite du bouquet, dans la carte, centré verticalement', () => {
		const { width, height, bouquet, items, rule } = keepsakeLayout(2400, texts)
		for (const item of items) {
			assert.ok(item.cx - item.maxWidth / 2 >= bouquet.x + bouquet.w)
			assert.ok(item.cx + item.maxWidth / 2 <= width)
			assert.ok(item.cy > 0 && item.cy < height)
		}
		const top = Math.min(...items.map((item) => item.cy - item.size / 2))
		const bottom = Math.max(...items.map((item) => item.cy + item.size / 2))
		assert.ok(Math.abs((top + bottom) / 2 - height / 2) < height * 0.03)
		assert.ok(rule.y > (items[1]?.cy ?? 0) && rule.y < (items[2]?.cy ?? 0))
	})

	it('ne contient que le nom du destinataire, l’esperluette avec l’expéditeur et la date', () => {
		const { items } = keepsakeLayout(2400, texts)
		assert.deepEqual(
			items.map((item) => item.text),
			['Victoria', '& Arman', 'date à venir'],
		)
	})
})

describe('carte souvenir : date', () => {
	it('affiche la date fournie telle quelle', () => {
		assert.equal(keepsakeDateLabel('14 février 2026'), '14 février 2026')
	})

	it('retombe sur le libellé provisoire explicite quand la date est absente ou vide', () => {
		assert.equal(keepsakeDateLabel(null), KEEPSAKE_DATE_PLACEHOLDER)
		assert.equal(keepsakeDateLabel('   '), KEEPSAKE_DATE_PLACEHOLDER)
	})
})
