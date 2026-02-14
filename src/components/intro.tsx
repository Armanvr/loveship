import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'preact/hooks'

export default function Introduction({ onComplete }: { onComplete: (name: string) => void }) {
	const [name, setName] = useState('')
	const [isValidName, setIsValidName] = useState(false)
	const [showError, setShowError] = useState(false)
	const [showHeart, setShowHeart] = useState(false)
	const [heartRevealed, setHeartRevealed] = useState(false)
	const heartRef = useRef(null)
	const buttonRef = useRef(null)
	const containerRef = useRef(null)
	const errorRef = useRef(null)

	useEffect(() => {
		// Charger le nom depuis localStorage
		const savedName = localStorage.getItem('valentineName')
		if (savedName && savedName.toLowerCase() === 'victoria') {
			setName(savedName)
			setIsValidName(true)
		}

		// Animation d'entrée
		gsap.from(containerRef.current, {
			opacity: 0,
			y: 30,
			duration: 1,
			ease: 'power3.out',
		})
	}, [])

	const handleNameChange = (e: Event) => {
		const value = (e.target as HTMLInputElement).value
		setName(value)
		setShowError(false)
	}

	const handleNameSubmit = (e: Event) => {
		e.preventDefault()

		if (name.trim().toLowerCase() === 'victoria') {
			setIsValidName(true)
			localStorage.setItem('valentineName', name)

			// Animation du message de bienvenue
			gsap.from('.welcome-message', {
				opacity: 0,
				y: 20,
				duration: 0.8,
				ease: 'power2.out',
			})
		} else {
			setShowError(true)

			// Animation de l'erreur
			if (errorRef.current) {
				gsap.fromTo(
					errorRef.current,
					{ x: -10 },
					{
						x: 10,
						duration: 0.1,
						repeat: 5,
						yoyo: true,
						ease: 'power1.inOut',
						onComplete: () => {
							gsap.set(errorRef.current, { x: 0 })
						},
					},
				)
			}
		}
	}

	const handleHeartReveal = () => {
		if (!heartRevealed) {
			setHeartRevealed(true)

			// Animation du cœur
			gsap.fromTo(
				heartRef.current,
				{ scale: 0, rotation: -180 },
				{
					scale: 1,
					rotation: 0,
					duration: 0.8,
					ease: 'elastic.out(1, 0.5)',
				},
			)

			// Animation du bouton qui apparaît
			setTimeout(() => {
				gsap.fromTo(
					buttonRef.current,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
				)
			}, 500)
		}
	}

	const handleContinue = () => {
		if (name.trim()) {
			gsap.to(containerRef.current, {
				opacity: 0,
				y: -30,
				duration: 0.5,
				onComplete: () => onComplete(name),
			})
		}
	}

	return (
		<div
			ref={containerRef}
			className='min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-8'
		>
			<div className='max-w-md w-full space-y-8 text-center'>
				{!isValidName && (
					<>
						{/* Titre */}
						<div className='space-y-2'>
							<h1 className='text-4xl font-light text-gray-800 tracking-wide'>Un voyage pour toi</h1>
						</div>
					</>
				)}

				{/* Champ de saisie - affiché seulement si le nom n'est pas validé */}
				{!isValidName && (
					<form onSubmit={handleNameSubmit} className='space-y-3'>
						<label htmlFor='name' className='block text-sm text-gray-600'>
							Avant de commencer, dis-moi ton prénom
						</label>
						<div className='space-y-2'>
							<input
								id='name'
								type='text'
								value={name}
								onInput={handleNameChange}
								placeholder='Ton prénom...'
								className={`w-full px-4 py-3 text-center border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white/50 backdrop-blur-sm ${
									showError
										? 'border-red-300 focus:ring-red-300'
										: 'border-gray-200 focus:ring-rose-300'
								}`}
							/>
							{showError && (
								<p ref={errorRef} className='text-red-500 text-sm'>
									Ce n'est pas vous que j'attends
								</p>
							)}
						</div>
						<button
							type='submit'
							className='w-full px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-300 font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed'
							disabled={!name.trim()}
						>
							Continuer
						</button>
					</form>
				)}

				{/* Message de bienvenue et zone du cœur - affichés après validation */}
				{isValidName && (
					<>
						<div className='welcome-message space-y-8 pt-4'>
							<p className='text-2xl font-light text-gray-700'>
								Je t'attendais <span className='font-bold text-rose-500 block text-6xl'>{name}</span>
							</p>

							{!heartRevealed && (
								<p className='text-sm text-gray-500'>Explore cette page, quelque chose t'attend...</p>
							)}
						</div>

						{/* Zone hover avec le cœur */}
						<div className='pt-8'>
							<button
								type='button'
								onMouseEnter={() => setShowHeart(true)}
								onMouseLeave={() => setShowHeart(false)}
								onClick={handleHeartReveal}
								className='relative inline-block cursor-pointer position-absolute top-50 left-90'
							>
								{/* Texte indicateur */}
								<div
									className={`
                  px-6 py-3 rounded-lg transition-all duration-300
                  ${showHeart || heartRevealed ? 'bg-rose-100 text-rose-700' : 'text-rose-100 hover:bg-gray-200'}
                `}
								>
									{heartRevealed ? '✨ Trouvé !' : '?'}
								</div>

								{/* Cœur qui apparaît */}
								{(showHeart || heartRevealed) && (
									<div
										ref={heartRef}
										className='absolute -top-12 left-1/2 -translate-x-1/2 text-6xl'
										style={{ transformOrigin: 'center' }}
									>
										❤️
									</div>
								)}
							</button>
						</div>

						{/* Bouton continuer */}
						{heartRevealed && (
							<button
								type='button'
								ref={buttonRef}
								onClick={handleContinue}
								className='opacity-0 mt-8 px-8 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-300 font-light tracking-wide'
							>
								Commencer le voyage →
							</button>
						)}
					</>
				)}
			</div>
		</div>
	)
}
