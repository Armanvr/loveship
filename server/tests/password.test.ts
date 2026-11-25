import assert from 'node:assert/strict'
import { randomBytes, scryptSync } from 'node:crypto'
import { describe, it } from 'node:test'
import { hashPassword, isPasswordHash, verifyPassword } from '../auth/password.js'

describe('hachage du mot de passe', () => {
	it('accepte le bon mot de passe', async () => {
		const hash = await hashPassword('un mot de passe')
		assert.equal(await verifyPassword('un mot de passe', hash), true)
	})

	it('refuse un mauvais mot de passe', async () => {
		const hash = await hashPassword('un mot de passe')
		assert.equal(await verifyPassword('un mot de passe ', hash), false)
		assert.equal(await verifyPassword('', hash), false)
	})

	it('encode les paramètres et sale chaque hash', async () => {
		const [a, b] = await Promise.all([hashPassword('x'), hashPassword('x')])
		assert.match(a, /^scrypt:\d+:\d+:\d+:[\w-]+:[\w-]+$/)
		assert.notEqual(a, b)
	})

	it('relit les paramètres depuis la chaîne stockée', async () => {
		const salt = randomBytes(16)
		const key = scryptSync('ancien', salt, 32, { N: 1024, r: 8, p: 1 })
		const stored = `scrypt:1024:8:1:${salt.toString('base64url')}:${key.toString('base64url')}`
		assert.equal(isPasswordHash(stored), true)
		assert.equal(await verifyPassword('ancien', stored), true)
		assert.equal(await verifyPassword('autre', stored), false)
	})

	it('traite un hash malformé comme un échec, sans lever', async () => {
		const [salt, key] = ['c2VsZWxzZWxzZWxzZWxz', 'a'.repeat(43)]
		assert.equal(isPasswordHash(`scrypt:16384:8:1:${salt}:${key}`), true)
		const malformed = [
			'',
			'abc',
			'scrypt:1:2',
			`bcrypt:16384:8:1:${salt}:${key}`,
			`scrypt:16384:8:1:!!!!!!!!:${key}`,
			`scrypt:3:8:1:${salt}:${key}`,
			`scrypt:16385:8:1:${salt}:${key}`,
			`scrypt:99999999999:8:1:${salt}:${key}`,
			`scrypt:16384:0:1:${salt}:${key}`,
			'scrypt:16384:8:1::',
		]
		for (const stored of malformed) {
			assert.equal(isPasswordHash(stored), false, stored)
			assert.equal(await verifyPassword('x', stored), false, stored)
		}
	})

	it('borne la mémoire scrypt (128·N·r ≤ 64 Mio) sans toucher aux paramètres par défaut', async () => {
		const [salt, key] = ['c2VsZWxzZWxzZWxzZWxz', 'a'.repeat(43)]
		const tooCostly = ['1048576:8:1', '32768:32:1', '524288:2:1', '1048576:32:16']
		for (const params of tooCostly) {
			const stored = `scrypt:${params}:${salt}:${key}`
			assert.equal(isPasswordHash(stored), false, stored)
			assert.equal(await verifyPassword('x', stored), false, stored)
		}
		for (const params of ['32768:8:1', '524288:1:1', '1024:32:16'])
			assert.equal(isPasswordHash(`scrypt:${params}:${salt}:${key}`), true, params)
	})
})
