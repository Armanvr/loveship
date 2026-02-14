import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'preact/hooks'

interface ConclusionProps {
	userName: string
}

const LETTER_TEXT = `Tu as complété toutes les énigmes pour enfin trouver cette lettre. J’espère tout d’abord que ce cadeau interactif t’a plus. Ça ne vaut pas une lettre manuscrite, je te l’accorde mais la valeur sentimentale est identique. 

Toutes les choses marquantes que tu as pu croiser au fil de ces énigmes sont des moments que tu as marqué dans mon cœur tant par ton amitié, par ton intérêt ou par ton amour. Je ne l’ai peut être pas encore dit, mais tu es devenu petit à petit le principal phare de ma vie. Tu es au delà de gentille, sincère, calme, douce et aimante. Tu me rappelles parfois ce lointain fragment de mes rêves mais sans l’être vraiment. Certains diront « une réincarnation ». Je préfère le terme « simili ». Un terme qui, dans le jeu vidéo Kingdom Hearts, définit une personne venant d’un même cœur. Tu partages ce cœur pour moi, et le mien par la même occasion. Je vais sans doute reprendre les mots de ton père, mais nous avions besoin de l’un et l’autre : en tant d’amis, en tant qu’amants et en tant que partenaire de vie.

Je ne sais pas combien de temps ça va durer, combien de temps je vais t’avoir dans mes bras ou combien de temps tu vas me supporter, mais une chose est sûre : c’est que tu es la première à qui je peux confier ma vie les yeux fermés. Ce n’est pas qu’une amie que j’ai trouvé cette année passée, c’est une confidente, une âme charitable et aimante, une personne pleine d’amour prête à en donner et à en recevoir, et surtout l’incarnation que j’ai peut être toujours attendu… 

Peut être que ça ne se voit pas, mais sous mes airs d’être confiant et de dieu salvateur (oui les chevilles, mais j’aime !), j’ai mes défauts et mes démons, qui continuent à me dire que je fauterai un jour et je te perdrai. Eh bien aujourd’hui je lève le doute pour toi et pour eux : je n’ai pas peur de fauter si le prix final, c’est de pouvoir dormir dans tes bras. 

Joyeuse première saint Valentin mon coeur, en espérant en vivre d’autres à tes côtés ❤️`

export default function Conclusion({ userName }: ConclusionProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [showLetter, setShowLetter] = useState(false)
	const [clickCount, setClickCount] = useState(0)
	const [showEnvelope, setShowEnvelope] = useState(true)
	const containerRef = useRef<HTMLDivElement>(null)
	const sealRef = useRef<HTMLButtonElement>(null)
	const letterRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		gsap.from(containerRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power2.out',
		})

		// Pulsation subtile du sceau
		gsap.to(sealRef.current, {
			scale: 1.05,
			duration: 1.5,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
		})
	}, [])

	const handleSealClick = () => {
		if (isOpen) return

		const newCount = clickCount + 1
		setClickCount(newCount)

		// Effet de fissure progressif à chaque clic
		gsap.to(sealRef.current, {
			scale: 1 + newCount * 0.1,
			rotation: newCount * 15,
			duration: 0.2,
			ease: 'back.out(2)',
		})

		// Si moins de 3 clics, on attend
		if (newCount < 3) return

		// 3 clics atteints - ouverture
		setIsOpen(true)
		gsap.killTweensOf(sealRef.current)

		// Le sceau se brise
		gsap.to(sealRef.current, {
			scale: 0,
			opacity: 0,
			rotation: 180,
			duration: 0.5,
			ease: 'power2.in',
			onComplete: () => {
				// Faire disparaître l'enveloppe SVG
				gsap.to('.envelope-svg', {
					opacity: 0,
					duration: 0.5,
					onComplete: () => {
						setShowLetter(true)
						setShowEnvelope(false)
					},
				})

				setTimeout(() => {
					// Animer l'apparition de la lettre
					gsap.to(letterRef.current, {
						opacity: 1,
						minHeight: 'auto',
						height: 'auto',
						duration: 0.8,
						ease: 'power2.in',
						onComplete: () => {
							// Texte apparaît ligne par ligne
							gsap.to('.letter-line', {
								opacity: 1,
								display: 'block',
								y: 0,
								duration: 0.4,
								stagger: 0.15,
								ease: 'power2.out',
							})
							localStorage.setItem('valentineDebug', 'true')
						},
					})
				}, 100)
			},
		})
	}

	const name = (
		<>
			Pour toi, ma chère
			<span className='font-bold text-rose-500 text-4xl'> {userName} </span>
		</>
	)

	const sealText = (
		<>
			Brise le sceau pour découvrir ton message,
			<span className='font-bold text-rose-500 text-2xl'> {userName} </span>
		</>
	)

	return (
		<div
			ref={containerRef}
			className='min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-6'
		>
			<div className='max-w-3xl w-full text-center space-y-8'>
				{/* Titre */}
				<div className='space-y-3'>
					<h2 className='text-3xl font-light text-gray-800'>{isOpen ? name : "Un message t'attend"}</h2>
					{!isOpen && <p className='text-sm text-gray-500'>{sealText}</p>}
				</div>

				{/* Enveloppe */}
				<div className='envelope-wrapper relative mx-auto w-[800px] h-auto'>
					{/* Lettre (derrière l'enveloppe, monte quand ouverte) */}
					<div
						ref={letterRef}
						className={`text-left bg-white rounded-tl-4xl rounded-br-4xl shadow-xl p-10 ${showLetter ? 'opacity-100' : 'opacity-0'}`}
						style={{ minHeight: showLetter ? 200 : 0, height: showLetter ? 'auto' : 0 }}
					>
						<p
							className='letter-line opacity-0 translate-y-2 text-base text-gray-700 leading-relaxed font-light whitespace-pre-line'
							style={{ display: showLetter ? 'block' : 'none' }}
						>
							{LETTER_TEXT}
						</p>
					</div>

					{/* Enveloppe SVG */}
					<svg
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 512 512'
						role='img'
						aria-label='Enveloppe'
						class={`envelope-svg mx-auto ${showEnvelope ? 'block' : 'hidden'}`}
						style={{ width: 320, height: 220 }}
					>
						<path d='m87.742 120.05-84.05 61.491V512h504.616V181.541l-84.05-61.491' style='fill:#e8bb51' />
						<path
							d='M508.307 181.542v.012l-84.042 61.479-132.908 97.245-35.35-25.866-35.35 25.866-132.909-97.245-84.053-61.491 84.053-61.492h336.517z'
							style='fill:#d1a13e'
						/>
						<path
							d='M424.258 0v243.029l-134.617 98.5-33.642-24.609-33.641 24.609-134.617-98.5V0z'
							style='fill:#f0e9dd'
						/>
						<path
							d='M424.258 210.995v32.034l-134.617 98.5-33.642-24.609-33.642 24.609-134.617-98.5v-32.034l130.45 95.452a7.06 7.06 0 0 0 8.335 0l25.307-18.513a7.06 7.06 0 0 1 8.334 0l25.307 18.513a7.06 7.06 0 0 0 8.335 0z'
							style='fill:#cec4bc'
						/>
						<path
							d='m451.682 458.338-12.288-10.462c-8.193-6.975-16.489-13.807-24.787-20.637-16.624-13.624-33.422-27.009-50.318-40.259-16.891-13.257-33.942-26.297-51.055-39.251l-25.761-19.307-25.912-19.1c-3.218-2.368-7.74-2.497-11.124 0l-25.905 19.111c-8.584 6.441-17.213 12.82-25.759 19.311-17.12 12.947-34.157 26.006-51.057 39.253-16.895 13.254-33.694 26.638-50.321 40.259-8.3 6.828-16.598 13.659-24.793 20.631L60.31 458.345c-4.05 3.551-8.145 7.04-12.154 10.648 4.652-2.729 9.216-5.576 13.826-8.361l13.687-8.552c9.125-5.701 18.147-11.542 27.167-17.387 18.013-11.726 35.854-23.686 53.599-35.778 17.74-12.097 35.345-24.382 52.867-36.78 8.773-6.181 17.465-12.473 26.202-18.705l20.493-14.867 20.486 14.88 26.197 18.711c17.526 12.39 35.113 24.696 52.861 36.785 17.743 12.094 35.583 24.054 53.598 35.776 9.021 5.843 18.044 11.682 27.171 17.38l13.69 8.546c4.612 2.783 9.178 5.628 13.831 8.354-4.007-3.613-8.101-7.103-12.149-10.657'
							style='fill:#d1a13e'
						/>
						<path
							d='M256.001 269.53c86.172-44.267 91.917-134.382 61.277-142.286-30.639-7.905-61.277 37.943-61.277 37.943s-30.639-45.847-61.277-37.943c-30.64 7.904-24.895 98.019 61.277 142.286M150.306 43.07c-3.408 1.202-6.03 3.357-7.672 5.867-1.643 2.519-2.303 5.336-2.04 7.839.059.621.149 1.256.34 1.819.109.584.393 1.104.597 1.616.555.979 1.121 1.865 1.918 2.559.81.668 1.632 1.264 2.565 1.648a9.9 9.9 0 0 0 2.818.654c.931.016 1.822-.029 2.638-.319.21-.024.401-.166.599-.226.195-.087.399-.112.582-.247q.28-.166.562-.3l1.067-.55a431 431 0 0 1 9.319-4.677 476 476 0 0 1 18.917-8.708 467 467 0 0 1 19.278-7.877 422 422 0 0 1 9.781-3.612l.614-.22.715-.245 1.891-.58c.621-.207 1.286-.29 1.933-.41.653-.095 1.294-.247 1.957-.247 2.633-.211 5.251.167 7.707.866 4.899 1.505 9.065 4.779 11.572 9.028 1.259 2.122 2.046 4.487 2.411 6.848.109 1.196.227 2.373.111 3.535a15 15 0 0 1-.496 3.375c-1.103 4.398-3.821 8.106-7.242 10.335-3.396 2.267-7.495 3.087-11.026 2.309 3.408-1.208 6.025-3.367 7.663-5.877 1.638-2.519 2.294-5.334 2.028-7.831-.055-.619-.15-1.254-.34-1.815-.109-.583-.394-1.1-.599-1.61-.55-.977-1.119-1.86-1.914-2.55-.81-.663-1.623-1.263-2.558-1.642-.938-.358-1.884-.587-2.809-.652-.928-.015-1.815.031-2.628.323-.209.025-.401.16-.598.221-.195.087-.398.112-.579.247q-.279.166-.559.3l-1.068.548a418 418 0 0 1-9.32 4.673 465 465 0 0 1-18.925 8.692 476 476 0 0 1-19.286 7.86 428 428 0 0 1-9.782 3.608l-1.33.462-1.888.58c-.621.207-1.285.29-1.931.411-.652.098-1.294.242-1.956.244-2.629.212-5.245-.166-7.698-.863-4.889-1.512-9.057-4.769-11.557-9.02-1.257-2.119-2.049-4.48-2.407-6.839-.109-1.195-.229-2.369-.113-3.53.043-1.168.198-2.271.496-3.372 1.099-4.393 3.813-8.099 7.23-10.329 3.387-2.268 7.481-3.089 11.012-2.319M361.694 43.07c3.531-.77 7.625.052 11.016 2.319 3.417 2.229 6.13 5.936 7.23 10.329.298 1.1.452 2.203.496 3.372.116 1.161-.003 2.335-.113 3.53-.358 2.359-1.151 4.72-2.407 6.839-2.5 4.251-6.668 7.507-11.557 9.02-2.453.697-5.069 1.074-7.698.863-.662-.001-1.303-.146-1.956-.244-.647-.119-1.311-.202-1.931-.411l-1.888-.58-1.33-.462a427 427 0 0 1-9.782-3.608 477 477 0 0 1-19.286-7.86 465 465 0 0 1-18.925-8.692 418 418 0 0 1-9.32-4.673l-1.068-.548a7 7 0 0 1-.559-.3c-.181-.136-.386-.162-.579-.247-.198-.063-.389-.196-.598-.221-.813-.29-1.701-.337-2.629-.323-.925.065-1.872.294-2.809.652-.935.379-1.749.979-2.558 1.642-.795.69-1.364 1.573-1.914 2.55-.203.51-.49 1.029-.599 1.61-.191.562-.285 1.196-.34 1.815-.266 2.497.389 5.313 2.028 7.831 1.638 2.51 4.255 4.668 7.663 5.877-3.531.776-7.63-.043-11.026-2.309-3.422-2.229-6.139-5.938-7.242-10.335a15 15 0 0 1-.496-3.375c-.117-1.162.001-2.339.111-3.535.363-2.36 1.151-4.726 2.411-6.848 2.507-4.25 6.674-7.522 11.572-9.028 2.456-.698 5.074-1.077 7.707-.866.663 0 1.304.152 1.957.247.647.119 1.313.202 1.933.41l1.891.58.715.245.614.22a413 413 0 0 1 9.781 3.612 464 464 0 0 1 19.278 7.877 476 476 0 0 1 18.917 8.708 427 427 0 0 1 9.319 4.677l1.067.55q.281.135.562.3c.182.136.387.162.582.247.2.059.391.202.599.226.817.29 1.707.335 2.638.319a9.8 9.8 0 0 0 2.818-.654c.933-.384 1.755-.98 2.565-1.648.798-.692 1.363-1.58 1.918-2.559.203-.511.489-1.031.597-1.616.191-.563.28-1.198.34-1.819.263-2.502-.397-5.32-2.04-7.839-1.645-2.511-4.267-4.665-7.675-5.867'
							style='fill:#e77763'
						/>
					</svg>

					{/* Sceau de cire */}
					<button
						type='button'
						ref={sealRef}
						onClick={handleSealClick}
						className='absolute z-40 cursor-pointer'
						style={{ top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }}
					>
						<div className='w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 shadow-lg flex items-center justify-center border-2 border-red-600/50'>
							<span className='text-amber-200 text-2xl'>♥</span>
						</div>
					</button>
				</div>
			</div>
		</div>
	)
}
