import { clearedCookie } from '../../server/auth/session.js'
import { privateHeaders, rejectCrossSite } from '../../server/security/guard.js'

// Pas de session requise : effacer un cookie absent ou invalide est inoffensif.
export function POST(request: Request): Response {
	const crossSite = rejectCrossSite(request)
	if (crossSite) return crossSite
	return new Response(null, { status: 204, headers: privateHeaders({ 'set-cookie': clearedCookie() }) })
}
