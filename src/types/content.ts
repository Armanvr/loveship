// Contrat partagé entre le client (src/) et le serveur (api/, server/).
// Types uniquement : ce fichier ne doit contenir aucune valeur ni aucun contenu.

/** Progression émotionnelle de la lettre. Pilote la lumière et la musique, jamais affichée. */
export type Mood = 'playful' | 'tender' | 'intimate' | 'admiring' | 'luminous'

export type AudioLayerId = 'piano' | 'texture' | 'harmony' | 'pads'

export type NarrativeBlock =
	| {
			id: string
			type: 'text' | 'poetry'
			content: string
			/** Ambiance à partir de ce bloc ; reste active jusqu'au prochain bloc qui en définit une. */
			mood?: Mood
	  }
	| {
			id: string
			type: 'photograph' | 'watercolor'
			/** Identifiant contrôlé par le serveur, servi par GET /api/assets/:assetId. */
			assetId: string
			alt: string
			/** Dimensions d'origine en pixels (facultatives) : réservent le ratio avant le chargement. */
			width?: number
			height?: number
	  }

export interface AssetRef {
	assetId: string
	alt: string
}

export interface LoveshipContent {
	/** true tant que le contenu servi est le placeholder du dépôt. */
	placeholder: boolean
	recipient: string
	sender: string
	/** Texte libre affiché tel quel sur la carte souvenir ; null tant que la date n'est pas fournie. */
	anniversaryDate: string | null

	authentication: {
		subtitle: string
	}

	introduction: {
		envelopeText: string
	}

	letter: NarrativeBlock[]

	transition: {
		content: string
	}

	promise: {
		envelopeText: string
		content: string
		signature: string
	}

	bouquet: {
		lily: AssetRef
		gerbera: AssetRef
	}

	audio: {
		/** Vide tant que la musique n'est pas livrée : le client ne doit alors émettre aucune requête audio. */
		layers: { id: AudioLayerId; assetId: string }[]
	}
}

// API
// POST /api/auth/login    { password: string } -> 204 + cookie | 400 | 401 | 429 (Firewall) | 503 (trop de vérifications simultanées)
// POST /api/auth/logout   -> 204 (cookie effacé)
// GET  /api/auth/session  -> 200 { authenticated: true } (renouvelle le cookie si besoin) | 401 { authenticated: false }
// GET  /api/content       -> 200 LoveshipContent | 401
// GET  /api/assets/:id    -> 200 | 206 (Range) binaire | 401 | 404
