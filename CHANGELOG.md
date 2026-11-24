# Changelog

Toutes les évolutions notables du projet sont consignées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions selon [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Corrigé

- `npm run lint` passe de nouveau : `dist/` est exclu de Biome (le lint échouait après chaque build) et `riddle3.tsx` est reformaté.

### Modifié

- Mises à jour : Biome 2.6, GSAP 3.15, `@types/leaflet` 1.9.22.
- Configuration Biome migrée vers le format 2.6 (`preset` à la place de `recommended`).
- README réécrit : parcours, technique et commandes.

## [1.0.0] - 2026-11-22

Première version stable : le parcours complet (intro, trois énigmes, lettre) fonctionne sur ordinateur et sur mobile.

### Ajouté

- Énigme 3 : choix entre Orion (mini-jeu), Cassiopée et la Grande Ourse.
- Menu « Revivre le voyage », disponible une fois la lettre ouverte.

### Corrigé

- Énigme 1 : les fonds de carte s'affichent de nouveau (passage de CARTO, désormais soumis à clé d'API, à OpenStreetMap).
- Énigme 3 : Cassiopée et la Grande Ourse ne bloquent plus le jeu, le bouton pour continuer apparaît.
- Énigme 3 : à la victoire, seul le cœur des étoiles devient doré et leurs noms restent lisibles.
- Conclusion : l'enveloppe et le sceau tiennent dans l'écran sur mobile.
- Intro : le cœur caché reste accessible sur mobile.
- La page est déclarée en français (`lang="fr"`).

### Modifié

- Outil de build : Vite 8 officiel à la place de `rolldown-vite`.
- Mises à jour : Preact 11, TypeScript 7, Tailwind 4.3.

### Supprimé

- Vitest (aucun test dans le projet), police Montserrat inutilisée, tracé de lignes entre lieux jamais exécuté.

[Non publié]: https://github.com/Armanvr/loveship/compare/1.0.0...HEAD
[1.0.0]: https://github.com/Armanvr/loveship/releases/tag/1.0.0
