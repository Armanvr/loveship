import { useState } from 'preact/hooks'
import { ScrollTrigger } from '../../animations/motion'
import { assetUrl } from '../../lib/api'

/** Aquarelle : fondue dans l'ivoire par un masque doux, plus large que la colonne sur ordinateur. */
export function Watercolor({
	assetId,
	alt,
	width,
	height,
}: {
	assetId: string
	alt: string
	width?: number
	height?: number
}) {
	const [loaded, setLoaded] = useState(false)
	return (
		<figure class='wash' data-ink>
			<div style={loaded ? undefined : { aspectRatio: `${width ?? 16} / ${height ?? 9}` }}>
				<img
					src={assetUrl(assetId)}
					alt={alt}
					width={width}
					height={height}
					loading='lazy'
					decoding='async'
					onLoad={() => {
						setLoaded(true)
						ScrollTrigger.refresh()
					}}
				/>
			</div>
		</figure>
	)
}
