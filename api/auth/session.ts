import { createSessionToken, needsRenewal, sessionCookie } from '../../server/auth/session.js'
import { json, privateHeaders, requireSession } from '../../server/security/guard.js'

// Renouvellement glissant : au-delà de 30 jours d'âge, on réémet un cookie de 365 jours.
export function GET(request: Request): Response {
	const auth = requireSession(request)
	if (auth instanceof Response) return auth
	const headers = privateHeaders()
	if (needsRenewal(auth.iat)) headers.append('set-cookie', sessionCookie(createSessionToken(auth.config)))
	return json({ authenticated: true }, 200, headers)
}
