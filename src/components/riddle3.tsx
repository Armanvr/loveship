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

const STARS: Star[] = [
	{ id: 'betelgeuse', name: 'Bételgeuse', x: 280, y: 120 },
	{ id: 'bellatrix', name: 'Bellatrix', x: 520, y: 130 },
	{ id: 'alnitak', name: 'Alnitak', x: 350, y: 290 },
	{ id: 'alnilam', name: 'Alnilam', x: 400, y: 285 },
	{ id: 'mintaka', name: 'Mintaka', x: 450, y: 280 },
	{ id: 'saiph', name: 'Saiph', x: 320, y: 470 },
	{ id: 'rigel', name: 'Rigel', x: 500, y: 460 },
]

// Les 7 connexions correctes (paires triées par id)
const CORRECT_CONNECTIONS = new Set([
	'bellatrix-betelgeuse',
	'alnitak-betelgeuse',
	'bellatrix-mintaka',
	'alnilam-alnitak',
	'alnilam-mintaka',
	'alnitak-saiph',
	'mintaka-rigel',
])

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
	const [selectedStar, setSelectedStar] = useState<string | null>(null)
	const [connections, setConnections] = useState<Set<string>>(new Set())
	const [isComplete, setIsComplete] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)

	useEffect(() => {
		gsap.from(containerRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power2.out',
		})

		// Animer l'apparition des étoiles
		gsap.from('.main-star', {
			scale: 0,
			opacity: 0,
			duration: 0.6,
			stagger: 0.08,
			delay: 0.5,
			ease: 'back.out(2)',
			transformOrigin: 'center center',
		})
	}, [])

	const handleStarClick = (starId: string) => {
		if (isComplete) return

		if (!selectedStar) {
			// Première sélection
			setSelectedStar(starId)
			gsap.to(`#star-${starId}`, {
				scale: 1.4,
				duration: 0.3,
				ease: 'back.out(2)',
				transformOrigin: 'center center',
			})
		} else if (selectedStar === starId) {
			// Désélection
			setSelectedStar(null)
			gsap.to(`#star-${starId}`, {
				scale: 1,
				duration: 0.3,
				ease: 'power2.out',
				transformOrigin: 'center center',
			})
		} else {
			// Tenter une connexion
			const key = connectionKey(selectedStar, starId)

			if (connections.has(key)) {
				// Déjà connecté, juste désélectionner
				gsap.to(`#star-${selectedStar}`, {
					scale: 1,
					duration: 0.3,
					transformOrigin: 'center center',
				})
				setSelectedStar(null)
				return
			}

			if (CORRECT_CONNECTIONS.has(key)) {
				// Bonne connexion
				const newConnections = new Set(connections)
				newConnections.add(key)
				setConnections(newConnections)

				// Animer la ligne
				const lineEl = document.getElementById(`line-${key}`)
				if (lineEl) {
					const length = (lineEl as unknown as SVGLineElement).getTotalLength?.() || 200
					gsap.fromTo(
						lineEl,
						{ strokeDasharray: length, strokeDashoffset: length },
						{ strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' },
					)
				}

				// Pulse sur les deux étoiles
				gsap.to(`#star-${starId}`, {
					scale: 1.3,
					duration: 0.2,
					yoyo: true,
					repeat: 1,
					ease: 'back.out(2)',
					transformOrigin: 'center center',
				})

				// Désélectionner
				gsap.to(`#star-${selectedStar}`, {
					scale: 1,
					duration: 0.3,
					transformOrigin: 'center center',
				})
				setSelectedStar(null)

				// Vérifier si complet
				if (newConnections.size === CORRECT_CONNECTIONS.size) {
					setIsComplete(true)
					setTimeout(() => {
						// Toutes les lignes brillent
						gsap.to('.constellation-line', {
							stroke: '#fbbf24',
							strokeWidth: 3,
							duration: 0.8,
							ease: 'power2.out',
						})
						gsap.to('.main-star circle', {
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
				// Mauvaise connexion — shake les deux étoiles
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

	const getStarById = (id: string) => STARS.find((s) => s.id === id)

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
						Relie les étoiles d'Orion, <span className='font-bold text-amber-400'>{userName}</span>
					</p>
					<p className='text-sm text-indigo-400/70'>
						Clique sur une étoile, puis sur une autre pour les relier
					</p>
				</div>

				{/* Compteur */}
				<div className='text-center'>
					<p className='text-2xl font-light text-white'>
						<span className='text-amber-400 font-medium'>{connections.size}</span>
						<span className='text-indigo-400'> / {CORRECT_CONNECTIONS.size}</span>
					</p>
				</div>

				{/* SVG Constellation */}
				<div className='bg-gray-950/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-indigo-900/30 overflow-hidden'>
					<svg
						ref={svgRef}
						viewBox='0 0 800 600'
						className='w-full'
						style={{ maxHeight: '60vh' }}
						role='img'
						aria-label='Constellation d&#39;Orion'
					>
						<title>Constellation d'Orion</title>
						{/* Fond étoilé */}
						{BG_STARS.map((s, i) => (
							<circle key={i} cx={s.x} cy={s.y} r={s.r} fill='white' opacity={s.opacity} />
						))}

						{/* Lignes de connexion (toutes pré-rendues, visibles quand trouvées) */}
						{[...CORRECT_CONNECTIONS].map((key) => {
							const [a, b] = key.split('-')
							const starA = getStarById(a)
							const starB = getStarById(b)
							if (!starA || !starB) return null
							const isFound = connections.has(key)
							return (
								<line
									key={key}
									id={`line-${key}`}
									className='constellation-line'
									x1={starA.x}
									y1={starA.y}
									x2={starB.x}
									y2={starB.y}
									stroke={isFound ? '#818cf8' : 'transparent'}
									strokeWidth={2}
									strokeLinecap='round'
								/>
							)
						})}

						{/* Ligne temporaire depuis l'étoile sélectionnée */}
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
						{STARS.map((star) => {
							const isSelected = selectedStar === star.id
							return (
								// biome-ignore lint/a11y/noStaticElementInteractions: SVG group used as interactive star
								<g
									key={star.id}
									id={`star-${star.id}`}
									className='main-star cursor-pointer'
									onClick={() => handleStarClick(star.id)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') handleStarClick(star.id)
									}}
								>
									{/* Zone de clic élargie */}
									<circle cx={star.x} cy={star.y} r={20} fill='transparent' />
									{/* Halo */}
									<circle
										cx={star.x}
										cy={star.y}
										r={12}
										fill={isSelected ? '#fbbf24' : '#818cf8'}
										opacity={isSelected ? 0.3 : 0.15}
									/>
									{/* Étoile */}
									<circle
										cx={star.x}
										cy={star.y}
										r={5}
										fill={isSelected ? '#fbbf24' : '#c7d2fe'}
										className='transition-colors duration-200'
									/>
									{/* Nom */}
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
				{isComplete && (
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
