import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'preact/hooks'

interface Enigma2Props {
	userName: string
	onComplete: () => void
}

export default function Enigma2({ userName, onComplete }: Enigma2Props) {
	const [wheels, setWheels] = useState([0, 0, 0, 0])
	const [attempts, setAttempts] = useState(0)
	const [showHint, setShowHint] = useState(false)
	const [feedback, setFeedback] = useState<('correct' | 'wrong' | 'none')[]>(['none', 'none', 'none', 'none'])
	const [isUnlocked, setIsUnlocked] = useState(false)
	const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set())
	const [wrongLetters, setWrongLetters] = useState<Set<string>>(new Set())
	const [remainingLives, setRemainingLives] = useState(5)
	const [isPhraseComplete, setIsPhraseComplete] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const lockRef = useRef<HTMLDivElement>(null)

	const KEYBOARD_ROWS = [
		['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
		['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
		['w', 'x', 'c', 'v', 'b', 'n'],
	]

	// Le code correct : [1, 6, 9, 3]
	const correctCode = [1, 6, 9, 3]

	// La phrase correcte à trouver
	const correctPhrase = "tu es la plus belle personne qui m'a été donné de rencontrer"
	const correctPhraseChars = correctPhrase.split('')

	useEffect(() => {
		// Animation d'entrée
		gsap.from(containerRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power2.out',
		})

		gsap.from('.enigma-card', {
			opacity: 0,
			y: 30,
			duration: 0.8,
			delay: 0.3,
			ease: 'power3.out',
		})

		gsap.from('.wheel', {
			opacity: 0,
			scale: 0.8,
			duration: 0.6,
			stagger: 0.1,
			delay: 0.6,
			ease: 'back.out(1.7)',
		})
	}, [])

	const handleWheelChange = (index: number, delta: number) => {
		const newWheels = [...wheels]
		newWheels[index] = (newWheels[index] + delta + 10) % 10
		setWheels(newWheels)
	}

	const checkCode = () => {
		const newFeedback: ('correct' | 'wrong' | 'none')[] = wheels.map((wheel, index) => {
			if (wheel === correctCode[index]) {
				return 'correct'
			}
			return 'wrong'
		})

		setFeedback(newFeedback)
		setAttempts(attempts + 1)

		// Vérifier si tout est correct
		if (newFeedback.every((f) => f === 'correct')) {
			setIsUnlocked(true)

			// Initialiser le jeu de pendu
			setGuessedLetters(new Set())
			setWrongLetters(new Set())
			setRemainingLives(5)

			// Animation de succès
			gsap.to(lockRef.current, {
				scale: 1.1,
				duration: 0.3,
				ease: 'back.out(2)',
				yoyo: true,
				repeat: 1,
			})

			setTimeout(() => {
				gsap.to('.success-reveal', {
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power2.out',
				})
			}, 500)
		} else {
			// Animation d'erreur
			gsap.to(lockRef.current, {
				x: -10,
				duration: 0.1,
				repeat: 5,
				yoyo: true,
				ease: 'power1.inOut',
				onComplete: () => {
					gsap.set(lockRef.current, { x: 0 })
				},
			})
		}

		// Afficher l'indice après 3 tentatives
		if (attempts >= 2 && !showHint) {
			setShowHint(true)
		}
	}

	const handleContinue = () => {
		gsap.to(containerRef.current, {
			opacity: 0,
			duration: 0.5,
			onComplete: onComplete,
		})
	}

	const normalizeChar = (c: string) =>
		c
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()

	const handleLetterClick = (letter: string) => {
		if (isPhraseComplete || guessedLetters.has(letter) || wrongLetters.has(letter)) return

		// Exclure apostrophe et non-lettres des caractères à deviner
		const phraseLetters = new Set(
			correctPhraseChars.filter((c) => /[a-zA-ZÀ-ÿ]/.test(c) && c !== "'").map((c) => normalizeChar(c)),
		)

		if (phraseLetters.has(letter)) {
			// Bonne lettre
			const newGuessed = new Set(guessedLetters)
			newGuessed.add(letter)
			setGuessedLetters(newGuessed)

			const el = document.getElementById(`key-${letter}`)
			if (el) {
				gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
			}

			// Vérifier si toutes les lettres sont trouvées
			const allFound = [...phraseLetters].every((l) => newGuessed.has(l))
			if (allFound) {
				gsap.to('.hangman-game', {
					opacity: 0,
					height: 0,
					duration: 0.5,
					stagger: 0.05,
					ease: 'power2.out',
				})

				setIsPhraseComplete(true)
				setTimeout(() => {
					// Révéler la phrase finale avec animation gauche → droite
					gsap.to('.final-char', {
						opacity: 1,
						duration: 0.05,
						stagger: 0.04,
						ease: 'none',
					})

					setTimeout(
						() => {
							gsap.to('.final-button', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
						},
						correctPhrase.length * 40 + 200,
					)
				}, 400)
			}
		} else {
			// Mauvaise lettre
			const newWrong = new Set(wrongLetters)
			newWrong.add(letter)
			setWrongLetters(newWrong)
			const newLives = remainingLives - 1

			const el = document.getElementById(`key-${letter}`)
			if (el) {
				gsap.to(el, {
					x: -4,
					duration: 0.08,
					repeat: 4,
					yoyo: true,
					ease: 'power1.inOut',
					onComplete: () => {
						gsap.set(el, { x: 0 })
					},
				})
			}

			if (newLives <= 0) {
				// Plus de vies — reset après un délai
				setTimeout(() => {
					setGuessedLetters(new Set())
					setWrongLetters(new Set())
					setRemainingLives(5)
					gsap.from('.phrase-display', { opacity: 0, duration: 0.5, ease: 'power2.out' })
				}, 600)
			} else {
				setRemainingLives(newLives)
			}
		}
	}

	return (
		<div
			ref={containerRef}
			className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-6'
		>
			<div className='max-w-4xl w-full space-y-8'>
				{/* Titre */}
				<div className='text-center space-y-3'>
					<h2 className='text-4xl font-light text-gray-800'>Énigme 2</h2>
					<p className='text-lg text-gray-600'>
						Déverrouille le cadenas, <span className='font-bold text-rose-700'>{userName}</span>
					</p>
				</div>

				{/* Texte d'énigme */}
				<div className='enigma-card bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg'>
					<div className='prose prose-sm max-w-none text-center'>
						<p className='text-gray-700 leading-relaxed mb-6 italic'>
							"Quatre chiffres gardent le secret de mon cœur.
							<br />
							Trouve-les et découvre ce que je veux te dire..."
						</p>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm text-gray-600 bg-rose-50/50 rounded-xl p-4'>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>🌼</span>
								<p>Le chiffre que tu préfères entre tous</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>🌸</span>
								<p>Le jour où nos lèvres se sont rencontrées</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>🌺</span>
								<p>Le jour où je suis apparu sur cette planète</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>🏵️</span>
								<p>Combien de tes amis j'ai eu la chance de rencontrer</p>
							</div>
						</div>
					</div>
				</div>

				{/* Le cadenas */}
				<div ref={lockRef} className='flex justify-center'>
					<div className='bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl'>
						<div className='flex gap-4 mb-6'>
							{wheels.map((value, index) => (
								<div key={index} className='wheel flex flex-col items-center'>
									{/* Bouton + */}
									<button
										type='button'
										onClick={() => handleWheelChange(index, 1)}
										disabled={isUnlocked}
										className='w-16 h-10 bg-gradient-to-b from-gray-200 to-gray-300 rounded-t-lg hover:from-gray-300 hover:to-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center'
									>
										<span className='text-2xl text-gray-700'>▲</span>
									</button>

									{/* Roue de chiffre */}
									<div
										id={`wheel-${index}`}
										className={`w-16 h-20 flex items-center justify-center text-4xl font-bold rounded-lg my-2 shadow-lg transition-all duration-300 ${
											feedback[index] === 'correct'
												? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
												: feedback[index] === 'wrong'
													? 'bg-gradient-to-br from-red-400 to-red-500 text-white'
													: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
										}`}
									>
										{value}
									</div>

									{/* Bouton - */}
									<button
										type='button'
										onClick={() => handleWheelChange(index, -1)}
										disabled={isUnlocked}
										className='w-16 h-10 bg-gradient-to-b from-gray-300 to-gray-200 rounded-b-lg hover:from-gray-400 hover:to-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center'
									>
										<span className='text-2xl text-gray-700'>▼</span>
									</button>
								</div>
							))}
						</div>

						{/* Bouton valider */}
						{!isUnlocked && (
							<button
								type='button'
								onClick={checkCode}
								className='w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105'
							>
								🔓 Déverrouiller
							</button>
						)}

						{/* Compteur de tentatives */}
						<div className='text-center mt-4 text-sm text-gray-500'>
							{attempts > 0 && !isUnlocked && <p>Tentatives : {attempts}</p>}
						</div>
					</div>
				</div>

				{/* Indice après 3 tentatives */}
				{showHint && !isUnlocked && (
					<div className='text-center animate-pulse'>
						<div className='inline-block bg-yellow-100 text-yellow-800 px-6 py-3 rounded-lg shadow-md'>
							<p className='text-sm'>
								💡 <strong>Indice :</strong> Tous les chiffres sont inférieurs à 10
							</p>
						</div>
					</div>
				)}

				{/* Jeu du pendu */}
				{isUnlocked && (
					<div className='success-reveal opacity-0 translate-y-4 space-y-6'>
						{!isPhraseComplete && (
							<div className='hangman-game bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg space-y-6'>
								<p className='text-center text-gray-600'>Trouve la phrase cachée, lettre par lettre</p>

								<div className='flex justify-center gap-2'>
									{Array.from({ length: 5 }).map((_, i) => (
										<span
											key={i}
											className={`text-2xl transition-all duration-300 ${i < remainingLives ? 'opacity-100' : 'opacity-20'}`}
										>
											❤️
										</span>
									))}
								</div>

								<div className='phrase-display flex flex-wrap gap-x-4 gap-y-3 justify-center'>
									{correctPhrase.split(' ').map((word, wordIndex) => (
										<div key={wordIndex} className='flex gap-1'>
											{word.split('').map((char, charIndex) => {
												const isApostrophe = char === "'"
												const normalized = normalizeChar(char)
												const isRevealed = isApostrophe || guessedLetters.has(normalized)
												return (
													<div key={charIndex} className='flex flex-col items-center'>
														<span
															className={`text-xl font-bold w-7 text-center transition-all duration-300 ${
																isApostrophe
																	? 'text-gray-400'
																	: isRevealed
																		? 'text-rose-700'
																		: 'text-transparent'
															}`}
														>
															{isApostrophe ? "'" : isRevealed ? char.toUpperCase() : '_'}
														</span>
														{!isApostrophe && (
															<div className='w-7 h-0.5 bg-gray-400 mt-1' />
														)}
													</div>
												)
											})}
										</div>
									))}
								</div>

								<div className='space-y-2'>
									{KEYBOARD_ROWS.map((row, rowIndex) => (
										<div key={rowIndex} className='flex justify-center gap-1.5'>
											{row.map((letter) => {
												const isGuessed = guessedLetters.has(letter)
												const isWrong = wrongLetters.has(letter)
												return (
													<button
														key={letter}
														id={`key-${letter}`}
														type='button'
														onClick={() => handleLetterClick(letter)}
														disabled={isGuessed || isWrong || isPhraseComplete}
														className={`w-10 h-11 rounded-lg font-bold text-sm uppercase transition-all duration-200 shadow-md ${
															isGuessed
																? 'bg-green-400 text-white cursor-default'
																: isWrong
																	? 'bg-red-300 text-white cursor-default opacity-50'
																	: 'bg-white border-2 border-gray-200 text-gray-800 hover:border-rose-400 hover:bg-rose-50 active:scale-95'
														}`}
													>
														{letter}
													</button>
												)
											})}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Phrase finale révélée lettre par lettre gauche → droite */}
						{isPhraseComplete && (
							<div
								className={`bg-gradient-to-r from-rose-100 to-pink-100 p-8 rounded-2xl shadow-lg text-center w-full ${isPhraseComplete ? 'opacity-100' : 'opacity-0'}`}
							>
								<p className='text-gray-500 text-xs mb-4'>Tu as trouvé ✨</p>
								<div className='flex flex-wrap gap-x-3 gap-y-1 justify-center text-2xl font-light text-rose-800 italic'>
									{correctPhrase.split(' ').map((word, wi) => (
										<span key={wi} className='flex'>
											{word.split('').map((char, ci) => (
												<span key={ci} className='final-char opacity-0'>
													{wi === 0 && ci === 0 ? char.toUpperCase() : char}
												</span>
											))}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Bouton pour continuer */}
						{isPhraseComplete && (
							<div className='final-button opacity-0 translate-y-4 text-center'>
								<button
									type='button'
									onClick={handleContinue}
									className='px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 font-light tracking-wide text-lg shadow-lg hover:shadow-xl transform hover:scale-105'
								>
									Es tu prête à partir dans les étoiles ? →
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
