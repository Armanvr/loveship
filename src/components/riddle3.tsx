import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'preact/hooks'

interface Enigma3Props {
	userName: string
	onComplete: () => void
}

interface Star {
	id: string
	name: string
	x: number
	y: number
}

type ConstellationId = 'orion' | 'cassiopee' | 'grande-ourse'

interface ConstellationData {
	id: ConstellationId
	label: string
	description: string
	stars: Star[]
	connections: Set<string>
	interactive: boolean
}

const CONSTELLATIONS: Record<ConstellationId, ConstellationData> = {
	orion: {
		id: 'orion',
		label: 'Orion',
		description: 'Le chasseur céleste',
		stars: [
			{ id: 'betelgeuse', name: 'Bételgeuse', x: 280, y: 120 },
			{ id: 'bellatrix', name: 'Bellatrix', x: 520, y: 130 },
			{ id: 'alnitak', name: 'Alnitak', x: 350, y: 290 },
			{ id: 'alnilam', name: 'Alnilam', x: 400, y: 285 },
			{ id: 'mintaka', name: 'Mintaka', x: 450, y: 280 },
			{ id: 'saiph', name: 'Saiph', x: 320, y: 470 },
			{ id: 'rigel', name: 'Rigel', x: 500, y: 460 },
		],
		connections: new Set([
			'bellatrix-betelgeuse',
			'alnitak-betelgeuse',
			'bellatrix-mintaka',
			'alnilam-alnitak',
			'alnilam-mintaka',
			'alnitak-saiph',
			'mintaka-rigel',
		]),
		interactive: true,
	},
	cassiopee: {
		id: 'cassiopee',
		label: 'Cassiopée',
		description: 'Le W céleste',
		stars: [
			{ id: 'schedar', name: 'Schedar', x: 160, y: 280 },
			{ id: 'caph', name: 'Caph', x: 280, y: 180 },
			{ id: 'gamma', name: 'Gamma Cas', x: 400, y: 300 },
			{ id: 'ruchbah', name: 'Ruchbah', x: 520, y: 200 },
			{ id: 'segin', name: 'Segin', x: 640, y: 290 },
		],
		connections: new Set([
			'caph-schedar',
			'caph-gamma',
			'gamma-ruchbah',
			'ruchbah-segin',
		]),
		interactive: false,
	},
	'grande-ourse': {
		id: 'grande-ourse',
		label: 'Grande Ourse',
		description: 'La grande casserole',
		stars: [
			{ id: 'dubhe', name: 'Dubhe', x: 230, y: 180 },
			{ id: 'merak', name: 'Mérak', x: 250, y: 310 },
			{ id: 'phecda', name: 'Phecda', x: 370, y: 330 },
			{ id: 'megrez', name: 'Mégrez', x: 360, y: 210 },
			{ id: 'alioth', name: 'Alioth', x: 460, y: 230 },
			{ id: 'mizar', name: 'Mizar', x: 550, y: 260 },
			{ id: 'alkaid', name: 'Alkaïd', x: 650, y: 330 },
		],
		connections: new Set([
			'dubhe-merak',
			'merak-phecda',
			'megrez-phecda',
			'dubhe-megrez',
			'alioth-megrez',
			'alioth-mizar',
			'alkaid-mizar',
		]),
		interactive: false,
	},
}

function connectionKey(a: string, b: string): string {
	return [a, b].sort().join('-')
}

// Générer un champ d'étoiles de fond
function generateBackgroundStars(count: number): { x: number; y: number; r: number; opacity: number }[] {
	const stars = []
	for (let i = 0; i < count; i++) {
		stars.push({
			x: Math.random() * 800,
			y: Math.random() * 600,
			r: Math.random() * 1.5 + 0.3,
			opacity: Math.random() * 0.6 + 0.2,
		})
	}
	return stars
}

const BG_STARS = generateBackgroundStars(150)

export default function Enigma3({ userName, onComplete }: Enigma3Props) {
	const [chosenConstellation, setChosenConstellation] = useState<ConstellationId | null>(null)
	const [selectedStar, setSelectedStar] = useState<string | null>(null)
	const [connections, setConnections] = useState<Set<string>>(new Set())
	const [isComplete, setIsComplete] = useState(false)
	const [drawAnimDone, setDrawAnimDone] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)

	const constellation = chosenConstellation ? CONSTELLATIONS[chosenConstellation] : null

	useEffect(() => {
		gsap.from(containerRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power2.out',
		})
	}, [])

	// Animation d'entrée des étoiles quand une constellation est choisie
	useEffect(() => {
		if (!constellation) return

		gsap.from('.main-star', {
			scale: 0,
			opacity: 0,
			duration: 0.6,
			stagger: 0.08,
			delay: 0.3,
			ease: 'back.out(2)',
			transformOrigin: 'center center',
		})

		// Pour les constellations non-interactives, dessiner les lignes automatiquement
		if (!constellation.interactive) {
			const lines = document.querySelectorAll('.constellation-line')
			lines.forEach((lineEl, i) => {
				const length = (lineEl as SVGLineElement).getTotalLength?.() || 200
				gsap.fromTo(
					lineEl,
					{ strokeDasharray: length, strokeDashoffset: length, stroke: '#818cf8' },
					{
						strokeDashoffset: 0,
						duration: 0.8,
						delay: 0.8 + i * 0.3,
						ease: 'power2.out',
						onComplete:
							i === lines.length - 1
								? () => {
										// Dernière ligne dessinée — animation dorée
										setTimeout(() => {
											gsap.to('.constellation-line', {
												stroke: '#fbbf24',
												strokeWidth: 3,
												duration: 0.8,
												ease: 'power2.out',
											})
											gsap.to('.star-core', {
												fill: '#fbbf24',
												duration: 0.8,
												ease: 'power2.out',
											})
											setDrawAnimDone(true)
										}, 400)
									}
								: undefined,
					},
				)
			})
		}
	}, [constellation])

	// Le message n'est rendu qu'après drawAnimDone : on l'anime une fois monté
	useEffect(() => {
		if (!drawAnimDone) return
		gsap.to('.success-msg', {
			opacity: 1,
			y: 0,
			duration: 0.8,
			delay: 0.3,
			ease: 'power2.out',
		})
	}, [drawAnimDone])

	const handleChoose =(id: ConstellationId) => {
		gsap.to('.choice-card', {
			opacity: 0,
			y: -20,
			duration: 0.4,
			stagger: 0.08,
			ease: 'power2.in',
			onComplete: () => setChosenConstellation(id),
		})
	}

	const handleStarClick = (starId: string) => {
		if (isComplete || !constellation?.interactive) return

		if (!selectedStar) {
			setSelectedStar(starId)
			gsap.to(`#star-${starId}`, {
				scale: 1.4,
				duration: 0.3,
				ease: 'back.out(2)',
				transformOrigin: 'center center',
			})
		} else if (selectedStar === starId) {
			setSelectedStar(null)
			gsap.to(`#star-${starId}`, {
				scale: 1,
				duration: 0.3,
				ease: 'power2.out',
				transformOrigin: 'center center',
			})
		} else {
			const key = connectionKey(selectedStar, starId)

			if (connections.has(key)) {
				gsap.to(`#star-${selectedStar}`, {
					scale: 1,
					duration: 0.3,
					transformOrigin: 'center center',
				})
				setSelectedStar(null)
				return
			}

			if (constellation.connections.has(key)) {
				const newConnections = new Set(connections)
				newConnections.add(key)
				setConnections(newConnections)

				const lineEl = document.getElementById(`line-${key}`)
				if (lineEl) {
					const length = (lineEl as unknown as SVGLineElement).getTotalLength?.() || 200
					gsap.fromTo(
						lineEl,
						{ strokeDasharray: length, strokeDashoffset: length },
						{ strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' },
					)
				}

				gsap.to(`#star-${starId}`, {
					scale: 1.3,
					duration: 0.2,
					yoyo: true,
					repeat: 1,
					ease: 'back.out(2)',
					transformOrigin: 'center center',
				})

				gsap.to(`#star-${selectedStar}`, {
					scale: 1,
					duration: 0.3,
					transformOrigin: 'center center',
				})
				setSelectedStar(null)

				if (newConnections.size === constellation.connections.size) {
					setIsComplete(true)
					setTimeout(() => {
						gsap.to('.constellation-line', {
							stroke: '#fbbf24',
							strokeWidth: 3,
							duration: 0.8,
							ease: 'power2.out',
						})
						gsap.to('.star-core', {
							fill: '#fbbf24',
							duration: 0.8,
							ease: 'power2.out',
						})
						gsap.to('.success-msg', {
							opacity: 1,
							y: 0,
							duration: 0.8,
							delay: 0.5,
							ease: 'power2.out',
						})
					}, 300)
				}
			} else {
				for (const id of [selectedStar, starId]) {
					gsap.to(`#star-${id}`, {
						x: -4,
						duration: 0.08,
						repeat: 4,
						yoyo: true,
						ease: 'power1.inOut',
						onComplete: () => {
							gsap.set(`#star-${id}`, { x: 0 })
						},
						transformOrigin: 'center center',
					})
				}

				gsap.to(`#star-${selectedStar}`, {
					scale: 1,
					duration: 0.3,
					delay: 0.4,
					transformOrigin: 'center center',
				})
				setSelectedStar(null)
			}
		}
	}

	const handleContinue = () => {
		gsap.to(containerRef.current, {
			opacity: 0,
			duration: 0.5,
			onComplete: onComplete,
		})
	}

	const getStarById = (id: string) => constellation?.stars.find((s) => s.id === id)

	const showSuccess = constellation?.interactive ? isComplete : drawAnimDone

	// Écran de sélection de constellation
	if (!constellation) {
		return (
			<div
				ref={containerRef}
				className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 p-6'
			>
				<div className='max-w-3xl w-full space-y-8'>
					<div className='text-center space-y-3'>
						<h2 className='text-4xl font-light text-white'>Énigme 3</h2>
						<p className='text-lg text-indigo-300'>
							Choisis ta constellation,{' '}
							<span className='font-bold text-amber-400'>{userName}</span>
						</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						{(Object.values(CONSTELLATIONS) as ConstellationData[]).map((c) => (
							<button
								key={c.id}
								type='button'
								className='choice-card group bg-gray-950/80 border border-indigo-900/30 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10'
								onClick={() => handleChoose(c.id)}
							>
								<p className='text-2xl font-light text-white mb-2 group-hover:text-amber-400 transition-colors'>
									{c.label}
								</p>
								<p className='text-sm text-indigo-400/70'>{c.description}</p>
								{c.interactive && (
									<span className='inline-block mt-3 text-xs text-amber-400/60 border border-amber-400/20 rounded-full px-3 py-1'>
										Mini-jeu
									</span>
								)}
							</button>
						))}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 p-6'
		>
			<div className='max-w-4xl w-full space-y-6'>
				{/* Titre */}
				<div className='text-center space-y-3'>
					<h2 className='text-4xl font-light text-white'>Énigme 3</h2>
					<p className='text-lg text-indigo-300'>
						{constellation.interactive ? (
							<>
								Relie les étoiles d'{constellation.label},{' '}
								<span className='font-bold text-amber-400'>{userName}</span>
							</>
						) : (
							<>
								Contemple {constellation.label},{' '}
								<span className='font-bold text-amber-400'>{userName}</span>
							</>
						)}
					</p>
					{constellation.interactive && (
						<p className='text-sm text-indigo-400/70'>
							Clique sur une étoile, puis sur une autre pour les relier
						</p>
					)}
				</div>

				{/* Compteur (seulement en mode interactif) */}
				{constellation.interactive && (
					<div className='text-center'>
						<p className='text-2xl font-light text-white'>
							<span className='text-amber-400 font-medium'>{connections.size}</span>
							<span className='text-indigo-400'> / {constellation.connections.size}</span>
						</p>
					</div>
				)}

				{/* SVG Constellation */}
				<div className='bg-gray-950/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-indigo-900/30 overflow-hidden'>
					<svg
						ref={svgRef}
						viewBox='0 0 800 600'
						className='w-full'
						style={{ maxHeight: '60vh' }}
						role='img'
						aria-label={`Constellation de ${constellation.label}`}
					>
						<title>Constellation de {constellation.label}</title>
						{/* Fond étoilé */}
						{BG_STARS.map((s, i) => (
							<circle key={i} cx={s.x} cy={s.y} r={s.r} fill='white' opacity={s.opacity} />
						))}

						{/* Lignes de connexion */}
						{[...constellation.connections].map((key) => {
							const [a, b] = key.split('-')
							const starA = getStarById(a)
							const starB = getStarById(b)
							if (!starA || !starB) return null

							const isFound = constellation.interactive ? connections.has(key) : true
							return (
								<line
									key={key}
									id={`line-${key}`}
									className='constellation-line'
									x1={starA.x}
									y1={starA.y}
									x2={starB.x}
									y2={starB.y}
									stroke={constellation.interactive ? (isFound ? '#818cf8' : 'transparent') : '#818cf8'}
									strokeWidth={2}
									strokeLinecap='round'
								/>
							)
						})}

						{/* Halo de sélection (mode interactif) */}
						{selectedStar &&
							(() => {
								const star = getStarById(selectedStar)
								if (!star) return null
								return (
									<circle
										cx={star.x}
										cy={star.y}
										r={20}
										fill='none'
										stroke='#fbbf24'
										strokeWidth={1.5}
										opacity={0.5}
										className='animate-pulse'
									/>
								)
							})()}

						{/* Étoiles principales */}
						{constellation.stars.map((star) => {
							const isSelected = selectedStar === star.id
							return (
								// biome-ignore lint/a11y/noStaticElementInteractions: SVG group used as interactive star
								<g
									key={star.id}
									id={`star-${star.id}`}
									className={`main-star ${constellation.interactive ? 'cursor-pointer' : ''}`}
									onClick={() => handleStarClick(star.id)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') handleStarClick(star.id)
									}}
								>
									{constellation.interactive && (
										<circle cx={star.x} cy={star.y} r={20} fill='transparent' />
									)}
									<circle
										cx={star.x}
										cy={star.y}
										r={12}
										fill={isSelected ? '#fbbf24' : '#818cf8'}
										opacity={isSelected ? 0.3 : 0.15}
									/>
									<circle
										cx={star.x}
										cy={star.y}
										r={5}
										fill={isSelected ? '#fbbf24' : '#c7d2fe'}
										className='star-core transition-colors duration-200'
									/>
									<text
										x={star.x}
										y={star.y - 18}
										textAnchor='middle'
										fill={isSelected ? '#fbbf24' : '#a5b4fc'}
										fontSize={11}
										fontFamily='sans-serif'
										opacity={0.8}
									>
										{star.name}
									</text>
								</g>
							)
						})}
					</svg>
				</div>

				{/* Message de succès */}
				{showSuccess && (
					<div className='success-msg opacity-0 translate-y-4 text-center space-y-4'>
						<div className='bg-indigo-950/80 border border-amber-500/30 p-6 rounded-2xl shadow-lg'>
							<p className='text-2xl text-white font-light mb-2'>✨ Constellation révélée ✨</p>
							<p className='text-indigo-300'>Les étoiles s'alignent pour toi</p>
						</div>
						<button
							type='button'
							onClick={handleContinue}
							className='px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-light tracking-wide text-lg shadow-lg hover:shadow-xl transform hover:scale-105'
						>
							Les étoiles t'offrent quelque chose...
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
