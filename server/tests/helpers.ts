import { hashPassword } from '../auth/password.js'
import { createSessionToken, loadAuthConfig, SESSION_COOKIE } from '../auth/session.js'

// Valeur de test uniquement, sans rapport avec le mot de passe réel.
export const TEST_PASSWORD = 'mot de passe de test'

export async function setupEnv(): Promise<void> {
	process.env.LOVESHIP_PASSWORD_HASH = await hashPassword(TEST_PASSWORD)
	process.env.LOVESHIP_SESSION_SECRET = 'secret-de-test-'.padEnd(48, 'x')
	delete process.env.BLOB_READ_WRITE_TOKEN
	delete process.env.BLOB_STORE_ID
	delete process.env.VERCEL_ENV
	delete process.env.NODE_ENV
}

export function sessionCookieHeader(iat?: number): string {
	return `${SESSION_COOKIE}=${createSessionToken(loadAuthConfig(), iat)}`
}

export function request(path: string, init: RequestInit & { cookie?: string } = {}): Request {
	const { cookie, ...rest } = init
	const headers = new Headers(rest.headers)
	if (cookie) headers.set('cookie', cookie)
	return new Request(`http://localhost${path}`, { ...rest, headers })
}

export function loginRequest(body: string, headers: Record<string, string> = {}): Request {
	return request('/api/auth/login', {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body,
	})
}
