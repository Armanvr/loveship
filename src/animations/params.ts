// Paramètres d'animation centralisés : durées (s), eases GSAP, distances (px).
export const duration = {
	reveal: 1.1,
	flap: 1.1,
	sheet: 1.3,
	handover: 1.6, // enveloppe -> lettre
} as const

/** Durées de la fin de l'expérience : conclusion florale, bouquet -> carte, révélation de la carte. */
export const finale = {
	appear: 1.3, // apparition de chaque fleur
	approach: 1.7, // rapprochement
	stems: 1.7, // tiges
	thread: 1.5, // fil doré
	settle: 1.1, // composition finale
	morph: 2.6, // bouquet -> carte
	morphDelay: 0.7, // petit temps de contemplation avant que le bouquet ne devienne la carte
} as const

export const ease = {
	soft: 'power2.out',
	paper: 'power2.inOut',
	ink: 'sine.out',
} as const

export const distance = {
	reveal: 14,
	blur: 2.5,
} as const

/** Seuil de déclenchement de la révélation : le bloc apparaît quand son haut atteint ce point du viewport. */
export const REVEAL_START = 'top 88%'
