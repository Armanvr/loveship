import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

// biome-ignore lint/style/noNonNullAssertion: we know the element is there
const root = document.getElementById('app')!

// Parcours historique : développement uniquement. `import.meta.env.DEV` est remplacé par `false` au build,
// l'import dynamique disparaît et le bundle de production ne contient aucune énigme.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('legacy')) {
	import('./legacy/app.tsx').then(({ App: Legacy }) => render(<Legacy />, root))
} else if (import.meta.env.DEV && new URLSearchParams(location.search).has('audio-bench')) {
	// Banc d'essai du moteur audio (couches synthétiques) : développement uniquement.
	import('./components/audio/AudioBench.tsx').then(({ AudioBench }) => render(<AudioBench />, root))
} else {
	render(<App />, root)
}
