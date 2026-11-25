import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
	type AuthConfig,
	clearedCookie,
	createSessionToken,
	loadAuthConfig,
	needsRenewal,
	SESSION_SECONDS,
	sessionCookie,
	verifySessionToken,
} from '../auth/session.js'

const HASH = `scrypt:16384:8:1:c2VsZWxzZWxzZWxzZWxz:${'a'.repeat(43)}`
const OTHER_HASH = `scrypt:16384:8:1:YXV0cmVhdXRyZWF1dHJl:${'b'.repeat(43)}`
const config: AuthConfig = { secret: 's'.repeat(40), passwordHash: HASH }
const NOW = 1_800_000_000

describe('jeton de session', () => {
	it('valide un jeton frais', () => {
		const session = verifySessionToken(createSessionToken(config, NOW), config, NOW + 10)
		assert.deepEqual(session, { iat: NOW, exp: NOW + SESSION_SECONDS })
	})

	it('refuse une signature falsifiée', () => {
		const [v, iat, exp, sig] = createSessionToken(config, NOW).split('.')
		const forged = `${v}.${iat}.${exp}.${sig?.replace(/^./, sig.startsWith('A') ? 'B' : 'A')}`
		assert.equal(verifySessionToken(forged, config, NOW), null)
	})

	it('refuse une expiration prolongée sans nouvelle signature', () => {
		const [v, iat, exp, sig] = createSessionToken(config, NOW).split('.')
		const forged = `${v}.${iat}.${Number(exp) + 1_000_000}.${sig}`
		assert.equal(verifySessionToken(forged, config, NOW), null)
	})

	it('refuse un jeton expiré (365 jours)', () => {
		const token = createSessionToken(config, NOW)
		assert.notEqual(verifySessionToken(token, config, NOW + SESSION_SECONDS - 1), null)
		assert.equal(verifySessionToken(token, config, NOW + SESSION_SECONDS), null)
	})

	it('est invalidé par un changement de secret', () => {
		const token = createSessionToken(config, NOW)
		assert.equal(verifySessionToken(token, { ...config, secret: 't'.repeat(40) }, NOW), null)
	})

	it('est invalidé par un changement de mot de passe (hash)', () => {
		const token = createSessionToken(config, NOW)
		assert.equal(verifySessionToken(token, { ...config, passwordHash: OTHER_HASH }, NOW), null)
	})

	it('refuse les formats invalides', () => {
		for (const token of ['', 'v1', 'v2.1.2.abc', 'v1.a.b.c', `v1.${NOW}.${NOW + 5}.`, 'x'.repeat(5000)]) {
			assert.equal(verifySessionToken(token, config, NOW), null, token.slice(0, 20))
		}
	})

	it('renouvelle seulement après 30 jours', () => {
		assert.equal(needsRenewal(NOW, NOW + 29 * 86_400), false)
		assert.equal(needsRenewal(NOW, NOW + 31 * 86_400), true)
	})
})

describe('cookie de session', () => {
	afterEach(() => {
		delete process.env.VERCEL_ENV
		delete process.env.NODE_ENV
	})

	it('est HttpOnly, SameSite=Strict, Path=/, 365 jours, Secure hors développement', () => {
		process.env.VERCEL_ENV = 'production'
		const cookie = sessionCookie('tok')
		for (const part of [
			'loveship_session=tok',
			'HttpOnly',
			'SameSite=Strict',
			'Path=/',
			'Max-Age=31536000',
			'Secure',
		]) {
			assert.ok(cookie.split('; ').includes(part), `${part} dans ${cookie}`)
		}
	})

	it('omet Secure en développement local', () => {
		assert.ok(!sessionCookie('tok').includes('Secure'))
		process.env.NODE_ENV = 'production'
		assert.ok(sessionCookie('tok').includes('Secure'))
	})

	it('efface le cookie avec Max-Age=0', () => {
		const cookie = clearedCookie()
		assert.ok(cookie.startsWith('loveship_session=;'))
		assert.ok(cookie.includes('Max-Age=0'))
	})
})

describe('configuration', () => {
	const valid = { LOVESHIP_PASSWORD_HASH: config.passwordHash, LOVESHIP_SESSION_SECRET: config.secret }

	it('charge une configuration valide', () => {
		assert.deepEqual(loadAuthConfig(valid), config)
	})

	it('refuse une variable manquante, un secret trop court ou un hash malformé', () => {
		assert.throws(() => loadAuthConfig({ ...valid, LOVESHIP_SESSION_SECRET: undefined }))
		assert.throws(() => loadAuthConfig({ ...valid, LOVESHIP_PASSWORD_HASH: undefined }))
		assert.throws(() => loadAuthConfig({ ...valid, LOVESHIP_SESSION_SECRET: 'court' }))
		assert.throws(() => loadAuthConfig({ ...valid, LOVESHIP_PASSWORD_HASH: 'pas-un-hash' }))
	})
})
