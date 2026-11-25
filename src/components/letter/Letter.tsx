import { Fragment } from 'preact'
import { useRef } from 'preact/hooks'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { useInkReveal } from '../../hooks/useInkReveal'
import { useOnReach } from '../../hooks/useOnReach'
import type { Mood, NarrativeBlock } from '../../types/content.ts'
import { Watercolor } from '../illustrations/Watercolor'
import { Photograph } from '../memories/Photograph'

// Un paragraphe = un bloc séparé par une ligne vide ; pour la poésie, une strophe (retours à la ligne préservés).
export const split = (content: string) =>
	content
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean)

/** Déclare l'ambiance atteinte quand le bloc passe au tiers haut du viewport. */
function MoodMarker({ mood }: { mood: Mood }) {
	const marker = useRef<HTMLSpanElement>(null)
	const { send } = useExperience()
	useOnReach(marker, () => send({ type: 'MOOD_REACHED', mood }), '0px 0px -35% 0px')
	return <span ref={marker} aria-hidden='true' class='absolute h-px w-px' />
}

export function Letter() {
	const { letter } = useContent()
	const { send } = useExperience()
	const root = useRef<HTMLElement>(null)
	const end = useRef<HTMLDivElement>(null)

	useInkReveal(root)
	useOnReach(end, () => send({ type: 'LETTER_END_REACHED' }), '0px 0px -10% 0px')

	let photographs = 0
	const render = (block: NarrativeBlock) => {
		switch (block.type) {
			case 'text':
				return split(block.content).map((paragraph, index) => (
					<p key={`${block.id}-${index}`} class='letter-text' data-ink>
						{paragraph}
					</p>
				))
			case 'poetry':
				return split(block.content).map((stanza, index) => (
					<p key={`${block.id}-${index}`} class='letter-poem' data-ink>
						{stanza}
					</p>
				))
			case 'photograph':
				return (
					<Photograph
						key={block.id}
						assetId={block.assetId}
						alt={block.alt}
						width={block.width}
						height={block.height}
						side={photographs++ % 2 ? 'right' : 'left'}
					/>
				)
			case 'watercolor':
				return (
					<Watercolor
						key={block.id}
						assetId={block.assetId}
						alt={block.alt}
						width={block.width}
						height={block.height}
					/>
				)
		}
	}

	return (
		<article ref={root} id='lettre' tabIndex={-1} class='letter focus:outline-none'>
			{letter.map((block) => (
				<Fragment key={block.id}>
					{'mood' in block && block.mood && <MoodMarker mood={block.mood} />}
					{render(block)}
				</Fragment>
			))}
			<div ref={end} aria-hidden='true' class='h-px' />
		</article>
	)
}
