import { type ComponentChildren, createContext } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks'
import * as api from '../../lib/api'

type Status = 'checking' | 'authenticated' | 'unauthenticated'

interface SessionContextValue {
	status: Status
	login: (password: string) => Promise<api.LoginResult>
	logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

// La preuve d'authentification est le cookie HttpOnly vérifié par le serveur : rien dans localStorage.
export function SessionProvider({ children }: { children: ComponentChildren }) {
	const [status, setStatus] = useState<Status>('checking')

	useEffect(() => {
		api.setUnauthorizedHandler(() => setStatus('unauthenticated'))
		api.fetchSession().then(
			(ok) => setStatus(ok ? 'authenticated' : 'unauthenticated'),
			() => setStatus('unauthenticated'),
		)
	}, [])

	const login = useCallback(async (password: string) => {
		const result = await api.login(password)
		if (result === 'ok') setStatus('authenticated')
		return result
	}, [])

	const logout = useCallback(async () => {
		await api.logout()
		setStatus('unauthenticated')
		window.scrollTo(0, 0)
	}, [])

	const value = useMemo(() => ({ status, login, logout }), [status, login, logout])
	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
	const value = useContext(SessionContext)
	if (!value) throw new Error('useSession doit être utilisé sous <SessionProvider>')
	return value
}
