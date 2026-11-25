// Textes courts et non personnels de l'interface. Rien de narratif ici : le récit vient de /api/content.

export const AUTH_SUBTITLE = 'Notre histoire continue.' // non chargeable avant connexion

export const ui = {
	appName: 'Loveship',
	password: 'Mot de passe',
	showPassword: 'Afficher le mot de passe',
	enter: 'Entrer',
	entering: 'Un instant',
	wrongPassword: 'Ce n’est pas le bon mot de passe.',
	rateLimited: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
	networkError: 'Connexion impossible pour le moment. Réessayez dans un instant.',
	contentLoading: 'Un instant',
	contentError: 'Le contenu n’a pas pu être chargé.',
	retry: 'Réessayer',
	openEnvelope: 'Ouvrir l’enveloppe',
	replay: 'Relire depuis le début',
	logout: 'Se déconnecter',
} as const

/** Libellé provisoire explicite tant que `content.anniversaryDate` est null : jamais une date inventée. */
export const KEEPSAKE_DATE_PLACEHOLDER = 'date à venir'

export const keepsakeCopy = {
	region: 'Carte souvenir',
	save: 'Garder ce souvenir',
	saving: 'Préparation du souvenir…',
	saved: 'Le souvenir est prêt.',
	error: 'Le souvenir n’a pas pu être créé.',
	retry: 'Réessayer',
	pressHold: 'Appuyez longuement sur l’image pour l’enregistrer.',
	previewAlt: 'Carte souvenir',
	fileName: 'loveship-souvenir.png',
} as const

/** Texte alternatif de la scène florale, complété par les alt des deux fleurs (fournis par le contenu). */
export const bouquetCopy = {
	scene: 'Leurs tiges s’entrelacent et un fil doré les relie en un seul bouquet.',
} as const
