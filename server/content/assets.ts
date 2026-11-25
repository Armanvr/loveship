import { get } from '@vercel/blob'
import { json, privateHeaders } from '../security/guard.js'
import { ASSET_ID, isBlobConfigured, loadContent, referencedAssetIds } from './load.js'
import { placeholderContent } from './placeholder.js'

const placeholderIds = referencedAssetIds(placeholderContent)
const SINGLE_RANGE = /^bytes=\d*-\d*$/

const notFound = (): Response => json({ error: 'not_found' }, 404)

/** À appeler après requireSession. L'id vient de `?id=` ou du dernier segment du chemin, puis est validé deux fois. */
export async function serveAsset(request: Request): Promise<Response> {
	const url = new URL(request.url)
	const id = url.searchParams.get('id') ?? url.pathname.split('/').filter(Boolean).at(-1) ?? ''
	if (!ASSET_ID.test(id) || !referencedAssetIds(await loadContent()).has(id)) return notFound()

	if (isBlobConfigured()) {
		const range = request.headers.get('range')
		let blob: Awaited<ReturnType<typeof get>>
		try {
			blob = await get(`assets/${id}`, {
				access: 'private',
				// shortcut: Range sur blob privé non documenté par Vercel, à valider sur un déploiement preview ; sinon repli 200 complet.
				headers: range && SINGLE_RANGE.test(range) ? { range } : undefined,
			})
		} catch (error) {
			console.error(`assets/${id} : lecture Blob impossible`, error)
			return json({ error: 'upstream_error' }, 502)
		}
		if (blob?.stream) return relayBlob(blob)
	}

	if (placeholderIds.has(id)) {
		return new Response(null, { status: 302, headers: privateHeaders({ location: `/placeholders/${id}.svg` }) })
	}
	return notFound()
}

/** Relaie un blob privé lu par `get` : en-têtes privés, réponse partielle (206) si l'amont en a servi une. */
export function relayBlob(blob: {
	stream: ReadableStream<Uint8Array>
	headers: Pick<Headers, 'get'> // Headers d'undici (type distinct du global)
	blob: { contentType: string }
}): Response {
	const { headers: upstream, stream } = blob
	const contentRange = upstream.get('content-range')
	const headers = privateHeaders({
		'content-type': blob.blob.contentType || 'application/octet-stream',
		// Un SVG ouvert directement ne doit exécuter aucun script.
		'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
	})
	if (contentRange) headers.set('content-range', contentRange)
	const acceptRanges = upstream.get('accept-ranges') ?? (contentRange ? 'bytes' : null)
	if (acceptRanges) headers.set('accept-ranges', acceptRanges)
	// Content-Length uniquement s'il décrit le corps relayé (pas de recompression amont). blob.size n'en est qu'une
	// copie, qui vaut 0 sans en-tête : jamais de repli dessus.
	const length = upstream.get('content-length')
	if (length && !upstream.get('content-encoding')) headers.set('content-length', length)
	return new Response(stream, { status: contentRange ? 206 : 200, headers })
}
