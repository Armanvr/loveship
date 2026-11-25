import { useEffect, useLayoutEffect, useRef } from 'preact/hooks'
import { bouquetTimeline, morphToCard } from '../../animations/finale'
import { gsap, prefersReducedMotion } from '../../animations/motion'
import { useContent } from '../../contexts/content'
import { useExperience } from '../../features/experience/context'
import { isAtLeast } from '../../features/experience/reducer'
import { useOnReach } from '../../hooks/useOnReach'
import { assetUrl } from '../../lib/api'
import { keepsakeLayout, stageVars } from '../../lib/keepsake-layout'
import '../../styles/finale.css'
import { bouquetCopy } from '../../config'
import { FLOWERS, LILY_HALO, STEMS, THREAD, VIEW } from './geometry'

const HALO_ID = 'bouquet-halo'
const vars = stageVars()
const { bouquet: place } = keepsakeLayout(100, { recipient: '', sender: '', dateLabel: '' })

/** Conclusion florale : une seule timeline, jouée une fois quand la scène entre dans la vue, puis plus aucun mouvement. */
export function Bouquet() {
	const { bouquet } = useContent()
	const { state, send } = useExperience()
	const stage = useRef<HTMLDivElement>(null)
	const art = useRef<SVGSVGElement>(null)
	const timeline = useRef<gsap.core.Timeline | null>(null)
	const toCard = isAtLeast(state, 'KEEPSAKE')

	useLayoutEffect(() => {
		if (prefersReducedMotion() || !art.current) return // état final affiché directement
		const context = gsap.context(() => {
			timeline.current = bouquetTimeline(art.current as SVGSVGElement, () => send({ type: 'BOUQUET_COMPLETED' }))
		}, art.current)
		return () => {
			context.revert()
			timeline.current = null
		}
	}, [send])

	useOnReach(
		stage,
		() => (timeline.current ? timeline.current.play() : send({ type: 'BOUQUET_COMPLETED' })),
		'0px 0px -25% 0px',
	)

	// La carte se monte : le bouquet glisse de sa pose de scène vers sa place à gauche de la carte.
	useEffect(() => {
		if (!toCard || prefersReducedMotion() || !art.current) return
		const context = gsap.context(() => void morphToCard(art.current as SVGSVGElement), art.current)
		return () => context.revert()
	}, [toCard])

	const label = `${bouquet.lily.alt} ${bouquet.gerbera.alt} ${bouquetCopy.scene}`
	return (
		<section id='bouquet' class='finale-frame bouquet' style={vars}>
			<div ref={stage} class='finale-stage'>
				<svg
					ref={art}
					class='bouquet-art'
					viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
					role='img'
					aria-label={label}
					style={{
						left: `${place.x}cqw`,
						top: `${place.y}cqw`,
						width: `${place.w}cqw`,
						height: `${place.h}cqw`,
					}}
				>
					<defs>
						<filter id={HALO_ID} x='-20%' y='-20%' width='140%' height='140%'>
							<feDropShadow
								dx='0'
								dy={LILY_HALO.dy}
								stdDeviation={LILY_HALO.sigma}
								flood-color={LILY_HALO.color}
							/>
						</filter>
					</defs>
					{Object.entries(STEMS).map(([name, stem]) => (
						<path
							key={name}
							data-part={`stem-${name}`}
							d={stem.d}
							fill='none'
							stroke={stem.color}
							stroke-width={stem.width}
							stroke-linecap='round'
							pathLength='1'
							stroke-dasharray='1'
						/>
					))}
					<path
						data-part='thread'
						d={THREAD.d}
						fill='none'
						stroke={THREAD.color}
						stroke-width={THREAD.width}
						stroke-linecap='round'
						pathLength='1'
						stroke-dasharray='1'
					/>
					{(['lily', 'gerbera'] as const).map((name) => {
						const flower = FLOWERS[name]
						return (
							<g key={name} data-part={name}>
								<image
									href={assetUrl(bouquet[name].assetId)}
									x={flower.cx - flower.size / 2}
									y={flower.cy - flower.size / 2}
									width={flower.size}
									height={flower.size}
									transform={`rotate(${flower.tilt} ${flower.cx} ${flower.cy})`}
									filter={name === 'lily' ? `url(#${HALO_ID})` : undefined}
								/>
							</g>
						)
					})}
				</svg>
			</div>
		</section>
	)
}
