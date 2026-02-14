import { useState } from 'preact/hooks'
import Conclusion from './components/conclusion'
import Introduction from './components/intro'
import Enigma1 from './components/riddle1'
import Enigma2 from './components/riddle2'
import Enigma3 from './components/riddle3'

// Active le mode DEBUG pour naviguer entre les énigmes
const DEBUG_MODE = localStorage.getItem('valentineDebug') === 'true' || false

export function App() {
	const [currentStep, setCurrentStep] = useState('intro')
	const [userName, setUserName] = useState(localStorage.getItem('valentineName') || 'Luminia')

	return (
		<main>
			{/* Menu DEBUG - Affiché en haut si DEBUG_MODE est activé */}
			{DEBUG_MODE && (
				<div className='fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-2xl border border-gray-700'>
					<p className='text-xs font-bold mb-2 text-yellow-400'>🐛 DEBUG MODE</p>
					<div className='flex flex-col gap-2'>
						<button
							type='button'
							onClick={() => setCurrentStep('intro')}
							className={`px-3 py-1.5 text-xs rounded transition-all ${
								currentStep === 'intro'
									? 'bg-purple-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
							}`}
						>
							Intro
						</button>
						<button
							type='button'
							onClick={() => setCurrentStep('enigma1')}
							className={`px-3 py-1.5 text-xs rounded transition-all ${
								currentStep === 'enigma1'
									? 'bg-purple-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
							}`}
						>
							Énigme 1
						</button>
						<button
							type='button'
							onClick={() => setCurrentStep('enigma2')}
							className={`px-3 py-1.5 text-xs rounded transition-all ${
								currentStep === 'enigma2'
									? 'bg-purple-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
							}`}
						>
							Énigme 2
						</button>
						<button
							type='button'
							onClick={() => setCurrentStep('enigma3')}
							className={`px-3 py-1.5 text-xs rounded transition-all ${
								currentStep === 'enigma3'
									? 'bg-purple-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
							}`}
						>
							Énigme 3
						</button>
						<button
							type='button'
							onClick={() => setCurrentStep('end')}
							className={`px-3 py-1.5 text-xs rounded transition-all ${
								currentStep === 'end'
									? 'bg-purple-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
							}`}
						>
							Fin
						</button>
					</div>
				</div>
			)}

			{currentStep === 'intro' && (
				<Introduction
					onComplete={(name: string) => {
						setUserName(name)
						setCurrentStep('enigma1')
					}}
				/>
			)}

			{currentStep === 'enigma1' && (
				<Enigma1
					userName={userName}
					onComplete={() => {
						setCurrentStep('enigma2')
					}}
				/>
			)}

			{currentStep === 'enigma2' && (
				<Enigma2
					userName={userName}
					onComplete={() => {
						setCurrentStep('enigma3')
					}}
				/>
			)}

			{currentStep === 'enigma3' && (
				<Enigma3
					userName={userName}
					onComplete={() => {
						setCurrentStep('end')
					}}
				/>
			)}

			{currentStep === 'end' && <Conclusion userName={userName} />}
		</main>
	)
}
