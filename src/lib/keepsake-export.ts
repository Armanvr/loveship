// Export PNG de la carte souvenir, dessiné à la main en Canvas 2D (aucune capture du DOM).
import { FLOWERS, LILY_HALO, STEMS, THREAD, VIEW } from '../components/bouquet/geometry'
import { keepsakeCopy } from '../config'
import { assetUrl } from './api'
import { keepsakeLayout } from './keepsake-layout'

const EXPORT_WIDTH = 2400

const IVORY = '#faf6ed'
const BORDEAUX = '#702c3e'
const INK_SOFT = 'rgba(56, 45, 41, 0.72)'
const RULE = '#c9b085'
const FONT_FAMILY = '"Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif'
const PAPER_TILE = 0.32 // largeur d'un motif de papier, en part de la largeur de la carte (identique à l'affichage)

export interface KeepsakeSource {
	recipient: string
	sender: string
	dateLabel: string
	lilyId: string
	gerberaId: string
}

/** Un SVG sans width/height intrinsèques se rastérise à 0 x 0 (ou 300 x 150) : on les déduit du viewBox. */
async function withIntrinsicSize(blob: Blob): Promise<Blob> {
	const doc = new DOMParser().parseFromString(await blob.text(), 'image/svg+xml')
	const root = doc.documentElement
	if (root.localName !== 'svg' || doc.querySelector('parsererror')) return blob
	const widthOk =
		Number.parseFloat(root.getAttribute('width') ?? '') > 0 && !root.getAttribute('width')?.includes('%')
	const heightOk =
		Number.parseFloat(root.getAttribute('height') ?? '') > 0 && !root.getAttribute('height')?.includes('%')
	if (widthOk && heightOk) return blob
	const [, , w, h] = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
	root.setAttribute('width', String(w > 0 ? w : 600))
	root.setAttribute('height', String(h > 0 ? h : 600))
	if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
	return new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' })
}

/** Ressource authentifiée : fetch same-origin avec cookies -> blob -> image décodée (jamais de canvas « tainted »). */
async function loadImage(url: string, urls: string[]): Promise<HTMLImageElement> {
	const response = await fetch(url, { credentials: 'same-origin' })
	if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`)
	let blob = await response.blob()
	if (blob.type.includes('svg') || response.headers.get('content-type')?.includes('svg')) {
		blob = await withIntrinsicSize(blob.type.includes('svg') ? blob : new Blob([blob], { type: 'image/svg+xml' }))
	}
	const image = new Image()
	const objectUrl = URL.createObjectURL(blob)
	urls.push(objectUrl)
	image.src = objectUrl
	await image.decode()
	return image
}

const fontSpec = (italic: boolean, weight: number, size: number) =>
	`${italic ? 'italic ' : ''}${weight} ${size}px ${FONT_FAMILY}`

export async function renderKeepsake(source: KeepsakeSource): Promise<Blob> {
	const layout = keepsakeLayout(EXPORT_WIDTH, source)
	const urls: string[] = []
	try {
		// Polices : attendre le chargement général puis charger explicitement chaque variante utilisée, avec ses glyphes.
		await document.fonts.ready
		await Promise.all(
			layout.items.map((item) => document.fonts.load(fontSpec(item.italic, item.weight, item.size), item.text)),
		)
		const [lily, gerbera, paper] = await Promise.all([
			loadImage(assetUrl(source.lilyId), urls),
			loadImage(assetUrl(source.gerberaId), urls),
			loadImage('/textures/paper.svg', urls),
		])

		const canvas = document.createElement('canvas')
		canvas.width = Math.round(layout.width)
		canvas.height = Math.round(layout.height)
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Canvas 2D indisponible')

		// Papier : ivoire uni, puis le grain en motifs répétés.
		ctx.fillStyle = IVORY
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		// Le motif SVG (filtres feTurbulence) est rastérisé une seule fois, puis répété.
		const tile = Math.round(layout.width * PAPER_TILE)
		const swatch = document.createElement('canvas')
		swatch.width = swatch.height = tile
		swatch.getContext('2d')?.drawImage(paper, 0, 0, tile, tile)
		ctx.fillStyle = ctx.createPattern(swatch, 'repeat') ?? IVORY
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// Bouquet : tiges, fil doré, puis fleurs (même ordre que la scène SVG).
		ctx.save()
		ctx.translate(layout.bouquet.x, layout.bouquet.y)
		const scale = layout.bouquet.w / VIEW.w
		ctx.scale(scale, scale)
		ctx.lineCap = 'round'
		for (const stroke of [STEMS.lily, STEMS.gerbera, THREAD]) {
			ctx.strokeStyle = stroke.color
			ctx.lineWidth = stroke.width
			ctx.stroke(new Path2D(stroke.d))
		}
		for (const [name, image] of [
			['lily', lily],
			['gerbera', gerbera],
		] as const) {
			const flower = FLOWERS[name]
			// L'image est ajustée (sans déformation) dans son carré, comme preserveAspectRatio « meet » du SVG.
			const fit = Math.min(flower.size / image.naturalWidth, flower.size / image.naturalHeight)
			const [w, h] = [image.naturalWidth * fit, image.naturalHeight * fit]
			ctx.save()
			ctx.translate(flower.cx, flower.cy)
			ctx.rotate((flower.tilt * Math.PI) / 180)
			if (name === 'lily') {
				// Les décalages et flous d'ombre ne suivent pas la transformation : on les met à l'échelle à la main.
				ctx.shadowColor = LILY_HALO.color
				ctx.shadowBlur = LILY_HALO.sigma * 2 * scale
				ctx.shadowOffsetY = LILY_HALO.dy * scale
			}
			ctx.drawImage(image, -w / 2, -h / 2, w, h)
			ctx.restore()
		}
		ctx.restore()

		// Filet, noms et date.
		ctx.strokeStyle = RULE
		ctx.lineWidth = Math.max(1, layout.width / 1200)
		ctx.beginPath()
		ctx.moveTo(layout.rule.x1, layout.rule.y)
		ctx.lineTo(layout.rule.x2, layout.rule.y)
		ctx.stroke()
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		for (const item of layout.items) {
			ctx.font = fontSpec(item.italic, item.weight, item.size)
			ctx.fillStyle = item.kind === 'name' ? BORDEAUX : INK_SOFT
			// shortcut: letterSpacing absent de certains navigateurs (l'interlettrage de la date est alors ignoré).
			if ('letterSpacing' in ctx) ctx.letterSpacing = `${item.tracking * item.size}px`
			ctx.fillText(item.text, item.cx, item.cy, item.maxWidth)
		}

		return await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export PNG impossible'))), 'image/png'),
		)
	} finally {
		for (const url of urls) URL.revokeObjectURL(url)
	}
}

const isIOS = () =>
	/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export type Delivery = 'shared' | 'downloaded' | 'preview' | 'cancelled'

/**
 * Smartphone : feuille de partage native avec le fichier. Sinon téléchargement ; sur iOS, où il n'est pas fiable,
 * on rend la main pour afficher l'image (appui long). Ordinateur : toujours le téléchargement direct.
 */
export async function deliverKeepsake(blob: Blob): Promise<Delivery> {
	const file = new File([blob], keepsakeCopy.fileName, { type: 'image/png' })
	if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file] })
			return 'shared'
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
			// geste utilisateur expiré ou partage refusé : repli ci-dessous
		}
	}
	if (isIOS()) return 'preview'
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = keepsakeCopy.fileName
	link.click()
	setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
	return 'downloaded'
}
