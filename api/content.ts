import { loadContent } from '../server/content/load.js'
import { json, requireSession } from '../server/security/guard.js'

export async function GET(request: Request): Promise<Response> {
	const auth = requireSession(request)
	if (auth instanceof Response) return auth
	return json(await loadContent())
}
