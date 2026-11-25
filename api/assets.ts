import { serveAsset } from '../server/content/assets.js'
import { requireSession } from '../server/security/guard.js'

// Atteinte via le rewrite vercel.json /api/assets/:id -> /api/assets?id=:id (segment dynamique non documenté en signature Web).
export async function GET(request: Request): Promise<Response> {
	const auth = requireSession(request)
	if (auth instanceof Response) return auth
	return serveAsset(request)
}
