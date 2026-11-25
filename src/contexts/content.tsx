import { type ComponentChildren, createContext } from 'preact'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'
import { ui } from '../config'
import { fetchContent } from '../lib/api'
import type { LoveshipContent } from '../types/content.ts'

type ContentState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; content: LoveshipContent }

const ContentContext = createContext<LoveshipContent | null>(null)

/** À monter uniquement une fois authentifié. Les enfants ne sont rendus que contenu chargé. */
export function ContentProvider({ children }: { children: ComponentChildren }) {
	const [state, setState] = useState<ContentState>({ status: 'loading' })
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let cancelled = false
		setState({ status: 'loading' })
		fetchContent().then(
			(content) => !cancelled && setState({ status: 'ready', content }),
			() => !cancelled && setState({ status: 'error' }),
		)
		return () => {
			cancelled = true
		}
	}, [attempt])

	const retry = useCallback(() => setAttempt((n) => n + 1), [])

	if (state.status === 'ready')
		return <ContentContext.Provider value={state.content}>{children}</ContentContext.Provider>

	return (
		<main class='grid min-h-svh place-items-center px-6 text-center'>
			{state.status === 'loading' ? (
				<p class='font-display text-xl italic text-ink/60' role='status'>
					{ui.contentLoading}
				</p>
			) : (
				<div role='alert' class='flex flex-col items-center gap-5'>
					<p class='font-text text-ink/80'>{ui.contentError}</p>
					<button type='button' class='text-action' onClick={retry}>
						{ui.retry}
					</button>
				</div>
			)}
		</main>
	)
}

export function useContent() {
	const content = useContext(ContentContext)
	if (!content) throw new Error('useContent doit être utilisé sous <ContentProvider>')
	return content
}
