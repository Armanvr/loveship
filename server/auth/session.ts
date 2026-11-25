import { createHmac, timingSafeEqual } from 'node:crypto'
import { isPasswordHash } from './password.js'

export const SESSION_COOKIE = 'loveship_session'
export const SESSION_SECONDS = 365 * 24 * 3600
const RENEW_AFTER_SECONDS = 30 * 24 * 3600
const MIN_SECRET_LENGTH = 32
const TOKEN_RE = /^v1\.(\d{1,12})\.(\d{1,12})\.([\w-]{43})$/

export interface AuthConfig {
	secret: string
	passwordHash: string
}

export interface Session {
	iat: number
	exp: number
}

/** Lève une erreur (message sans valeur secrète) si la configuration est absente ou invalide. */
export function loadAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
	const secret = env.LOVESHIP_SESSION_SECRET
	const passwordHash = env.LOVESHIP_PASSWORD_HASH
	if (!secret) throw new Error('LOVESHIP_SESSION_SECRET manquant')
	if (secret.length < MIN_SECRET_LENGTH)
		throw new Error(`LOVESHIP_SESSION_SECRET : ${MIN_SECRET_LENGTH} caractères minimum`)
	if (!passwordHash) throw new Error('LOVESHIP_PASSWORD_HASH manquant')
	if (!isPasswordHash(passwordHash)) throw new Error('LOVESHIP_PASSWORD_HASH : format scrypt invalide')
	return { secret, passwordHash }
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

// La clé dépend du secret ET du hash : changer l'un ou l'autre invalide toutes les sessions.
function sign(config: AuthConfig, payload: string): Buffer {
	const key = createHmac('sha256', config.secret).update(`loveship-session-v1:${config.passwordHash}`).digest()
	return createHmac('sha256', key).update(payload).digest()
}

export function createSessionToken(config: AuthConfig, iat = nowSeconds()): string {
	const payload = `v1.${iat}.${iat + SESSION_SECONDS}`
	return `${payload}.${sign(config, payload).toString('base64url')}`
}

export function verifySessionToken(token: string, config: AuthConfig, now = nowSeconds()): Session | null {
	const match = TOKEN_RE.exec(token)
	if (!match) return null
	const [iat, exp] = [Number(match[1]), Number(match[2])]
	const given = Buffer.from(match[3] as string, 'base64url')
	const expected = sign(config, `v1.${iat}.${exp}`)
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
	// L'expiration est vérifiée côté serveur ; un iat dans le futur (au-delà de 60 s d'écart d'horloge) est refusé.
	if (exp <= now || iat > now + 60) return null
	return { iat, exp }
}

export const needsRenewal = (iat: number, now = nowSeconds()): boolean => now - iat > RENEW_AFTER_SECONDS

/** Développement local = ni Vercel ni NODE_ENV=production ; jamais déduit de la requête. */
const isLocalDevelopment = () => !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'production'

function cookie(value: string, maxAge: number): string {
	const secure = isLocalDevelopment() ? '' : '; Secure'
	return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`
}

export const sessionCookie = (token: string): string => cookie(token, SESSION_SECONDS)
export const clearedCookie = (): string => cookie('', 0)

export function readSessionCookie(request: Request): string | null {
	for (const part of (request.headers.get('cookie') ?? '').split(';')) {
		const [name, ...value] = part.trim().split('=')
		if (name === SESSION_COOKIE) return value.join('=')
	}
	return null
}
