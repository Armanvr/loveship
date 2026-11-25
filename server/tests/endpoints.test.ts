import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'
import { GET as assets } from '../../api/assets.js'
import { POST as login } from '../../api/auth/login.js'
import { POST as logout } from '../../api/auth/logout.js'
import { GET as session } from '../../api/auth/session.js'
import { GET as content } from '../../api/content.js'
import { relayBlob } from '../content/assets.js'
import { loginRequest, request, sessionCookieHeader, setupEnv, TEST_PASSWORD } from './helpers.js'

const password = (value: unknown) => JSON.stringify({ password: value })

before(setupEnv)

describe('POST /api/auth/login', () => {
	it('répond 204 avec un cookie de session durci', async () => {
		const response = await login(loginRequest(password(TEST_PASSWORD)))
		assert.equal(response.status, 204)
		const cookie = response.headers.get('set-cookie') ?? ''
		assert.match(cookie, /^loveship_session=v1\.\d+\.\d+\.[\w-]+;/)
		for (const part of ['HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=31536000'])
			assert.ok(cookie.includes(part), part)
		assert.equal(response.headers.get('cache-control'), 'private, no-store')
	})

	it('répond 401 identique quel que soit l’échec', async () => {
		const wrong = await login(loginRequest(password('mauvais')))
		const other = await login(loginRequest(password('autre chose')))
		assert.equal(wrong.status, 401)
		assert.equal(await wrong.text(), await other.text())
		assert.equal(wrong.headers.get('set-cookie'), null)
	})

	it('répond 400 pour un corps invalide', async () => {
		const bad = [
			loginRequest('pas du json'),
			loginRequest(password(42)),
			loginRequest(password('')),
			loginRequest(password('x'.repeat(257))),
			loginRequest(`{"password":"${'x'.repeat(5000)}"}`),
			loginRequest(password(TEST_PASSWORD), { 'content-type': 'text/plain' }),
			loginRequest(password(TEST_PASSWORD), { 'content-type': 'application/x-www-form-urlencoded' }),
		]
		for (const r of bad) assert.equal((await login(r)).status, 400)
	})

	it('refuse une requête cross-site', async () => {
		const sec = await login(loginRequest(password(TEST_PASSWORD), { 'sec-fetch-site': 'cross-site' }))
		const origin = await login(loginRequest(password(TEST_PASSWORD), { origin: 'https://evil.example' }))
		assert.equal(sec.status, 403)
		assert.equal(origin.status, 403)
		const same = await login(
			loginRequest(password(TEST_PASSWORD), { 'sec-fetch-site': 'same-origin', origin: 'http://localhost' }),
		)
		assert.equal(same.status, 204)
	})

	it('répond 503 sans exécuter scrypt au-delà de 4 vérifications simultanées, puis revient à la normale', async () => {
		const done: number[] = []
		const attempts = Array.from({ length: 6 }, () =>
			login(loginRequest(password(TEST_PASSWORD))).then((response) => {
				done.push(response.status)
				return response
			}),
		)
		const responses = await Promise.all(attempts)
		const statuses = responses.map((r) => r.status)
		assert.equal(statuses.filter((s) => s === 204).length, 4)
		assert.equal(statuses.filter((s) => s === 503).length, 2)
		// Les refus sortent avant la fin du moindre scrypt : ils n'en ont donc lancé aucun.
		assert.deepEqual(done.slice(0, 2), [503, 503])
		const busy = responses.find((r) => r.status === 503) as Response
		assert.equal(busy.headers.get('retry-after'), '2')
		assert.equal(busy.headers.get('cache-control'), 'private, no-store')
		assert.equal(busy.headers.get('set-cookie'), null)
		assert.equal((await login(loginRequest(password(TEST_PASSWORD)))).status, 204)
		assert.equal((await login(loginRequest(password('mauvais')))).status, 401)
	})

	it('répond 500 générique si la configuration est incomplète', async () => {
		const saved = process.env.LOVESHIP_SESSION_SECRET
		process.env.LOVESHIP_SESSION_SECRET = 'trop court'
		const response = await login(loginRequest(password(TEST_PASSWORD)))
		process.env.LOVESHIP_SESSION_SECRET = saved
		assert.equal(response.status, 500)
		const body = await response.text()
		assert.ok(!body.includes('trop court') && !body.includes('LOVESHIP'))
	})
})

describe('POST /api/auth/logout', () => {
	it('efface le cookie', async () => {
		const response = await logout(request('/api/auth/logout', { method: 'POST' }))
		assert.equal(response.status, 204)
		const cookie = response.headers.get('set-cookie') ?? ''
		assert.ok(cookie.startsWith('loveship_session=;') && cookie.includes('Max-Age=0'))
	})

	it('refuse une requête cross-site', async () => {
		const response = await logout(
			request('/api/auth/logout', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } }),
		)
		assert.equal(response.status, 403)
	})
})

describe('GET /api/auth/session', () => {
	it('répond 401 sans cookie, avec un jeton falsifié ou expiré', async () => {
		const day = 86_400
		const old = Math.floor(Date.now() / 1000) - 366 * day
		for (const cookie of [undefined, 'loveship_session=v1.1.2.AAAA', sessionCookieHeader(old)]) {
			const response = await session(request('/api/auth/session', { cookie }))
			assert.equal(response.status, 401)
			assert.deepEqual(await response.json(), { authenticated: false })
		}
	})

	it('répond 200 sans renouveler un jeton récent', async () => {
		const response = await session(request('/api/auth/session', { cookie: sessionCookieHeader() }))
		assert.equal(response.status, 200)
		assert.deepEqual(await response.json(), { authenticated: true })
		assert.equal(response.headers.get('set-cookie'), null)
		assert.equal(response.headers.get('cache-control'), 'private, no-store')
	})

	it('réémet un cookie de 365 jours quand le jeton a plus de 30 jours', async () => {
		const iat = Math.floor(Date.now() / 1000) - 40 * 86_400
		const response = await session(request('/api/auth/session', { cookie: sessionCookieHeader(iat) }))
		assert.equal(response.status, 200)
		assert.ok(response.headers.get('set-cookie')?.includes('Max-Age=31536000'))
	})
})

describe('GET /api/content', () => {
	it('répond 401 sans cookie', async () => {
		const response = await content(request('/api/content'))
		assert.equal(response.status, 401)
		assert.equal(response.headers.get('cache-control'), 'private, no-store')
	})

	it('sert le placeholder avec une session valide', async () => {
		const response = await content(request('/api/content', { cookie: sessionCookieHeader() }))
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('cache-control'), 'private, no-store')
		const body = (await response.json()) as { placeholder: boolean; recipient: string }
		assert.equal(body.placeholder, true)
		assert.equal(body.recipient, 'Victoria')
	})
})

describe('GET /api/assets', () => {
	const get = (path: string, cookie: string | null = sessionCookieHeader()) =>
		assets(request(path, { cookie: cookie ?? undefined }))

	it('répond 401 sans session, même pour un id valide', async () => {
		assert.equal((await get('/api/assets/photo-versailles', null)).status, 401)
		assert.equal((await get('/api/assets?id=photo-versailles', 'loveship_session=v1.1.2.AAAA')).status, 401)
	})

	it('redirige vers le placeholder public quand aucun blob n’existe', async () => {
		for (const path of ['/api/assets/photo-versailles', '/api/assets?id=photo-versailles']) {
			const response = await get(path)
			assert.equal(response.status, 302, path)
			assert.equal(response.headers.get('location'), '/placeholders/photo-versailles.svg')
			assert.equal(response.headers.get('cache-control'), 'private, no-store')
		}
		assert.equal((await get('/api/assets/fleur-gerbera')).status, 302)
	})

	it('répond 404 pour un id absent du contenu ou invalide', async () => {
		const unknown = [
			'/api/assets/inconnu',
			'/api/assets',
			'/api/assets?id=../../etc/passwd',
			'/api/assets?id=..%2F..%2Fsecret',
			'/api/assets/..%2Fphoto-versailles',
			'/api/assets?id=PHOTO-VERSAILLES',
			'/api/assets?id=photo-versailles.svg',
			`/api/assets?id=${'a'.repeat(65)}`,
			'/api/assets?id=https://evil.example/x',
		]
		for (const path of unknown) assert.equal((await get(path)).status, 404, path)
	})

	it('relaie un blob sans Content-Length (chunked) sans annoncer une longueur nulle', async () => {
		// @vercel/blob calcule blob.size depuis Content-Length : 0 quand l'amont n'en envoie pas.
		const response = relayBlob({
			stream: new Response('octets').body as ReadableStream<Uint8Array>,
			headers: new Headers({ 'content-type': 'image/webp' }),
			blob: { contentType: 'image/webp' },
		})
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('content-length'), null)
		assert.equal(response.headers.get('cache-control'), 'private, no-store')
		assert.equal(await response.text(), 'octets')
	})
})
