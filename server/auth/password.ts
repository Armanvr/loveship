import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

export const MAX_PASSWORD_LENGTH = 256

// Format stocké : scrypt:N:r:p:sel:hash (base64url). Pas de `$`, que les fichiers .env développent.
// N=2^15, r=8, p=1 : ~32 Mo et ~100 ms, confortable pour une Function Hobby (1 Go).
const PARAMS = { N: 32768, r: 8, p: 1 }
const MAX_SCRYPT_MEMORY = 64 * 2 ** 20
const SALT_BYTES = 16
const KEY_BYTES = 32
const HASH_RE = /^scrypt:(\d{1,8}):(\d{1,3}):(\d{1,3}):([\w-]{8,64}):([\w-]{16,128})$/

function scryptAsync(password: string, salt: Buffer, keylen: number, N: number, r: number, p: number): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password.normalize('NFKC'), salt, keylen, { N, r, p, maxmem: 256 * N * r }, (error, key) =>
			error ? reject(error) : resolve(key),
		)
	})
}

function parseHash(stored: string) {
	const match = HASH_RE.exec(stored)
	if (!match) return null
	const [N, r, p] = [Number(match[1]), Number(match[2]), Number(match[3])]
	// N puissance de 2, mémoire scrypt (128·N·r) plafonnée : un hash trafiqué ne doit pas pouvoir épuiser la mémoire.
	if (N < 1024 || (N & (N - 1)) !== 0 || r < 1 || r > 32 || p < 1 || p > 16) return null
	if (128 * N * r > MAX_SCRYPT_MEMORY) return null
	return {
		N,
		r,
		p,
		salt: Buffer.from(match[4] as string, 'base64url'),
		key: Buffer.from(match[5] as string, 'base64url'),
	}
}

export const isPasswordHash = (stored: string): boolean => parseHash(stored) !== null

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_BYTES)
	const key = await scryptAsync(password, salt, KEY_BYTES, PARAMS.N, PARAMS.r, PARAMS.p)
	return `scrypt:${PARAMS.N}:${PARAMS.r}:${PARAMS.p}:${salt.toString('base64url')}:${key.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parsed = parseHash(stored)
	if (!parsed) return false
	try {
		const key = await scryptAsync(password, parsed.salt, parsed.key.length, parsed.N, parsed.r, parsed.p)
		return timingSafeEqual(key, parsed.key) // même longueur : key est dérivée à parsed.key.length octets
	} catch {
		return false
	}
}
