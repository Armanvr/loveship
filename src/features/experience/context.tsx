import { type ComponentChildren, createContext } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useReducer } from 'preact/hooks'
import { storage } from '../../lib/storage'
import { type ExperienceEvent, type ExperienceState, initialState, reducer } from './reducer'

interface ExperienceContextValue {
	state: ExperienceState
	/** Envoie un événement narratif ; les effets locaux (localStorage, retour en haut) sont gérés ici. */
	send: (event: ExperienceEvent) => void
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null)

export function ExperienceProvider({ children }: { children: ComponentChildren }) {
	const [state, dispatch] = useReducer(reducer, undefined, () => initialState(storage.getIntroductionSeen()))

	const send = useCallback((event: ExperienceEvent) => {
		if (event.type === 'ENVELOPE_OPENED') storage.setIntroductionSeen(true)
		if (event.type === 'REPLAY') {
			storage.setIntroductionSeen(false)
			window.scrollTo(0, 0)
		}
		dispatch(event)
	}, [])

	// Lumière de la page : variables CSS pilotées par ces attributs (transition douce dans index.css).
	useEffect(() => {
		document.documentElement.dataset.mood = state.mood
		document.documentElement.dataset.step = state.step
		return () => {
			delete document.documentElement.dataset.mood
			delete document.documentElement.dataset.step
		}
	}, [state.mood, state.step])

	const value = useMemo(() => ({ state, send }), [state, send])
	return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
}

export function useExperience() {
	const value = useContext(ExperienceContext)
	if (!value) throw new Error('useExperience doit être utilisé sous <ExperienceProvider>')
	return value
}
