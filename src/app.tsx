import { ContentProvider } from './contexts/content'
import { AuthScreen } from './features/authentication/AuthScreen'
import { SessionProvider, useSession } from './features/authentication/session'
import { ExperienceProvider } from './features/experience/context'
import { Experience } from './features/experience/Experience'

function Gate() {
	const { status } = useSession()
	// Pendant la vérification de session : papier vierge, pour ne pas faire clignoter l'écran d'authentification.
	if (status === 'checking') return <main class='min-h-svh' aria-busy='true' />
	if (status === 'unauthenticated') return <AuthScreen />
	return (
		<ContentProvider>
			<ExperienceProvider>
				<Experience />
			</ExperienceProvider>
		</ContentProvider>
	)
}

export function App() {
	return (
		<SessionProvider>
			<Gate />
		</SessionProvider>
	)
}
