import { useEffect, useRef, useState } from 'preact/hooks'
import { gsap, NO_PREFERENCE } from '../../animations/motion'
import { AUTH_SUBTITLE, ui } from '../../config'
import type { LoginResult } from '../../lib/api'
import { useSession } from './session'

const MESSAGES: Record<Exclude<LoginResult, 'ok'>, string> = {
	invalid: ui.wrongPassword,
	'rate-limited': ui.rateLimited,
	error: ui.networkError,
}

const Eye = ({ off }: { off: boolean }) => (
	<svg
		viewBox='0 0 24 24'
		width='22'
		height='22'
		fill='none'
		stroke='currentColor'
		stroke-width='1.3'
		aria-hidden='true'
	>
		<path d='M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z' />
		<circle cx='12' cy='12' r='3' />
		{off && <path d='M4 20 20 4' />}
	</svg>
)

export function AuthScreen() {
	const { login } = useSession()
	const [password, setPassword] = useState('')
	const [visible, setVisible] = useState(false)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')
	const rootRef = useRef<HTMLElement>(null)

	useEffect(() => {
		const mm = gsap.matchMedia()
		mm.add(NO_PREFERENCE, () => {
			gsap.from(rootRef.current, { opacity: 0, y: 10, duration: 1.1, ease: 'power2.out', clearProps: 'all' })
		})
		return () => mm.revert()
	}, [])

	const submit = async (event: Event) => {
		event.preventDefault()
		if (loading || !password) return
		setLoading(true)
		setMessage('')
		const result = await login(password)
		// En cas de succès, ce composant est démonté par le parent.
		if (result !== 'ok') {
			setMessage(MESSAGES[result])
			setLoading(false)
		}
	}

	return (
		<main ref={rootRef} class='grid min-h-svh place-items-center px-6 py-12 safe-px'>
			<div class='flex w-full max-w-sm flex-col items-center text-center'>
				<h1 class='font-display text-6xl font-medium tracking-wide text-bordeaux sm:text-7xl'>{ui.appName}</h1>
				<p class='mt-4 font-display text-xl italic text-ink/70'>{AUTH_SUBTITLE}</p>

				<form class='mt-14 w-full' onSubmit={submit}>
					<label for='password' class='block text-left font-text text-sm text-ink/70'>
						{ui.password}
					</label>
					<div class='relative mt-1'>
						<input
							id='password'
							name='password'
							type={(visible ? 'text' : 'password') as 'text'} // le typage Preact sépare password et text
							value={password}
							onInput={(e) => {
								setPassword(e.currentTarget.value)
								if (message) setMessage('')
							}}
							autocomplete='current-password'
							autocapitalize='none'
							spellcheck={false}
							aria-describedby='auth-message'
							aria-invalid={message ? true : undefined}
							class='w-full border-0 border-b border-ink/40 bg-transparent py-3 pr-12 font-text text-lg text-ink focus:border-bordeaux focus:outline-none focus-visible:border-bordeaux'
						/>
						<button
							type='button'
							onClick={() => setVisible((v) => !v)}
							aria-pressed={visible}
							aria-label={ui.showPassword}
							class='absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-ink/60 hover:text-bordeaux'
						>
							<Eye off={visible} />
						</button>
					</div>

					<p
						id='auth-message'
						role='status'
						aria-live='polite'
						class='mt-3 min-h-12 text-left font-text text-sm text-bordeaux'
					>
						{message}
					</p>

					<button
						type='submit'
						disabled={loading || !password}
						aria-busy={loading}
						class='btn-primary mt-4 w-full'
					>
						{loading ? ui.entering : ui.enter}
					</button>
				</form>
			</div>
		</main>
	)
}
