import type { LoveshipContent } from '../types/content.ts'

// Un 401 sur n'importe quel appel ramène à l'écran d'authentification (branché par le contexte de session).
let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (handler: () => void) => {
	onUnauthorized = handler
}

async function request(path: string, init?: RequestInit) {
	const response = await fetch(path, { credentials: 'same-origin', ...init })
	if (response.status === 401) onUnauthorized()
	return response
}

export const assetUrl = (assetId: string) => `/api/assets/${encodeURIComponent(assetId)}`

export async function fetchSession(): Promise<boolean> {
	const response = await request('/api/auth/session')
	if (!response.ok) return false
	// Une réponse 200 qui n'est pas le JSON attendu (ex. repli SPA) ne vaut jamais authentification.
	const body: { authenticated?: boolean } | null = await response.json().catch(() => null)
	return body?.authenticated === true
}

export type LoginResult = 'ok' | 'invalid' | 'rate-limited' | 'error'

export async function login(password: string): Promise<LoginResult> {
	try {
		const response = await request('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		})
		if (response.status === 204) return 'ok'
		if (response.status === 429) return 'rate-limited'
		if (response.status === 400 || response.status === 401) return 'invalid'
		return 'error'
	} catch {
		return 'error'
	}
}

export async function logout(): Promise<void> {
	try {
		await request('/api/auth/logout', { method: 'POST' })
	} catch {
		// la session locale est de toute façon abandonnée
	}
}

export async function fetchContent(): Promise<LoveshipContent> {
	const response = await request('/api/content')
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	return response.json()
}
