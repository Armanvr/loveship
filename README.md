# Loveship

Une lettre d'amour vivante, privée, pour Victoria : une enveloppe ivoire, une lettre qui se révèle au fil de la lecture, une seconde enveloppe bordeaux et sa promesse, deux fleurs qui deviennent un bouquet, puis une carte souvenir à garder.

Tout le contenu actuel est **provisoire** (textes, photographies, aquarelles, fleurs, date, musique). L'architecture permet de le remplacer sans toucher au code : voir [Remplacer les placeholders](#remplacer-les-placeholders).

## Sommaire

- [Technique](#technique)
- [Installation et commandes](#installation-et-commandes)
- [Variables d'environnement](#variables-denvironnement)
- [Mot de passe et sessions](#mot-de-passe-et-sessions)
- [Remplacer les placeholders](#remplacer-les-placeholders)
- [Musique](#musique)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Limites du forfait Hobby](#limites-du-forfait-hobby)
- [Archivage](#archivage)
- [Code historique](#code-historique)

## Technique

- [Preact](https://preactjs.com/) et TypeScript, construits avec [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) 4 (thème et jetons dans `src/index.css`)
- [GSAP](https://gsap.com/) et ScrollTrigger pour les animations
- Polices locales : Cormorant Garamond et Lora (paquets `@fontsource-variable/*`, aucune requête vers un CDN)
- Vercel Functions (`api/`) pour l'authentification et les ressources privées, Vercel Blob privé pour les contenus définitifs
- [Biome](https://biomejs.dev/) pour le lint et le formatage, `node:test` pour les tests

```
api/        Vercel Functions : auth/login, auth/logout, auth/session, content, assets (5 sur les 12 du forfait Hobby)
server/     logique serveur : auth/ (hash, session), security/ (garde), content/ (placeholder, chargement, ressources)
scripts/    hash-password, upload-asset
src/
  types/content.ts        contrat client/serveur (modèle de contenu, liste des endpoints)
  features/authentication écran d'accès et contexte de session
  features/experience     moteur narratif (reducer pur) et page de l'expérience
  components/             envelopes, letter, memories, illustrations, promise, bouquet, keepsake, audio, common
  animations/             paramètres et timelines GSAP
  lib/                    api, storage (localStorage sûr), audio (moteur Web Audio)
  legacy/                 ancien parcours de la Saint-Valentin (hors production)
public/     placeholders génériques, texture, icônes, manifest : rien de personnel ici
```

Le moteur narratif connaît les étapes `INTRODUCTION → LETTER → SECOND_ENVELOPE → PROMISE → BOUQUET → KEEPSAKE`. Il retient l'étape la plus avancée atteinte : tout ce qui a été découvert reste dans la page, le défilement est natif et libre. L'authentification en est indépendante (`AUTHENTICATION` est simplement l'absence de session).

## Installation et commandes

Node 24 ou plus récent.

```bash
npm install
npm run dev            # serveur de développement, avec les vraies Functions de api/ montées par un plugin Vite
npm run build          # vérification des types (client et serveur) puis build dans dist/
npm run lint           # lint et formatage (Biome)
npm test               # tests serveur et logique pure (node:test)
npm run hash-password  # génère la ligne LOVESHIP_PASSWORD_HASH (saisie masquée)
npm run upload-asset -- <assetId|content> <fichier>   # envoie une ressource vers le Blob privé
```

En développement, l'authentification est la vraie : il n'existe aucun contournement. Il faut donc un `.env.local` (voir ci-dessous) avec un mot de passe de test. Sans stockage Blob configuré, le serveur sert le contenu provisoire du dépôt et les images de `public/placeholders/`.

`npm run preview` ne sert que les fichiers statiques : les routes `/api` n'y existent pas. Pour tester un build complet en local, utiliser `vercel dev`.

## Variables d'environnement

Toutes sont lues côté serveur uniquement. Aucune ne doit être préfixée `VITE_`. Le modèle est dans `.env.example` ; en local, le copier en `.env.local` (ignoré par Git).

| Variable                             | Rôle                                                           | Obligatoire |
| ------------------------------------ | -------------------------------------------------------------- | ----------- |
| `LOVESHIP_PASSWORD_HASH`             | Hash scrypt du mot de passe, au format `scrypt:N:r:p:sel:hash` | oui         |
| `LOVESHIP_SESSION_SECRET`            | Secret de signature des sessions, 32 caractères minimum        | oui         |
| `BLOB_READ_WRITE_TOKEN`              | Jeton du store Blob privé, pour le local et `upload-asset`     | non         |
| `BLOB_STORE_ID`, `VERCEL_OIDC_TOKEN` | Injectées par Vercel quand le store est connecté au projet     | automatique |

Si une variable obligatoire manque ou est invalide, les endpoints répondent par une erreur 500 générique et la cause est écrite dans les journaux de la fonction.

## Mot de passe et sessions

Générer le hash, puis un secret :

```bash
npm run hash-password
```

```bash
openssl rand -base64 48
```

Le mot de passe n'est jamais passé en argument ni affiché. Seul son hash (scrypt, N=32768, r=8, p=1, sel aléatoire) est stocké, dans les variables d'environnement.

**Politique de session**

- Après un mot de passe correct, le serveur pose un cookie `loveship_session` : `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` hors développement local, durée 365 jours.
- Le cookie contient un jeton signé (HMAC-SHA256) avec sa date d'émission et d'expiration. Rien n'est stocké côté serveur ; l'expiration est vérifiée à chaque requête.
- Renouvellement glissant : à chaque visite, si le jeton a plus de 30 jours, un nouveau cookie de 365 jours est émis. Une visite au moins une fois par an suffit donc à ne jamais ressaisir le mot de passe sur un même appareil.
- La clé de signature dérive du secret **et** du hash du mot de passe. Changer le mot de passe ou faire tourner `LOVESHIP_SESSION_SECRET` (puis redéployer) invalide toutes les sessions existantes, sur tous les appareils.
- Rien n'est écrit dans le `localStorage` pour l'authentification. Il ne contient que `loveship:v2:introductionSeen`, `loveship:v2:audioEnabled` et `loveship:v2:audioVolume`.

Tous les endpoints privés (`/api/content`, `/api/assets/*`) vérifient la session eux-mêmes et répondent avec `Cache-Control: private, no-store`.

## Remplacer les placeholders

Le contenu provisoire vit dans `server/content/placeholder.ts` (jamais envoyé au navigateur sans session). Les contenus définitifs ne vont **ni dans le dépôt, ni dans `public/`** : ils vont dans le store Vercel Blob privé. Un dossier local `private/` est prévu pour les préparer ; il est ignoré par Git.

### Textes, inscriptions et date

1. Copier la structure de `server/content/placeholder.ts` dans un fichier `private/loveship.json` conforme à `LoveshipContent` (`src/types/content.ts`).
2. Y écrire les textes définitifs et passer `"placeholder": false`.
3. L'envoyer :

```bash
npm run upload-asset -- content private/loveship.json
```

| Champ                             | Contenu                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `recipient`, `sender`             | Prénoms affichés sur la carte souvenir                                                  |
| `anniversaryDate`                 | Date de la carte, en texte libre affiché tel quel. `null` affiche un libellé provisoire |
| `introduction.envelopeText`       | Inscription de l'enveloppe ivoire                                                       |
| `letter`                          | Blocs ordonnés de la lettre (voir ci-dessous)                                           |
| `transition.content`              | Phrase de transition vers la seconde enveloppe                                          |
| `promise.envelopeText`            | Inscription de l'enveloppe bordeaux                                                     |
| `promise.content`                 | Promesse ; paragraphes séparés par une ligne vide                                       |
| `promise.signature`               | Signature finale                                                                        |
| `bouquet.lily`, `bouquet.gerbera` | Identifiant et texte alternatif de chaque fleur                                         |
| `audio.layers`                    | Couches musicales disponibles (vide = silence)                                          |

Blocs de la lettre :

- `text` : un paragraphe. `poetry` : une strophe, un vers par ligne (`\n`).
- `mood` (facultatif, sur un bloc de texte) : `playful`, `tender`, `intimate`, `admiring` ou `luminous`. Il fait évoluer la lumière de la page et la musique à partir de ce bloc.
- `photograph` et `watercolor` : `assetId` et `alt` (texte alternatif lu par les lecteurs d'écran).

La phrase de l'écran d'accès (« Notre histoire continue. ») est affichée avant toute session : elle se trouve dans `src/config/index.ts` et ne doit rien contenir de personnel.

### Images

Chaque ressource se remplace indépendamment, par son identifiant. Tant qu'un identifiant n'a pas de fichier dans le Blob, son placeholder public est servi.

```bash
npm run upload-asset -- photo-versailles private/versailles.webp
```

| Identifiant                 | Emplacement                                                |
| --------------------------- | ---------------------------------------------------------- |
| `photo-versailles`          | Première escapade romantique à Versailles                  |
| `photo-velo`                | Première promenade à vélo dans un domaine                  |
| `photo-londres`             | Premier voyage à Londres                                   |
| `photo-bretagne`            | Premières vacances d'été en Bretagne                       |
| `photo-aujourdhui`          | Le couple aujourd'hui                                      |
| `photo-commencement`        | Là où tout a commencé                                      |
| `aquarelle-repas`           | Le repas préparé ensemble                                  |
| `aquarelle-film`            | Le film sous un plaid                                      |
| `aquarelle-jeux`            | La soirée de jeux vidéo coopératifs                        |
| `aquarelle-astronomie-lego` | L'astronomie et les LEGO                                   |
| `aquarelle-horizon`         | Le couple de dos face à l'horizon                          |
| `fleur-lys`                 | Lys blanc, fond transparent, tête de fleur seule           |
| `fleur-gerbera`             | Gerbera rose poudré, fond transparent, tête de fleur seule |

Formats acceptés : AVIF, WebP, PNG, JPEG, SVG. Préférer WebP ou AVIF, 1600 px de large au maximum pour les photographies, PNG ou WebP avec transparence pour les fleurs. Le ratio d'origine est respecté. Les tiges et le fil doré du bouquet sont dessinés en SVG par l'animation et n'ont pas de fichier.

Pour ajouter, retirer ou déplacer une image, modifier les blocs de `letter` : seuls les identifiants référencés par le contenu peuvent être servis.

## Musique

Sans fichier audio, le site est silencieux : aucun contrôle n'est affiché et aucune requête audio n'est émise.

Quand la composition sera prête, l'exporter en quatre boucles de **même durée et même tempo**, coupées pour boucler sans clic :

1. Envoyer chaque couche :

```bash
npm run upload-asset -- audio-piano private/piano.m4a
```

2. Les déclarer dans le contenu (`private/loveship.json`), puis renvoyer celui-ci :

```json
"audio": {
	"layers": [
		{ "id": "piano", "assetId": "audio-piano" },
		{ "id": "texture", "assetId": "audio-texture" },
		{ "id": "harmony", "assetId": "audio-harmony" },
		{ "id": "pads", "assetId": "audio-pads" }
	]
}
```

Les couches démarrent sur la même horloge Web Audio. Le dosage de chaque couche selon l'ambiance de la lettre et les durées de fondu se règlent dans `src/config/audio.ts`. La musique ne démarre qu'après un geste volontaire, et suit l'ambiance la plus avancée atteinte : remonter dans la lettre ne la fait pas changer.

Formats acceptés : M4A (AAC), MP3, OGG, WAV. Préférer M4A, lu par tous les navigateurs ciblés. Viser moins de 2 Mo par couche.

## Déploiement sur Vercel

Rien n'est déployé automatiquement par ce dépôt. Étapes manuelles, dans l'ordre :

1. **Projet** : importer le dépôt dans Vercel (préréglage Vite, commande `npm run build`, dossier `dist`). Les fichiers de `api/` deviennent des Functions ; `vercel.json` gère le repli SPA, le routage `/api/assets/:id` et l'en-tête `X-Robots-Tag: noindex, nofollow`.
2. **Variables** : Project Settings → Environment Variables → ajouter `LOVESHIP_PASSWORD_HASH` et `LOVESHIP_SESSION_SECRET` pour Production et Preview (utiliser un mot de passe différent en Preview si l'on veut).
3. **Blob privé** : Storage → Create Storage → Blob → **Private**, puis connecter le store au projet. L'accès privé se choisit à la création et ne se change pas ensuite. Pour envoyer des fichiers depuis sa machine : `vercel env pull .env.local`, ou copier le jeton du store dans `BLOB_READ_WRITE_TOKEN`.
4. **Firewall** (anti-bruteforce) : Projet → Firewall → ⋯ → Configure → Add New… → Rule.
   - Si : `Request Path` _Equals_ `/api/auth/login` **ET** `Method` _Equals_ `POST`
   - Alors : **Rate Limit**, Fixed Window, fenêtre `600` secondes, limite `5` requêtes, clé `IP`, action `429`
   - Save Rule → Review Changes → Publish
5. **Preview d'abord** : déployer sur une URL de preview et valider la liste ci-dessous avant toute mise en production.

### À valider sur le déploiement preview

Ces points dépendent de la plateforme et n'ont pas pu être vérifiés en local :

- les imports `.js` de `api/` vers `server/` se résolvent (sinon : erreur `ERR_MODULE_NOT_FOUND` dans les journaux) ;
- `/api/assets/photo-versailles` répond bien après connexion (rewrite `/api/assets/:id`) et renvoie 401 sans session ;
- le store Blob est lu via OIDC sans jeton ;
- les requêtes `Range` sur l'audio privé (déplacement dans la piste) : le serveur les relaie, mais Vercel ne documente pas leur prise en charge pour les blobs privés. Le moteur audio télécharge chaque couche en entier, donc la lecture ne dépend pas de ce point ;
- la règle Firewall : six mauvais mots de passe en moins de dix minutes doivent donner un 429.

## Limites du forfait Hobby

Vérifiées dans la documentation Vercel le 24 novembre 2026 :

- **Firewall** : une seule règle de limitation de débit par projet, fenêtre fixe de 10 minutes au maximum, clé IP. La configuration souhaitée (5 tentatives / 10 minutes) est donc possible. Deux réserves : les compteurs sont tenus par région, et le blocage prolongé au-delà de la fenêtre (« persistent actions ») est réservé aux forfaits payants. Le refus dure donc jusqu'à la fin de la fenêtre en cours. La règle se configure uniquement dans le dashboard, pas dans `vercel.json`. Elle compte toutes les requêtes de connexion, y compris les réussies.
- **Blob** : 1 Go de stockage, 10 000 opérations simples et 2 000 avancées par mois, 10 Go de transfert. En cas de dépassement, le service est suspendu 30 jours. Parcourir le store dans le dashboard consomme des opérations avancées.
- **Functions** : 12 par déploiement (5 utilisées), 1 million d'invocations par mois, réponses de plus de 4,5 Mo uniquement en streaming (c'est le cas des ressources).
- **Usage** : le forfait Hobby est réservé à un usage personnel et non commercial.

Chaque image ou couche audio passe par une Function et une lecture Blob. Pour deux lecteurs, on reste très loin des quotas. Aucun service payant n'est nécessaire.

## Archivage

Pour conserver Loveship indépendamment de Vercel :

1. **Code** : `git bundle create loveship.bundle --all` produit un fichier unique contenant tout l'historique.
2. **Contenus** : conserver le dossier `private/` (le `loveship.json` et les fichiers d'origine des images et de la musique). Si la source locale a été perdue, les télécharger depuis Storage → le store Blob dans le dashboard Vercel.
3. **Secrets** : noter le mot de passe en lieu sûr. Le hash et le secret de session se régénèrent, ils n'ont pas à être archivés.
4. Ranger le tout (bundle, `private/`, une copie de ce README) dans une archive chiffrée, sur deux supports.

**Faire revivre le projet ailleurs** : la partie cliente est un site statique (`dist/`). La partie serveur tient en cinq handlers au standard Web (`Request` → `Response`) qui tournent sur tout hébergeur Node, Deno ou Bun ; le plugin de `vite.config.ts` montre comment les brancher sur un serveur HTTP Node. La seule dépendance à Vercel est la lecture du Blob dans `server/content/load.ts` et `server/content/assets.ts` : la remplacer par une lecture de fichiers du dossier `private/` suffit.

**Version hors ligne** : la carte souvenir exportée en PNG depuis le site est le souvenir autonome le plus simple à conserver.

## Code historique

L'ancien parcours de la Saint-Valentin (intro, trois énigmes, lettre) est conservé tel quel dans `src/legacy/`. Il ne fait pas partie de la nouvelle expérience et n'est **pas inclus dans le build de production**. Pour le revoir en développement : `npm run dev`, puis ouvrir `http://localhost:5173/?legacy`.

Les évolutions sont consignées dans le [CHANGELOG](CHANGELOG.md).
