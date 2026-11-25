import {
	type AuthConfig,
	loadAuthConfig,
	readSessionCookie,
	type Session,
	verifySessionToken,
} from '../auth/session.js'

/** En-têtes de toute réponse privée : jamais mise en cache par un cache partagé ni par le navigateur. */
export function privateHeaders(extra?: ConstructorParameters<typeof Headers>[0]): Headers {
	const headers = new Headers(extra)
	headers.set('cache-control', 'private, no-store')
	headers.set('vary', 'Cookie')
	headers.set('x-content-type-options', 'nosniff')
	return headers
}

export function json(body: unknown, status = 200, headers: Headers = privateHeaders()): Response {
	headers.set('content-type', 'application/json; charset=utf-8')
	return new Response(JSON.stringify(body), { status, headers })
}

/** Erreur générique : la cause (variable manquante…) est loguée côté serveur, jamais renvoyée. */
export const serverError = (): Response => json({ error: 'server_error' }, 500)

export function authConfig(): AuthConfig | null {
	try {
		return loadAuthConfig()
	} catch (error) {
		console.error('configuration auth invalide :', error instanceof Error ? error.message : error)
		return null
	}
}

/** Garde de TOUS les endpoints privés : renvoie la session, ou la Response (401/500) à retourner telle quelle. */
export function requireSession(request: Request): (Session & { config: AuthConfig }) | Response {
	const config = authConfig()
	if (!config) return serverError()
	const token = readSessionCookie(request)
	const session = token ? verifySessionToken(token, config) : null
	return session ? { ...session, config } : json({ authenticated: false }, 401)
}

/**
 * Protection CSRF des POST : refuse toute requête que le navigateur déclare cross-site.
 * Sans en-tête Origin/Sec-Fetch-Site (curl, scripts), il n'y a pas de navigateur à abuser : on laisse passer.
 */
export function rejectCrossSite(request: Request): Response | null {
	const site = request.headers.get('sec-fetch-site')
	const origin = request.headers.get('origin')
	let sameOrigin = site === null || site === 'same-origin'
	if (sameOrigin && origin !== null) {
		const host = request.headers.get('host') ?? new URL(request.url).host
		try {
			sameOrigin = new URL(origin).host === host
		} catch {
			sameOrigin = false
		}
	}
	return sameOrigin ? null : json({ error: 'forbidden' }, 403)
}

/** Lit le corps en UTF-8 en s'arrêtant au-delà de `max` octets ; null si trop gros ou absent. */
export async function readBoundedText(request: Request, max: number): Promise<string | null> {
	if (!request.body || Number(request.headers.get('content-length') ?? 0) > max) return null
	const reader = request.body.getReader()
	const chunks: Uint8Array[] = []
	let size = 0
	for (;;) {
		const { done, value } = await reader.read()
		if (done) return Buffer.concat(chunks).toString('utf8')
		size += value.byteLength
		if (size > max) {
			await reader.cancel()
			return null
		}
		chunks.push(value)
	}
}
