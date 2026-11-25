import type { LoveshipContent, Mood, NarrativeBlock } from '../../src/types/content.js'

// Contenu de remplissage : volontairement neutre, sans souvenir, date, lieu ni détail personnel.
// Chaque bloc décrit ce que le passage définitif contiendra. Le contenu réel vit dans Vercel Blob
// (content/loveship.json) et remplace celui-ci dès qu'il est présent.

const text = (id: string, content: string, mood?: Mood): NarrativeBlock => ({
	id,
	type: 'text',
	content,
	...(mood && { mood }),
})
const poetry = (id: string, content: string): NarrativeBlock => ({ id, type: 'poetry', content })
// Dimensions = viewBox de chaque SVG de public/placeholders/.
const SIZES: Record<string, { width: number; height: number }> = {
	'photo-versailles': { width: 1200, height: 900 },
	'photo-velo': { width: 960, height: 1200 },
	'photo-londres': { width: 1200, height: 800 },
	'photo-bretagne': { width: 1000, height: 1000 },
	'photo-aujourdhui': { width: 900, height: 1200 },
	'photo-commencement': { width: 1500, height: 900 },
	'aquarelle-repas': { width: 1600, height: 900 },
	'aquarelle-film': { width: 1600, height: 900 },
	'aquarelle-jeux': { width: 1600, height: 900 },
	'aquarelle-astronomie-lego': { width: 1600, height: 900 },
	'aquarelle-horizon': { width: 1600, height: 900 },
}
const photograph = (id: string, assetId: string, slot: string): NarrativeBlock => ({
	id,
	type: 'photograph',
	assetId,
	alt: `Photographie provisoire : emplacement réservé à ${slot}.`,
	...SIZES[assetId],
})
const watercolor = (id: string, assetId: string, slot: string): NarrativeBlock => ({
	id,
	type: 'watercolor',
	assetId,
	alt: `Aquarelle provisoire : emplacement réservé à ${slot}.`,
	...SIZES[assetId],
})

const letter: NarrativeBlock[] = [
	// playful
	text(
		'l01',
		"Ceci est un texte provisoire. Il tient la place du premier passage de la lettre, celui qui s'ouvrira sur un ton léger, complice, avec un peu d'humour. Le texte définitif remplacera ces lignes ; en attendant, elles donnent à la page sa longueur et son rythme de lecture.",
		'playful',
	),
	poetry(
		'l02',
		"Quelques vers d'attente,\nsans rien raconter encore,\npour marquer la place d'une strophe\nlégère et joueuse,\nqui viendra plus tard\nprendre le relais de ces lignes.",
	),
	text(
		'l03',
		"Dans la version définitive, ce paragraphe prolongera l'ouverture avec la même légèreté. Pour l'instant, il se contente de dire ce qu'il remplace : un passage de complicité, écrit plus tard, avec les mots qui conviennent. Rien de ce qui est lu ici n'est destiné à rester.",
	),
	photograph('l04', 'photo-versailles', 'la première escapade romantique'),
	text(
		'l05',
		"Un texte provisoire encore, placé après la première photographie. Il indique simplement qu'un passage plus personnel viendra ici, en écho à l'image qui précède, une fois les textes et les photographies définitifs réunis. D'ici là, ces phrases occupent la page sans rien dire.",
	),
	watercolor('l06', 'aquarelle-repas', 'une scène du quotidien : un repas préparé ensemble'),
	poetry(
		'l07',
		'Ces lignes ne sont pas encore\nles vraies lignes.\nElles attendent, patiemment,\nque les mots justes arrivent\net prennent leur place\nsans bruit.',
	),
	// tender
	text(
		'l08',
		"Le ton change doucement ici. Dans la lettre définitive, ce passage laissera place à la tendresse et aux souvenirs. Ce texte provisoire n'en dit rien : il garde seulement la place, avec une longueur comparable à celle du passage à venir, pour que la lecture ait déjà sa durée réelle.",
		'tender',
	),
	text(
		'l09',
		"Les lignes qui suivront seront écrites avec soin, sans hâte. Elles s'appuieront sur ce qui a réellement été vécu, et c'est pourquoi rien n'est raconté dans ce texte d'attente, qui n'a d'autre rôle que de remplir la page et de permettre d'éprouver la mise en forme.",
	),
	photograph('l10', 'photo-velo', 'la première promenade à vélo'),
	poetry(
		'l11',
		"Une strophe d'attente,\nsans image et sans souvenir,\nqui dit seulement\nqu'ici viendra un moment de douceur,\nécrit avec les mots\nde celui qui signe cette lettre.",
	),
	text(
		'l12',
		"Ce paragraphe est un remplissage. Sa fonction est de permettre de vérifier la mise en page, la révélation progressive du texte et l'enchaînement avec les images, avant que la vraie lettre ne soit prête à être déposée. Il sera supprimé sans regret le moment venu.",
	),
	watercolor('l13', 'aquarelle-film', 'une scène du quotidien : un film regardé sous un plaid'),
	text(
		'l14',
		"Encore un texte provisoire, de longueur moyenne, pour éprouver le défilement sur un téléphone comme sur un ordinateur. Le passage définitif évoquera les petits instants du quotidien, avec simplicité et sans rien forcer ; celui-ci ne fait que réserver l'espace qui lui revient.",
	),
	photograph('l15', 'photo-londres', 'le premier voyage à Londres'),
	// intimate
	text(
		'l16',
		"Dans la version finale, la lettre se fera ici plus intime, plus proche de la confidence. Le texte qui se lit à cet endroit n'est qu'un substitut : il annonce seulement un passage de gratitude, écrit dans un registre plus calme, et occupe la place pendant que les vrais mots se préparent.",
		'intimate',
	),
	poetry(
		'l17',
		"Ici, plus tard,\nquelques vers plus lents,\nplus proches du silence.\nPour l'instant, seulement\nl'annonce de leur place\net de leur souffle.",
	),
	text(
		'l18',
		"Un autre paragraphe provisoire. Il rappelle que la gratitude et la confiance auront leur espace dans la lettre définitive, formulées avec les mots d'Arman, et non avec ces phrases génériques écrites pour patienter. Il est là pour que le rythme de la page soit déjà juste.",
	),
	watercolor('l19', 'aquarelle-jeux', 'une scène du quotidien : une soirée de jeux vidéo coopératifs'),
	text(
		'l20',
		"Ce passage-ci est volontairement neutre. Il ne contient ni anecdote, ni date, ni lieu : seulement la promesse d'un texte à venir, assez long pour que la lecture de cette partie de la lettre ait sa durée naturelle, sans précipitation et sans temps mort.",
	),
	photograph('l21', 'photo-bretagne', 'les premières vacances d’été'),
	poetry(
		'l22',
		"Une strophe de remplissage\nqui n'attend que d'être remplacée,\net qui laisse à la page\nson souffle, ses blancs\net ses respirations.",
	),
	text(
		'l23',
		"À cet endroit, la lettre définitive prolongera l'intimité du passage précédent. Le texte provisoire se contente d'occuper la place, afin de juger de l'équilibre entre les paragraphes, les vers et les images, et de vérifier que rien ne déborde sur un petit écran.",
	),
	// admiring
	text(
		'l24',
		"L'ambiance devient ici plus claire et plus admirative. Le texte définitif dressera le portrait de Victoria, avec les mots qui lui ressemblent. Ces lignes-ci sont provisoires et ne disent rien d'elle : elles tiennent seulement la place d'un passage à écrire avec attention.",
		'admiring',
	),
	text(
		'l25',
		"Quand la lettre sera terminée, ce paragraphe parlera d'admiration et de confiance. D'ici là, il sert de texte d'attente, et sa seule qualité est d'avoir à peu près la longueur d'un vrai passage, de sorte que le défilement soit réaliste dès maintenant.",
	),
	watercolor('l26', 'aquarelle-astronomie-lego', 'une scène du quotidien : astronomie et LEGO'),
	poetry(
		'l27',
		"Des vers à venir\nsur ce qui force le respect,\nsur ce qui inspire confiance.\nPour l'instant, un simple repère,\nposé là comme un signet\ndans une page encore blanche.",
	),
	text(
		'l28',
		"Ce texte provisoire permet de tester la lecture en continu : le défilement, l'apparition progressive des phrases, le retour en arrière dans la lettre. Il sera remplacé sans qu'aucune autre partie du site n'ait à changer, puisque le contenu est séparé de la présentation.",
	),
	photograph('l29', 'photo-aujourdhui', 'le couple aujourd’hui'),
	text(
		'l30',
		"Après l'image qui représente le couple aujourd'hui, le texte définitif prolongera le portrait et l'admiration. Ce paragraphe d'attente garde la place et la longueur de ce prolongement, sans rien affirmer et sans rien inventer de ce qui n'a pas encore été écrit.",
	),
	poetry(
		'l31',
		"Encore quelques vers provisoires,\nsans nom, sans date, sans lieu,\njuste le temps d'une strophe\navant la suite de la lettre.",
	),
	text(
		'l32',
		"Dernier texte d'attente de cette partie. Il rappelle que chaque passage, chaque photographie et chaque aquarelle pourra être remplacé indépendamment, au fur et à mesure que le contenu définitif sera prêt, sans toucher au reste de l'expérience.",
	),
	// luminous
	text(
		'l33',
		"La lettre s'approche ici de sa conclusion, sur une note lumineuse. Le texte définitif célébrera l'anniversaire de Victoria et la première année du couple. Ces lignes provisoires n'en sont que l'annonce, volontairement sans le moindre détail.",
		'luminous',
	),
	poetry(
		'l34',
		'Des vers de conclusion\nviendront prendre ce relais.\nEn attendant, ceux-ci\nne sont que des lignes de passage,\nclairement provisoires.',
	),
	text(
		'l35',
		"Ce paragraphe provisoire prépare la fin de la lettre. Il décrit ce que sera le passage définitif : un mouvement de joie calme, tourné vers ce qui se célèbre aujourd'hui et vers ce qui reste à venir, écrit avec les mots de son auteur.",
	),
	watercolor('l36', 'aquarelle-horizon', 'le couple de dos face à un horizon lumineux'),
	text(
		'l37',
		"Un texte d'attente encore, pour que la fin de la lettre ait sa longueur réelle. Il sera remplacé par les mots que son auteur choisira, sans que la structure de la page ni le parcours du lecteur n'en soient modifiés.",
	),
	poetry(
		'l38',
		'Une dernière strophe provisoire,\nsimple et sans détail,\nqui garde la place\nde la conclusion à venir.',
	),
	text(
		'l39',
		'Fin de la lettre provisoire. Le passage de conclusion définitif tiendra ici, en quelques lignes, avant que le parcours ne se poursuive. Tout ce qui précède, textes comme images, pourra être remplacé indépendamment.',
	),
	photograph('l40', 'photo-commencement', 'le lieu où tout a commencé'),
]

export const placeholderContent: LoveshipContent = {
	placeholder: true,
	recipient: 'Victoria',
	sender: 'Arman',
	anniversaryDate: null,
	authentication: { subtitle: 'Notre histoire continue.' },
	introduction: { envelopeText: 'Victoria' },
	letter,
	transition: {
		content:
			"Si ces mots racontent une partie de ce que nous avons vécu, il en reste quelques-uns que je voudrais consacrer à tout ce qu'il nous reste à vivre.",
	},
	promise: {
		envelopeText: 'À toi, pour tous les lendemains.',
		// Paragraphes séparés par une ligne vide.
		content: [
			'Ce texte est provisoire : il tient la place de la promesse intime, qui sera écrite plus tard et remplacera chacune de ces lignes.',
			"La version définitive abordera six thèmes. Le premier est l'amour porté à Victoria ; ce paragraphe n'en est que l'emplacement, sans aucune formule définitive.",
			"Le deuxième thème est la présence dans les moments difficiles. Le texte final le dira avec les mots d'Arman ; celui-ci se contente d'annoncer qu'il viendra.",
			"Le troisième est le soutien de ses ambitions et de ses rêves. Ici aussi, il ne s'agit que d'un texte d'attente, volontairement sans détail.",
			'Le quatrième est la confiance en elle. Le passage définitif prendra la place de ce paragraphe sans modifier la mise en page.',
			"Le cinquième est la volonté de la choisir chaque jour. Ces quelques mots d'attente seront remplacés par une promesse écrite avec soin.",
			"Le sixième est l'avenir partagé. Le texte définitif le formulera plus tard ; celui-ci garde simplement la place de la fin de la promesse.",
		].join('\n\n'),
		signature: 'Arman',
	},
	bouquet: {
		lily: { assetId: 'fleur-lys', alt: 'Illustration provisoire : un lys blanc.' },
		gerbera: { assetId: 'fleur-gerbera', alt: 'Illustration provisoire : un gerbera rose poudré.' },
	},
	audio: { layers: [] },
}
