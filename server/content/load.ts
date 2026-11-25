import { get } from '@vercel/blob'
import type { LoveshipContent } from '../../src/types/content.js'
import { placeholderContent } from './placeholder.js'

export const ASSET_ID = /^[a-z0-9-]{1,64}$/
export const CONTENT_PATHNAME = 'content/loveship.json'

const MOODS = ['playful', 'tender', 'intimate', 'admiring', 'luminous']
const AUDIO_LAYERS = ['piano', 'texture', 'harmony', 'pads']

/** Le stockage Blob est branché : jeton en local, store connecté (OIDC) sur Vercel. */
export const isBlobConfigured = (): boolean => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isAssetRef = (v: unknown) => isObj(v) && isStr(v.assetId) && ASSET_ID.test(v.assetId) && isStr(v.alt)

const isOptionalSize = (v: unknown) => v === undefined || (typeof v === 'number' && Number.isFinite(v) && v > 0)

function isBlock(v: unknown): boolean {
	if (!isObj(v) || !isStr(v.id)) return false
	if (v.type === 'text' || v.type === 'poetry') {
		return isStr(v.content) && (v.mood === undefined || (isStr(v.mood) && MOODS.includes(v.mood)))
	}
	return (
		(v.type === 'photograph' || v.type === 'watercolor') &&
		isAssetRef(v) &&
		isOptionalSize(v.width) &&
		isOptionalSize(v.height)
	)
}

/** Validation minimale de la forme (pas du fond) : le contenu vient de Blob, écrit par le propriétaire. */
export function isLoveshipContent(v: unknown): v is LoveshipContent {
	if (!isObj(v)) return false
	const { authentication, introduction, transition, promise, bouquet, audio, letter } = v
	return (
		typeof v.placeholder === 'boolean' &&
		isStr(v.recipient) &&
		isStr(v.sender) &&
		(v.anniversaryDate === null || isStr(v.anniversaryDate)) &&
		isObj(authentication) &&
		isStr(authentication.subtitle) &&
		isObj(introduction) &&
		isStr(introduction.envelopeText) &&
		Array.isArray(letter) &&
		letter.every(isBlock) &&
		isObj(transition) &&
		isStr(transition.content) &&
		isObj(promise) &&
		isStr(promise.envelopeText) &&
		isStr(promise.content) &&
		isStr(promise.signature) &&
		isObj(bouquet) &&
		isAssetRef(bouquet.lily) &&
		isAssetRef(bouquet.gerbera) &&
		isObj(audio) &&
		Array.isArray(audio.layers) &&
		audio.layers.every(
			(l: unknown) =>
				isObj(l) && isStr(l.id) && AUDIO_LAYERS.includes(l.id) && isStr(l.assetId) && ASSET_ID.test(l.assetId),
		)
	)
}

/** Seuls ces identifiants (lettre, bouquet, audio) peuvent être servis : jamais un chemin fourni par le client. */
export function referencedAssetIds(content: LoveshipContent): Set<string> {
	const ids = [
		content.bouquet.lily.assetId,
		content.bouquet.gerbera.assetId,
		...content.audio.layers.map((l) => l.assetId),
	]
	for (const block of content.letter) if ('assetId' in block) ids.push(block.assetId)
	return new Set(ids)
}

// shortcut: une lecture Blob par requête (deux lecteurs, trafic négligeable) ; ajouter un cache mémoire à TTL court si le trafic grossit.
export async function loadContent(): Promise<LoveshipContent> {
	if (!isBlobConfigured()) return placeholderContent
	try {
		const result = await get(CONTENT_PATHNAME, { access: 'private', useCache: false })
		if (!result?.stream) return placeholderContent
		const data: unknown = await new Response(result.stream).json()
		if (isLoveshipContent(data)) return data
		console.error(`${CONTENT_PATHNAME} : forme invalide, repli sur le placeholder`)
	} catch (error) {
		console.error(`${CONTENT_PATHNAME} : lecture impossible, repli sur le placeholder`, error)
	}
	return placeholderContent
}
