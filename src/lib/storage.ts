// localStorage sûr : toute erreur (stockage bloqué, mode privé, quota) bascule sur une mémoire de session.
// Uniquement du non sensible : jamais de session, de texte personnel ou de jeton.

const KEYS = {
	introductionSeen: 'loveship:v2:introductionSeen',
	audioEnabled: 'loveship:v2:audioEnabled',
	audioVolume: 'loveship:v2:audioVolume',
} as const

const memory = new Map<string, string>()

function read(key: string): string | null {
	try {
		const value = localStorage.getItem(key)
		if (value !== null) return value
	} catch {
		// repli mémoire
	}
	return memory.get(key) ?? null
}

function write(key: string, value: string | null) {
	if (value === null) memory.delete(key)
	else memory.set(key, value)
	try {
		if (value === null) localStorage.removeItem(key)
		else localStorage.setItem(key, value)
	} catch {
		// repli mémoire
	}
}

export const storage = {
	getIntroductionSeen: () => read(KEYS.introductionSeen) === '1',
	setIntroductionSeen: (seen: boolean) => write(KEYS.introductionSeen, seen ? '1' : null),

	getAudioEnabled: () => read(KEYS.audioEnabled) === '1',
	setAudioEnabled: (enabled: boolean) => write(KEYS.audioEnabled, enabled ? '1' : '0'),

	/** null tant qu'aucune préférence n'a été enregistrée. */
	getAudioVolume: (): number | null => {
		const raw = read(KEYS.audioVolume)
		const value = raw === null ? Number.NaN : Number.parseFloat(raw)
		return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null
	},
	setAudioVolume: (volume: number) => write(KEYS.audioVolume, String(Math.min(1, Math.max(0, volume)))),
}
