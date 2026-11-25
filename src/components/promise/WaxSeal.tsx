import '../../styles/finale.css'

const GOLD_LINE = '#6f5019'
const GERBERA = { x: 64, y: 38, petals: 12 }

/** Cachet de cire doré : un lys et un gerbera en traits fins. Décoratif (l'inscription est portée par le bouton). */
export function WaxSeal() {
	return (
		<svg class='wax-seal' viewBox='0 0 100 100' aria-hidden='true'>
			<defs>
				<radialGradient id='wax-gold' cx='38%' cy='32%' r='78%'>
					<stop offset='0' stop-color='#ecd27c' />
					<stop offset='0.55' stop-color='#cfa94d' />
					<stop offset='1' stop-color='#a97f2f' />
				</radialGradient>
			</defs>
			<path
				d='M50 4 C62 3 71 8 80 15 C91 21 96 34 96 47 C97 62 91 74 81 83 C71 92 58 97 46 96 C33 96 21 90 13 80 C5 69 3 55 6 42 C9 30 16 20 26 12 C34 7 42 5 50 4Z'
				fill='url(#wax-gold)'
			/>
			<circle cx='50' cy='50' r='38' fill='none' stroke={GOLD_LINE} stroke-opacity='0.55' stroke-width='0.9' />
			<g fill='none' stroke={GOLD_LINE} stroke-width='1.15' stroke-linecap='round' stroke-linejoin='round'>
				{/* Lys : trois tépales et trois étamines */}
				<g transform='translate(0 0)'>
					<path d='M33 78 C25 66 26 52 33 41 C40 52 41 66 33 78Z' />
					<path d='M33 78 C25 66 26 52 33 41 C40 52 41 66 33 78Z' transform='rotate(-38 33 78)' />
					<path d='M33 78 C25 66 26 52 33 41 C40 52 41 66 33 78Z' transform='rotate(38 33 78)' />
					<path d='M33 74 L33 56 M33 74 L27 58 M33 74 L39 58' stroke-width='0.8' />
				</g>
				{/* Gerbera : couronne de pétales autour d'un coeur */}
				<g>
					{Array.from({ length: GERBERA.petals }, (_, index) => (
						<ellipse
							key={index}
							cx={GERBERA.x}
							cy={GERBERA.y - 11}
							rx='2.4'
							ry='6.2'
							transform={`rotate(${(index * 360) / GERBERA.petals} ${GERBERA.x} ${GERBERA.y})`}
						/>
					))}
					<circle cx={GERBERA.x} cy={GERBERA.y} r='3.4' />
				</g>
			</g>
		</svg>
	)
}
