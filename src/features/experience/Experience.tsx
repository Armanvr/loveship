import { useEffect, useState } from 'preact/hooks'
import { AudioControl } from '../../components/audio/AudioControl'
import { Bouquet } from '../../components/bouquet/Bouquet'
import { FooterActions } from '../../components/common/FooterActions'
import { IntroOverlay } from '../../components/envelopes/IntroOverlay'
import { Keepsake } from '../../components/keepsake/Keepsake'
import { Letter } from '../../components/letter/Letter'
import { SecondEnvelopeSection } from '../../components/promise/SecondEnvelopeSection'
import { useExperience } from './context'
import { isAtLeast } from './reducer'

/** Une seule page qui s'allonge : tout ce qui est découvert reste dans le document, le défilement est natif. */
export function Experience() {
	const { state } = useExperience()
	// L'overlay de la première enveloppe survit à ENVELOPE_OPENED le temps de son retrait, puis se démonte.
	const [overlay, setOverlay] = useState(state.step === 'INTRODUCTION')
	useEffect(() => {
		if (state.step === 'INTRODUCTION') setOverlay(true)
	}, [state.step])

	const reached = (step: Parameters<typeof isAtLeast>[1]) => isAtLeast(state, step)

	return (
		<>
			<main>
				{reached('LETTER') && <Letter />}
				{reached('LETTER') && <SecondEnvelopeSection />}
				{reached('PROMISE') && <Bouquet />}
				{reached('BOUQUET') && <Keepsake />}
				{reached('LETTER') && <FooterActions />}
			</main>
			<AudioControl />
			{overlay && (
				<IntroOverlay
					onDone={() => {
						setOverlay(false)
						document.getElementById('lettre')?.focus({ preventScroll: true })
					}}
				/>
			)}
		</>
	)
}
