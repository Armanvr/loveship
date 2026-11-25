import { ui } from '../../config'
import { useSession } from '../../features/authentication/session'
import { useExperience } from '../../features/experience/context'

/** Actions discrètes en pied d'expérience (pas un menu). Rejouer n'efface jamais la session. */
export function FooterActions() {
	const { send } = useExperience()
	const { logout } = useSession()
	return (
		<footer class='flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 pt-10 pb-16'>
			<button type='button' class='text-action' onClick={() => send({ type: 'REPLAY' })}>
				{ui.replay}
			</button>
			<button type='button' class='text-action' onClick={logout}>
				{ui.logout}
			</button>
		</footer>
	)
}
