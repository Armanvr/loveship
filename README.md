# Loveship

Un cadeau de Saint-Valentin sous forme de petit voyage interactif : une introduction, trois énigmes, puis une lettre à ouvrir.

## Le parcours

1. **Intro** : la personne saisit son prénom, repris ensuite dans tout le parcours.
2. **Énigme 1** : des lieux à remettre dans le bon ordre, sur des cartes (Leaflet, fonds OpenStreetMap).
3. **Énigme 2** : un cadenas à quatre molettes, puis une phrase à deviner lettre par lettre.
4. **Énigme 3** : une constellation à choisir entre Orion (mini-jeu), Cassiopée et la Grande Ourse.
5. **Conclusion** : une enveloppe scellée qui s'ouvre sur la lettre.

Une fois la lettre ouverte, le menu « Revivre le voyage » permet de revenir à n'importe quelle étape.

## Technique

- [Preact](https://preactjs.com/) et TypeScript, construits avec [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) pour les styles
- [GSAP](https://gsap.com/) pour les animations, [Leaflet](https://leafletjs.com/) pour les cartes
- [Biome](https://biomejs.dev/) pour le lint et le formatage

Tout tourne dans le navigateur : pas de serveur, pas de clé d'API. Le prénom est gardé dans le `localStorage`.

## Commandes

```bash
npm install
npm run dev      # serveur de développement
npm run build    # vérification des types puis build dans dist/
npm run preview  # sert le build en local
npm run lint     # lint et formatage (Biome)
```

Les évolutions sont consignées dans le [CHANGELOG](CHANGELOG.md).
