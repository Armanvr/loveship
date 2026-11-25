import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

// Le module garde une mémoire de repli à l'échelle du module : on le recharge pour chaque test.
let n = 0
const load = async () => (await import(`./storage.ts?case=${n++}`)).storage as typeof import('./storage.ts').storage

const g = globalThis as { localStorage?: unknown }
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

function fakeStorage() {
	const data = new Map<string, string>()
	return {
		data,
		api: {
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, v),
			removeItem: (k: string) => void data.delete(k),
		},
	}
}

const setStorage = (value: unknown) => Object.defineProperty(globalThis, 'localStorage', { value, configurable: true })
const throwing = () => {
	const boom = () => {
		throw new Error('SecurityError')
	}
	return { getItem: boom, setItem: boom, removeItem: boom }
}

beforeEach(() => {
	// Node 24 n'expose pas localStorage par défaut ; on neutralise tout résidu.
	delete g.localStorage
})

afterEach(() => {
	if (original) Object.defineProperty(globalThis, 'localStorage', original)
	else delete g.localStorage
})

describe('stockage local : clés', () => {
	it('écrit uniquement des clés loveship:v2:*', async () => {
		const { data, api } = fakeStorage()
		setStorage(api)
		const storage = await load()
		storage.setIntroductionSeen(true)
		storage.setAudioEnabled(true)
		storage.setAudioVolume(0.4)
		assert.deepEqual([...data.keys()].sort(), [
			'loveship:v2:audioEnabled',
			'loveship:v2:audioVolume',
			'loveship:v2:introductionSeen',
		])
	})

	it('relit les valeurs écrites', async () => {
		const { api } = fakeStorage()
		setStorage(api)
		const storage = await load()
		assert.equal(storage.getIntroductionSeen(), false)
		storage.setIntroductionSeen(true)
		assert.equal(storage.getIntroductionSeen(), true)
		storage.setIntroductionSeen(false)
		assert.equal(storage.getIntroductionSeen(), false)
		storage.setAudioEnabled(true)
		assert.equal(storage.getAudioEnabled(), true)
		storage.setAudioEnabled(false)
		assert.equal(storage.getAudioEnabled(), false)
	})

	it('retire la clé quand l’introduction n’est plus vue', async () => {
		const { data, api } = fakeStorage()
		setStorage(api)
		const storage = await load()
		storage.setIntroductionSeen(true)
		storage.setIntroductionSeen(false)
		assert.ok(!data.has('loveship:v2:introductionSeen'))
	})
})

describe('stockage local : volume', () => {
	it('vaut null tant qu’aucune préférence n’est enregistrée', async () => {
		setStorage(fakeStorage().api)
		assert.equal((await load()).getAudioVolume(), null)
	})

	it('borne le volume enregistré à [0, 1]', async () => {
		setStorage(fakeStorage().api)
		const storage = await load()
		storage.setAudioVolume(3)
		assert.equal(storage.getAudioVolume(), 1)
		storage.setAudioVolume(-2)
		assert.equal(storage.getAudioVolume(), 0)
		storage.setAudioVolume(0.35)
		assert.equal(storage.getAudioVolume(), 0.35)
	})

	it('borne et rejette une valeur corrompue déjà présente', async () => {
		const { data, api } = fakeStorage()
		setStorage(api)
		const storage = await load()
		data.set('loveship:v2:audioVolume', '42')
		assert.equal(storage.getAudioVolume(), 1)
		data.set('loveship:v2:audioVolume', 'abc')
		assert.equal(storage.getAudioVolume(), null)
		data.set('loveship:v2:audioVolume', '')
		assert.equal(storage.getAudioVolume(), null)
	})
})

describe('stockage local : indisponibilité', () => {
	it('se replie sur la mémoire quand localStorage lève à chaque appel', async () => {
		setStorage(throwing())
		const storage = await load()
		assert.equal(storage.getIntroductionSeen(), false)
		storage.setIntroductionSeen(true)
		storage.setAudioEnabled(true)
		storage.setAudioVolume(0.2)
		assert.equal(storage.getIntroductionSeen(), true)
		assert.equal(storage.getAudioEnabled(), true)
		assert.equal(storage.getAudioVolume(), 0.2)
		storage.setIntroductionSeen(false)
		assert.equal(storage.getIntroductionSeen(), false)
	})

	it('se replie sur la mémoire quand localStorage n’existe pas (ReferenceError)', async () => {
		const storage = await load()
		assert.equal(storage.getAudioEnabled(), false)
		storage.setAudioEnabled(true)
		assert.equal(storage.getAudioEnabled(), true)
		assert.equal(storage.getAudioVolume(), null)
		storage.setAudioVolume(0.9)
		assert.equal(storage.getAudioVolume(), 0.9)
	})

	it('se replie sur la mémoire quand l’accès à localStorage lui-même lève', async () => {
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			get() {
				throw new Error('SecurityError')
			},
		})
		const storage = await load()
		storage.setIntroductionSeen(true)
		assert.equal(storage.getIntroductionSeen(), true)
	})

	it('ne jette jamais, même si seul setItem lève (quota)', async () => {
		const { api } = fakeStorage()
		setStorage({
			...api,
			setItem: () => {
				throw new Error('QuotaExceededError')
			},
		})
		const storage = await load()
		assert.doesNotThrow(() => storage.setAudioVolume(0.5))
		assert.equal(storage.getAudioVolume(), 0.5)
	})
})
