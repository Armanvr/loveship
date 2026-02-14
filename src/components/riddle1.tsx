import { gsap } from 'gsap'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'preact/hooks'
import 'leaflet/dist/leaflet.css'

interface Location {
	id: number
	name: string
	fullName: string
	lat: number
	lng: number
	description: string
	zone: 'versailles' | 'paris17' | 'paris16' | 'gennevilliers'
}

interface Enigma1Props {
	userName: string
	onComplete: () => void
}

export default function Enigma1({ userName, onComplete }: Enigma1Props) {
	const [clickedLocations, setClickedLocations] = useState<number[]>([])
	const [currentStep, setCurrentStep] = useState(0)
	const [showError, setShowError] = useState(false)
	const [isComplete, setIsComplete] = useState(false)
	const [lastClickedId, setLastClickedId] = useState<number | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const mapsRef = useRef<{
		[key: string]: { map: L.Map; markers: Map<number, L.CircleMarker>; lines: L.Polyline[] }
	}>({})
	const handleLocationClickRef = useRef<((id: number) => void) | null>(null)

	// Définir les lieux marquants avec VRAIES coordonnées GPS - À PERSONNALISER !
	const locations: Location[] = [
		// Versailles
		{
			id: 1,
			name: 'Les j______ p______ du c______',
			fullName: 'Les jardins partagés du château',
			lat: 48.8009,
			lng: 2.1161,
			description: 'Le premier pique nique',
			zone: 'versailles',
		},
		{
			id: 2,
			name: 'Le L____ C______',
			fullName: 'Le Louis Château',
			lat: 48.8021,
			lng: 2.1287,
			description: 'Notre premier week-end en amoureux',
			zone: 'versailles',
		},

		// Paris 17ème
		{
			id: 3,
			name: 'Y_____',
			fullName: 'Yamato',
			lat: 48.8833,
			lng: 2.3255,
			description: 'Le premier restaurant japonais',
			zone: 'paris17',
		},
		{
			id: 4,
			name: "Le H____ d'A____",
			fullName: "Le Havre d'Arman",
			lat: 48.8888,
			lng: 2.3076,
			description: "Notre premier baiser sous l'action d'un grand homme",
			zone: 'paris17',
		},

		// Paris 16ème
		{
			id: 5,
			name: "Le j_____ d'a____________",
			fullName: "Le jardin d'acclimatation",
			lat: 48.8779,
			lng: 2.2697,
			description: 'Notre première sortie à deux',
			zone: 'paris16',
		},
		{
			id: 6,
			name: 'Le T________',
			fullName: 'Le Trocadéro',
			lat: 48.8634,
			lng: 2.2892,
			description: 'La balade où j’ai pris la place d’un autre',
			zone: 'paris16',
		},

		// Gennevilliers
		{
			id: 7,
			name: 'Le M_______',
			fullName: 'Le Midpoint',
			lat: 48.9198,
			lng: 2.2981,
			description: 'Notre première discussion en tête à tête',
			zone: 'gennevilliers',
		},
		{
			id: 8,
			name: 'Le d_____ vers S____',
			fullName: 'Le départ vers Sargé',
			lat: 48.9188,
			lng: 2.2971,
			description: 'Là où on est parti avec tout nos amis',
			zone: 'gennevilliers',
		},
	]

	const correctOrder = [7, 3, 1, 8, 6, 4, 5, 2]

	// Centres et zooms pour chaque zone
	const zoneConfig = {
		versailles: { center: [48.8009, 2.1161] as [number, number], zoom: 13 },
		paris17: { center: [48.8861, 2.3161] as [number, number], zoom: 14 },
		paris16: { center: [48.8684, 2.2839] as [number, number], zoom: 13 },
		gennevilliers: { center: [48.9191, 2.2971] as [number, number], zoom: 15 },
	}

	useEffect(() => {
		// Animation d'entrée GSAP
		gsap.from(containerRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power2.out',
		})

		// Animation des cartes
		gsap.from('.map-card', {
			opacity: 0,
			y: 30,
			duration: 0.8,
			stagger: 0.15,
			ease: 'power3.out',
			delay: 0.3,
		})
	}, [])

	// Initialiser une carte Leaflet
	const initMap = (zone: 'versailles' | 'paris17' | 'paris16' | 'gennevilliers', containerId: string) => {
		// Vérifier si la carte existe déjà
		if (mapsRef.current[zone]) {
			return
		}

		const config = zoneConfig[zone]
		const zoneLocations = locations.filter((loc) => loc.zone === zone)

		// Créer la carte
		const map = L.map(containerId, {
			center: config.center,
			zoom: config.zoom,
			scrollWheelZoom: false,
			zoomControl: false,
			dragging: false,
			doubleClickZoom: false,
			attributionControl: false,
		})

		// Ajouter le tile layer (carte de fond)
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			maxZoom: 19,
		}).addTo(map)

		// Créer les marqueurs
		const markers = new Map<number, L.CircleMarker>()
		zoneLocations.forEach((location) => {
			const marker = L.circleMarker([location.lat, location.lng], {
				radius: 10,
				fillColor: '#ffffff',
				fillOpacity: 0.8,
				color: '#9ca3af',
				weight: 3,
			})

			marker.on('click', () => {
				// Utiliser la ref pour avoir toujours la dernière version
				if (handleLocationClickRef.current) {
					handleLocationClickRef.current(location.id)
				}
			})
			marker.addTo(map)
			markers.set(location.id, marker)

			// Ajouter l'ID au DOM element pour les animations GSAP
			const markerElement = marker.getElement()
			if (markerElement) {
				markerElement.id = `marker-${location.id}`
			}
		})

		mapsRef.current[zone] = { map, markers, lines: [] }
	}

	// Mettre à jour les marqueurs et les lignes
	useEffect(() => {
		Object.entries(mapsRef.current).forEach(([zone, { markers, lines, map }]) => {
			const zoneLocations = locations.filter((loc) => loc.zone === zone)

			// Mettre à jour l'apparence des marqueurs
			zoneLocations.forEach((location) => {
				const marker = markers.get(location.id)
				if (!marker) return

				const isClicked = clickedLocations.includes(location.id)
				const isPulsing = lastClickedId === location.id

				marker.setStyle({
					radius: isPulsing ? 15 : 10,
					fillColor: isClicked ? '#fb7185' : '#ffffff',
					fillOpacity: isClicked ? 0.9 : 0.8,
					color: isClicked ? '#fb7185' : '#9ca3af',
					weight: isClicked ? 4 : 3,
				})
			})

			// Supprimer les anciennes lignes
			for (const line of lines) {
				map.removeLayer(line)
			}
			mapsRef.current[zone as 'versailles' | 'paris17' | 'paris16' | 'gennevilliers'].lines = []

			// Dessiner les nouvelles lignes
			const newLines: L.Polyline[] = []
			for (let i = 0; i < clickedLocations.length - 1; i++) {
				const fromLoc = locations.find((l) => l.id === clickedLocations[i])
				const toLoc = locations.find((l) => l.id === clickedLocations[i + 1])

				if (fromLoc && toLoc && fromLoc.zone === zone && toLoc.zone === zone) {
					const line = L.polyline(
						[
							[fromLoc.lat, fromLoc.lng],
							[toLoc.lat, toLoc.lng],
						],
						{
							color: '#fb7185',
							weight: 2,
							dashArray: '5, 5',
							opacity: 0.7,
						},
					)
					line.addTo(map)
					newLines.push(line)
				}
			}
			mapsRef.current[zone as 'versailles' | 'paris17' | 'paris16' | 'gennevilliers'].lines = newLines
		})
	}, [clickedLocations, lastClickedId])

	const handleLocationClick = (locationId: number) => {
		if (isComplete) return

		const expectedId = correctOrder[currentStep]

		if (locationId === expectedId) {
			// Bonne réponse - Animation de succès
			setClickedLocations([...clickedLocations, locationId])
			setCurrentStep((prev) => prev + 1) // ✅ Fix: forme fonctionnelle
			setShowError(false)
			setLastClickedId(locationId)

			// Animation de succès sur le point
			const marker = document.getElementById(`marker-${locationId}`)
			if (marker) {
				gsap.fromTo(
					marker,
					{ scale: 1 },
					{
						scale: 1.5,
						duration: 0.3,
						ease: 'back.out(2)',
						yoyo: true,
						repeat: 1,
						transformOrigin: 'center center',
					},
				)
			}

			// Pulse de validation brève
			setTimeout(() => setLastClickedId(null), 1000)

			// Vérifier si c'est terminé (utiliser la valeur mise à jour)
			if (currentStep + 1 === correctOrder.length) {
				setIsComplete(true)
				setTimeout(() => {
					gsap.to('.success-message', {
						opacity: 1,
						y: 0,
						duration: 0.8,
						ease: 'power2.out',
					})
				}, 500)
			}
		} else {
			// Mauvaise réponse - Animation d'erreur
			setShowError(true)

			const marker = document.getElementById(`marker-${locationId}`)
			if (marker) {
				gsap.to(marker, {
					x: -8,
					duration: 0.1,
					repeat: 5,
					yoyo: true,
					ease: 'power1.inOut',
					onComplete: () => {
						gsap.set(marker, { x: 0 })
					},
				})
			}

			setTimeout(() => setShowError(false), 2000)
		}
	}

	// Mettre à jour la ref à chaque render
	handleLocationClickRef.current = handleLocationClick

	const handleContinue = () => {
		gsap.to(containerRef.current, {
			opacity: 0,
			duration: 0.5,
			onComplete: onComplete,
		})
	}

	const getLocationsByZone = (zone: string) => {
		return locations.filter((loc) => loc.zone === zone)
	}

	const renderMiniMap = (zone: 'versailles' | 'paris17' | 'paris16' | 'gennevilliers', title: string) => {
		const zoneLocations = getLocationsByZone(zone)
		const mapId = `map-${zone}`

		return (
			<div className='map-card bg-white/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden'>
				<div className='bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3'>
					<h3 className='text-sm font-medium text-white text-center'>{title}</h3>
				</div>

				<div
					id={mapId}
					ref={(el) => {
						if (el && !mapsRef.current[zone]) {
							// Petit délai pour que le DOM soit prêt
							setTimeout(() => initMap(zone, mapId), 100)
						}
					}}
					className='relative'
					style={{ height: '250px' }}
				/>

				{/* Légende des lieux de cette zone */}
				<div className='p-4 space-y-2'>
					{zoneLocations.map((location) => {
						const isClicked = clickedLocations.includes(location.id)
						const orderNumber = clickedLocations.indexOf(location.id) + 1

						return (
							<div
								key={location.id}
								className={`text-xs p-2.5 rounded-lg transition-all duration-300 ${
									isClicked ? 'bg-rose-100 text-rose-700' : 'bg-gray-50 text-gray-500'
								}`}
							>
								<div className='flex items-start gap-2'>
									{isClicked && (
										<span className='flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold mt-0.5'>
											{orderNumber}
										</span>
									)}
									<div className='flex-1 min-w-0'>
										<p className='font-medium text-[14px] truncate'>
											{isClicked ? location.fullName : location.name}
										</p>
										{isClicked && (
											<p className='text-[12px] opacity-75 mt-0.5'>{location.description}</p>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 p-6'
		>
			<div className='max-w-7xl w-full space-y-6'>
				{/* Titre */}
				<div className='text-center space-y-3'>
					<h2 className='text-4xl font-light text-gray-800'>Énigme 1</h2>
					<p className='text-lg text-gray-600'>
						Retrace notre histoire, <span className='font-bold text-rose-700'>{userName}</span>
					</p>
					<p className='text-sm text-gray-500'>
						Clique sur les lieux dans l'ordre chronologique de nos souvenirs
					</p>
				</div>

				{/* Indicateur de progression */}
				<div className='flex justify-center gap-2'>
					{correctOrder.map((_, index) => (
						<div
							key={index}
							className={`h-2 rounded-full transition-all duration-300 ${
								index < currentStep
									? 'bg-rose-500 w-8'
									: index === currentStep
										? 'bg-rose-300 w-8'
										: 'bg-gray-300 w-2'
							}`}
						/>
					))}
				</div>

				{/* Compteur */}
				<div className='text-center'>
					<p className='text-2xl font-light text-gray-700'>
						<span className='text-rose-500 font-medium'>{currentStep}</span>
						<span className='text-gray-400'> / {correctOrder.length}</span>
					</p>
				</div>

				{/* Message d'erreur */}
				<div className={`text-center ${showError ? 'opacity-100' : 'opacity-0'}`}>
					<div className='inline-block bg-red-100 text-red-600 px-6 py-3 rounded-lg shadow-sm animate-pulse'>
						<p className='text-sm font-medium'>❌ Ce n'est pas le bon ordre...</p>
					</div>
				</div>

				{/* Grille de cartes */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
					{renderMiniMap('versailles', '🏰 Versailles')}
					{renderMiniMap('paris17', '📍 Paris 17ème')}
					{renderMiniMap('paris16', '🌳 Paris 16ème')}
					{renderMiniMap('gennevilliers', '🏡 Gennevilliers')}
				</div>

				{/* Message de succès et bouton */}
				{isComplete && (
					<div className='success-message opacity-0 translate-y-4 text-center space-y-4'>
						<div className='bg-gradient-to-r from-rose-100 to-pink-100 p-6 rounded-2xl shadow-lg'>
							<p className='text-2xl text-gray-800 font-light mb-2'>✨ Parfait ! ✨</p>
							<p className='text-gray-600'>Notre histoire est gravée dans ces lieux magiques</p>
						</div>
						<button
							type='button'
							onClick={handleContinue}
							className='px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 font-light tracking-wide text-lg shadow-lg hover:shadow-xl transform hover:scale-105'
						>
							Trouveras tu le prochain indice ? →
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
