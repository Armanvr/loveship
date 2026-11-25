import { useState } from 'preact/hooks'
import { ScrollTrigger } from '../../animations/motion'
import { assetUrl } from '../../lib/api'

interface PhotographProps {
	assetId: string
	alt: string
	side: 'left' | 'right'
	width?: number
	height?: number
}

/** Tirage : fine bordure ivoire, ombre légère, ratio d'origine (4/3 par défaut si le contenu n'en donne pas), pas de légende. */
export function Photograph({ assetId, alt, side, width, height }: PhotographProps) {
	const [loaded, setLoaded] = useState(false)
	return (
		<figure class='print' data-ink data-side={side}>
			<div
				class={loaded ? '' : 'print-frame'}
				style={loaded ? undefined : { aspectRatio: `${width ?? 4} / ${height ?? 3}` }}
			>
				<img
					src={assetUrl(assetId)}
					alt={alt}
					width={width}
					height={height}
					loading='lazy'
					decoding='async'
					onLoad={() => {
						setLoaded(true)
						ScrollTrigger.refresh() // la hauteur a changé : recalcule les seuils de révélation
					}}
				/>
			</div>
		</figure>
	)
}
