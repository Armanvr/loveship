import { MAX_PASSWORD_LENGTH, verifyPassword } from '../../server/auth/password.js'
import { createSessionToken, sessionCookie } from '../../server/auth/session.js'
import {
	authConfig,
	json,
	privateHeaders,
	readBoundedText,
	rejectCrossSite,
	serverError,
} from '../../server/security/guard.js'

const MAX_BODY_BYTES = 2048

// Chaque scrypt coûte ~32 Mio : on plafonne les vérifications simultanées pour ne pas épuiser la mémoire de l'instance.
// shortcut: compteur par instance (pas global entre instances), la règle Firewall reste le filet par IP ; passer à un limiteur partagé si besoin.
const MAX_CONCURRENT_VERIFICATIONS = 4
let verifying = 0

function parsePassword(text: string | null): string | null {
	if (text === null) return null
	let body: unknown
	try {
		body = JSON.parse(text)
	} catch {
		return null
	}
	const password = (body as { password?: unknown } | null)?.password
	return typeof password === 'string' && password.length > 0 && password.length <= MAX_PASSWORD_LENGTH
		? password
		: null
}

// Anti-bruteforce : règle Vercel Firewall (dashboard) sur POST /api/auth/login, rien à coder ici.
export async function POST(request: Request): Promise<Response> {
	const config = authConfig()
	if (!config) return serverError()
	const crossSite = rejectCrossSite(request)
	if (crossSite) return crossSite
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
		return json({ error: 'bad_request' }, 400)
	}
	const password = parsePassword(await readBoundedText(request, MAX_BODY_BYTES))
	if (password === null) return json({ error: 'bad_request' }, 400)
	if (verifying >= MAX_CONCURRENT_VERIFICATIONS)
		return json({ error: 'busy' }, 503, privateHeaders({ 'retry-after': '2' }))
	verifying++
	let valid: boolean
	try {
		valid = await verifyPassword(password, config.passwordHash)
	} finally {
		verifying--
	}
	// Même réponse quel que soit l'échec : l'appelant n'apprend rien.
	if (!valid) return json({ error: 'invalid_credentials' }, 401)
	return new Response(null, {
		status: 204,
		headers: privateHeaders({ 'set-cookie': sessionCookie(createSessionToken(config)) }),
	})
}
