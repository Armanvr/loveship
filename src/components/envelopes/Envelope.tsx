import type { ComponentChildren } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { gsap, prefersReducedMotion } from '../../animations/motion'
import { duration, ease } from '../../animations/params'

export type EnvelopeVariant = 'ivory' | 'bordeaux'

export interface EnvelopeProps {
	variant: EnvelopeVariant
	/** Inscription sur la face de l'enveloppe. */
	inscription: string
	/** Nom accessible du bouton. */
	label: string
	/** Cachet posé sur la pointe du rabat (variante bordeaux) ; s'efface à l'ouverture. */
	seal?: ComponentChildren
	/** Enveloppe déjà ouverte : rendue ouverte, non interactive. */
	opened?: boolean
	/** Appelé une fois le rabat ouvert et la lettre sortie (immédiatement en reduced-motion). */
	onOpen?: () => void
	class?: string
}

// Teintes par variante, lues par le SVG via des variables CSS (centralisées ici, couleurs du thème).
const TONES: Record<EnvelopeVariant, Record<string, string>> = {
	ivory: {
		'--env-back': '#e7dcc4',
		'--env-side': '#f4ecda',
		'--env-bottom': '#efe5cf',
		'--env-flap': '#f8f2e4',
		'--env-flap-inner': '#e3d6bb',
		'--env-edge': 'rgb(56 45 41 / 0.13)',
		'--env-ink': 'var(--color-bordeaux)',
	},
	bordeaux: {
		'--env-back': '#4a1a29',
		'--env-side': '#692a3b',
		'--env-bottom': '#5e2334',
		'--env-flap': '#742f42',
		'--env-flap-inner': '#4a1a29',
		'--env-edge': 'rgb(255 255 255 / 0.1)',
		'--env-ink': 'var(--color-champagne)',
	},
}

// Position de l'inscription. Bordeaux : plus basse, plus large, un peu plus petite, pour rester sous le cachet de cire.
const INSCRIPTION: Record<EnvelopeVariant, string> = {
	ivory: 'inset-x-[10%] bottom-[10%] text-[clamp(1.6rem,6.5vw,2.6rem)]',
	bordeaux: 'inset-x-[4%] bottom-[6%] text-[clamp(1.35rem,5.6vw,2.4rem)]',
}

const FLAP = '0,0 600,0 300,230'
const preserve3d = { transformStyle: 'preserve-3d', transformOrigin: '50% 0' } as const
const face = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as const

export function Envelope({
	variant,
	inscription,
	label,
	seal,
	opened = false,
	onOpen,
	class: className = '',
}: EnvelopeProps) {
	const [busy, setBusy] = useState(false)
	const flap = useRef<HTMLSpanElement>(null)
	const sheet = useRef<HTMLSpanElement>(null)
	const sealRef = useRef<HTMLSpanElement>(null)
	const timeline = useRef<gsap.core.Timeline>(null)
	const done = opened || busy

	useEffect(() => () => void timeline.current?.kill(), [])

	// Pose de départ : flap fermé, ou ouvert si l'enveloppe arrive déjà ouverte.
	useLayoutEffect(() => {
		gsap.set(flap.current, { transformPerspective: 1400, rotationX: opened ? -180 : 0, zIndex: opened ? 0 : 3 })
		if (opened) gsap.set(sealRef.current, { autoAlpha: 0 })
	}, [])

	// Légère invitation au survol : le rabat se soulève de quelques degrés.
	const lift = (angle: number) => {
		if (done || prefersReducedMotion()) return
		gsap.to(flap.current, { rotationX: angle, duration: 0.5, ease: ease.soft, overwrite: 'auto' })
	}

	// Préférence lue une seule fois, à l'ouverture : un changement en cours de route ne peut pas annuler l'animation
	// avant onOpen (ce que faisait gsap.matchMedia, laissant l'enveloppe ouverte à moitié et le parcours bloqué).
	const open = () => {
		if (done) return
		setBusy(true)
		if (prefersReducedMotion()) {
			gsap.set(flap.current, { rotationX: -180, zIndex: 0 })
			gsap.set(sheet.current, { yPercent: -62 })
			gsap.set(sealRef.current, { autoAlpha: 0 })
			onOpen?.()
			return
		}
		timeline.current = gsap
			.timeline({ defaults: { ease: ease.paper } })
			.to(sealRef.current, { autoAlpha: 0, scale: 0.9, duration: 0.5 }, 0)
			.to(flap.current, { rotationX: -180, duration: duration.flap }, 0.15)
			.set(flap.current, { zIndex: 0 }, 0.15 + duration.flap * 0.5) // une fois à la verticale, le rabat passe derrière
			.to(sheet.current, { yPercent: -62, duration: duration.sheet, ease: ease.soft }, '>-0.3')
			.call(() => onOpen?.())
	}

	return (
		<span class={`block w-[min(86vw,36rem)] ${className}`} style={TONES[variant]}>
			<span class={`block ${done ? '' : 'envelope-float'}`}>
				<button
					type='button'
					onClick={open}
					onPointerEnter={() => lift(-9)}
					onPointerLeave={() => lift(0)}
					onFocus={() => lift(-9)}
					onBlur={() => lift(0)}
					aria-label={label}
					aria-disabled={done || undefined}
					tabIndex={opened ? -1 : undefined}
					class='relative block aspect-[3/2] w-full cursor-pointer aria-disabled:cursor-default'
					style={{ filter: 'drop-shadow(0 18px 26px rgb(56 45 41 / 0.28))' }}
				>
					{/* Intérieur */}
					<svg class='absolute inset-0 size-full' viewBox='0 0 600 400' aria-hidden='true'>
						<rect width='600' height='400' fill='var(--env-back)' />
					</svg>

					{/* Lettre, glissée dans l'enveloppe */}
					<span
						ref={sheet}
						class='absolute inset-x-[6%] top-[7%] bottom-[5%] z-[1] block bg-ivory-bright shadow-[0_1px_3px_rgb(56_45_41/0.18)]'
					/>

					{/* Face avant : deux pans latéraux et le pan inférieur */}
					<svg class='absolute inset-0 z-[2] size-full' viewBox='0 0 600 400' aria-hidden='true'>
						<g stroke='var(--env-edge)' stroke-width='1.2' stroke-linejoin='round'>
							<polygon points='0,0 300,226 0,400' fill='var(--env-side)' />
							<polygon points='600,0 300,226 600,400' fill='var(--env-side)' />
							<polygon points='0,400 300,196 600,400' fill='var(--env-bottom)' />
						</g>
					</svg>
					<span
						class={`pointer-events-none absolute z-[2] block text-center font-display italic leading-none tracking-wide ${INSCRIPTION[variant]}`}
						style={{ color: 'var(--env-ink)' }}
					>
						{inscription}
					</span>

					{/* Rabat : face extérieure, puis face intérieure (visible une fois retourné) */}
					<span ref={flap} class='absolute inset-x-0 top-0 block h-[57.5%]' style={preserve3d}>
						<svg
							class='absolute inset-0 size-full'
							style={face}
							viewBox='0 0 600 230'
							preserveAspectRatio='none'
							aria-hidden='true'
						>
							<polygon
								points={FLAP}
								fill='var(--env-flap)'
								stroke='var(--env-edge)'
								stroke-width='1.2'
								stroke-linejoin='round'
							/>
						</svg>
						<svg
							class='absolute inset-0 size-full'
							style={{ ...face, transform: 'rotateX(180deg)' }}
							viewBox='0 0 600 230'
							preserveAspectRatio='none'
							aria-hidden='true'
						>
							<polygon
								points={FLAP}
								fill='var(--env-flap-inner)'
								stroke='var(--env-edge)'
								stroke-width='1.2'
								stroke-linejoin='round'
							/>
						</svg>
					</span>

					<span
						ref={sealRef}
						class='absolute left-1/2 top-[57.5%] z-[4] block -translate-x-1/2 -translate-y-1/2'
					>
						{seal}
					</span>
				</button>
			</span>
		</span>
	)
}
