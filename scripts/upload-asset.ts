// Usage : npm run upload-asset -- <assetId|content> <fichier>
//   assetId  -> Blob privé assets/<assetId>        (photo, aquarelle, fleur, couche audio)
//   content  -> Blob privé content/loveship.json   (contenu narratif, validé avant envoi)
// Jeton : BLOB_READ_WRITE_TOKEN (chargé depuis .env.local, par ex. via `vercel env pull .env.local`).
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { put } from '@vercel/blob'
import { ASSET_ID, CONTENT_PATHNAME, isLoveshipContent } from '../server/content/load.js'

const CONTENT_TYPES: Record<string, string> = {
	'.avif': 'image/avif',
	'.webp': 'image/webp',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.m4a': 'audio/mp4',
	'.ogg': 'audio/ogg',
	'.wav': 'audio/wav',
}

function fail(message: string): never {
	console.error(message)
	process.exit(1)
}

const [target, file] = process.argv.slice(2)
if (!target || !file) fail('Usage : npm run upload-asset -- <assetId|content> <fichier>')
const isContent = target === 'content'
if (!isContent && !ASSET_ID.test(target))
	fail(`assetId invalide : ${ASSET_ID} attendu (minuscules, chiffres, tirets, 64 max).`)

const body = await readFile(file).catch(() => fail(`Fichier illisible : ${file}`))
let contentType = CONTENT_TYPES[extname(file).toLowerCase()]
if (isContent) {
	try {
		if (!isLoveshipContent(JSON.parse(body.toString('utf8'))))
			fail('Contenu refusé : forme LoveshipContent invalide.')
	} catch (error) {
		if (error instanceof SyntaxError) fail('Contenu refusé : JSON invalide.')
		throw error
	}
	contentType = 'application/json'
}
if (!contentType)
	fail(`Extension non supportée : ${extname(file) || '(aucune)'} (${Object.keys(CONTENT_TYPES).join(', ')}).`)

const pathname = isContent ? CONTENT_PATHNAME : `assets/${target}`
try {
	const blob = await put(pathname, body, {
		access: 'private',
		contentType,
		addRandomSuffix: false,
		allowOverwrite: true,
	})
	console.log(`OK ${blob.pathname} (${contentType}, ${body.length} octets)`)
} catch (error) {
	fail(`Envoi impossible (BLOB_READ_WRITE_TOKEN défini ?) : ${error instanceof Error ? error.message : error}`)
}
