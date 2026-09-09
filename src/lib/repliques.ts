/**
 * CE QUE DIT LE COMMISSAIRE. Une seule source, pour la bulle ET pour la voix.
 *
 * ⚠⚠ Le défaut que ce fichier supprime : la bulle à l'écran et le fichier audio
 * portaient DEUX textes différents, écrits à des moments différents. Sur la
 * carte du tabac, on lisait « Café ? Cadeau. Enfin, 1,20 €, dont onze centimes
 * qui repartent chez eux » pendant qu'on entendait « Vous fumez ? Vous en faites
 * pas, la morale c'est pas mon service ». Deux textes crédibles chacun de son
 * côté, et un visiteur qui lit une phrase en en entendant une autre (Coq,
 * 09/09/2026 : « aligne le texte surtout »).
 *
 * LA RÈGLE : tout ce qu'il DIT est écrit. L'écrit peut en dire un peu plus.
 *
 * Elle n'est pas symétrique, et c'est volontaire : les fichiers audio sont fixes
 * alors que la bulle connaît les montants du visiteur. Une carte a donc le droit
 * d'ajouter une phrase chiffrée après ce qu'il dit ; elle n'a pas le droit de
 * remplacer la sienne. On peut lire plus qu'on n'entend, jamais l'inverse.
 *
 * ⚠ Les balises entre crochets sont pour le synthétiseur, elles ne se
 * prononcent pas et ne s'affichent pas : `dit()` les retire. C'est le seul vrai
 * levier d'intonation du modèle, donc elles vivent avec le texte plutôt que
 * dans un fichier à côté qui se désynchroniserait.
 *
 * Les fichiers audio se régénèrent par `node scripts/voix/repliques.mjs`, qui
 * lit CE fichier. Une empreinte de chaque texte est écrite dans
 * `public/voix/_textes.json` et un test refuse toute divergence : un mp3 qui
 * date de la version d'avant est un fichier parfaitement valide qui dit autre
 * chose.
 */

/**
 * L'aparté est le seul écran où on parle en GROS, sur deux tailles, sans bulle.
 * Les deux phrases sont donc exportées à part : la carte les met en page, la
 * réplique les recolle avec ses balises. Une seule source quand même, sinon
 * c'est précisément la carte la plus mise en avant qui se désaligne.
 */
export const APARTE = {
  fort: "Objection. Vous lui montrez ce qu'on lui a pris, très bien.",
  suite: "Vous comptez lui montrer ce qu'on lui a rendu, ou c'est pas dans le dossier ?",
};

/**
 * L'AVOCATE DU BRAQUEUR prend la main sur toute la partie « nuance ».
 *
 * Décision de Coq, 09/09/2026 : ce n'est plus le commissaire qui explique que
 * les braqueurs ont laissé quelque chose. Et ça vaut mieux, parce que c'est le
 * seul moment où il devait plaider contre son propre dossier, ce qui l'affadit
 * pendant cinq cartes. Une avocate qui l'interrompt pose le contradictoire au
 * lieu de le diluer, et rend au commissaire sa sortie au verdict.
 *
 * Voix Émilie (`i6ke7jvmGEVUyV4zjSaT`), choisie à l'oreille parmi quatre le
 * 09/09/2026. Même traitement que lui : eleven_v3, stabilité 0, ×1,15.
 *
 * ⚠ Elle ne charrie PAS. Le commissaire lâche une vanne par réplique ; elle
 * pose des questions et laisse la personne répondre. Deux personnages qui
 * blaguent pareil sont un seul personnage avec deux voix.
 */
export const AVOCATE: Record<string, string> = {
  /* Elle entre en coupant. Les deux phrases sont celles de la carte, en gros. */
  aparte: `[dry] ${APARTE.fort} [sarcastic] ${APARTE.suite}`,

  /* Les trois interrogatoires. Elle nomme la chose, puis elle demande le prix. */
  ecole:
    "[flat] L'école. [pause] De la maternelle au diplôme. "
    + "[dry] On vous a présenté une facture ? [sarcastic] Non. [flat] Mettez un prix dessus.",
  sante:
    "[flat] La santé. [pause] Une opération, une nuit aux urgences, un cancer. "
    + "[dry] Vous avez payé combien, vous ?",
  chomage:
    "[flat] Le chômage. [pause] Vous n'y êtes peut-être jamais passé. "
    + "[dry] Vous l'avez payé quand même. [flat] Et ceux qui y sont passés étaient couverts.",

  /* Le rendu : elle conclut, et c'est le visiteur qui a fait le calcul. */
  rendu:
    "[dry] Voilà. [pause] Mon client ne vous a pas tout pris pour rien. "
    + "[sarcastic] Et c'est vous qui venez de le chiffrer.",
};

/** Vrai si cette réplique est dite par l'avocate. Décide la voix ET la bulle. */
export function estAvocate(nom: string): boolean {
  return nom in AVOCATE;
}

/** Ce qu'il dit à l'ARRIVÉE sur chaque carte. Une par écran. */
export const REPLIQUES: Record<string, string> = {
  /** La seule validée mot pour mot par Coq. */
  deposition:
    "[tired] Asseyez-vous. [pause] Nom, prénom... [scoffs] laissez tomber, ça n'intéresse personne. "
    + "[sarcastic] Ce qui m'intéresse, MOI, c'est combien vous palpez par mois. "
    + "[whispers] Écrivez-le là. [dry] Sur le procès-verbal.",

  /*
   * ⚠ Le « Bon. » d'ouverture n'est pas un tic, c'est une CHARNIÈRE. C'est la
   * seule carte qu'on atteint après une réaction du commissaire (celle au
   * montant signé), donc la seule où il reprend la parole après s'être déjà
   * exprimé. Sans ce mot, il attaque « Vous fumez ? » comme s'il venait
   * d'entrer dans la pièce, et les deux répliques se lisent comme deux
   * personnes.
   */
  tabac:
    "[tired] Bon. [pause] Vous fumez ? [scoffs] Vous en faites pas, la morale c'est pas mon service. "
    + "[flat] Combien de paquets ? Et comptez ceux que vous taxez aux collègues.",
  carburant:
    "[tired] Et la caisse ? [scoffs] Plutôt écolo, ou à frimer avec votre BM ? "
    + "[dry] Dites-moi juste combien de pleins.",
  alcool:
    "[dry] Et à boire ? [scoffs] Mentez pas, on est au commissariat, pas chez la belle-famille. "
    + "[flat] Combien de verres dans la semaine ?",

  /* La pièce à conviction : le mécanisme. Il explique, il ne s'emporte pas. */
  /*
   * Il juge un MODE OPÉRATOIRE, pas un prélèvement : c'est le seul angle où le
   * commissaire reste un commissaire au lieu de devenir un contribuable qui
   * râle. Les quatre lignes sont sous ses yeux à l'écran, il n'a donc pas à les
   * compter à voix haute.
   */
  pris:
    "[flat] Voilà la pièce à conviction. [dry] Du travail propre, hein. "
    + "Pas une porte forcée, pas un cri. [scoffs] Et personne qui porte plainte.",
  butin:
    "[flat] Voilà le butin. [scoffs] C'est pas moi qui fixe les prix, hein. Moi je compte. "
    + "[dry] Et franchement, j'ai rarement vu un scellé aussi bien rempli.",

  /* L'horaire : le moment où il devient presque bavard. */
  liberation:
    "[tired] Regardez votre montre. [pause] Vous, vous bossez depuis janvier. Eux aussi. "
    + "[dry] Sauf qu'eux, ils s'arrêtent pile là. [flat] Tous les ans, à la minute près.",

  /* La bourse : l'avocat du Braqueur demande la parole. Il s'agace un peu. */
  bourse:
    "[dry] Dernière question. [pause] Ce pognon, vous l'auriez mis où ? "
    + "[scoffs] Et me dites pas que vous y auriez pas touché, hein.",

  /* Le verdict : le tampon vient de tomber. Il ne triomphe pas, il constate. */
  verdict:
    "[flat] Voilà. [pause] Tampon. [dry] Je commente pas les verdicts. "
    + "[tired] Mais celui-là, vous voulez savoir d'où il sort.",

  /* L'édition de demain : la sortie. C'est la dernière chose qu'on entend. */
  avis:
    "[tired] C'est fini pour ce soir. [pause] Vous voulez porter plainte pour de vrai ? "
    + "[dry] C'est pas ici. [scoffs] C'est tous les cinq ans. Même guichet.",
};

/**
 * CE QU'IL RÉPOND AU MONTANT SIGNÉ, sur la déposition.
 *
 * Les seules répliques qui dépendent de ce que la personne a saisi. Elles ne
 * disent toujours AUCUN chiffre : il est déjà en gros sur le procès-verbal, ce
 * qui change c'est le REGISTRE.
 *
 * ⚠ Elles restent courtes (quatre à sept secondes) : la carte suivante attend
 * leur fin, plus deux secondes de bureau, avant de parler à son tour.
 *
 * ⚠ Un `[pause]` coûte une seconde et demie à deux secondes de fichier, mesuré
 * en régénérant les quatre avec puis sans. Sur une réplique de cinq secondes
 * c'est un tiers de la durée : elles n'en portent aucun.
 */
export const REACTIONS: Record<string, string> = {
  /* Il cede la parole a l'avocate, sur l'aparte. Trois mots, c'est tout. */
  "aparte-concede": "[tired] Maître. [pause] Allez-y.",

  /*
   * « Content de votre cadeau ? », sur le butin. Il répond AU CLIC, pas au
   * bouton suivant : une réaction qui arrive une carte plus tard n'est plus une
   * réaction, c'est un commentaire (Coq, 09/09/2026, la règle vaut pour toutes
   * les réponses cliquables).
   */
  "cadeau-partage":
    "[sarcastic] Voilà un bon citoyen. [scoffs] On repasse le mois prochain, même heure.",
  "cadeau-picotte":
    "[dry] Ça picotte quarante-trois ans, oui. [tired] Après, on s'habitue. [flat] C'est prévu pour.",

  /*
   * L'ENVELOPPE QU'ON CHOISIT, sur la bourse. Six placements, quatre réactions :
   * ce qu'il commente c'est le TEMPÉRAMENT, pas le produit. Le livret A et le
   * fonds en euros disent la même chose de quelqu'un, le MSCI et le S&P aussi.
   * Le CAC garde la sienne parce que c'est la seule qui appelle une vanne
   * française, et l'immobilier parce que c'est un choix de vie autant qu'un
   * placement.
   *
   * ⚠ Aucun taux, aucun montant : les rendements sont affichés sur chaque
   * enveloppe et le total se recalcule dessous.
   */
  "placement-prudent":
    "[tired] Prudent. [scoffs] Vous avez rien risqué, et ils vous ont quand même tout pris.",
  "placement-pierre":
    "[dry] La pierre. [scoffs] Vous auriez eu des locataires, des travaux, et un impôt de plus. [flat] Mais vous auriez eu les murs.",
  "placement-audacieux":
    "[scoffs] Ah. [sarcastic] Vous avez pas froid aux yeux, vous. [dry] J'aime ça.",
  "placement-cac":
    "[scoffs] Le CAC. [sarcastic] Patriote, en plus. [dry] Vos braqueurs vont être touchés.",

  /*
   * Sous le SMIC : il ne prend pas de pincettes, mais il ne blague pas non plus
   * SUR la personne. La vanne vise toujours les braqueurs, jamais celui qui est
   * assis en face : à ce niveau de salaire, un trait d'humour se prend de
   * travers, et on perd la personne pour le reste du parcours.
   */
  "signature-sous-smic":
    "[tired] D'accord. Installez-vous. [dry] Même là-dedans, ils ont trouvé à se servir. [scoffs] Faut le faire.",

  /*
   * Du SMIC au médian : le cas ordinaire, donc le ton le plus plat.
   *
   * ⚠ Elle NE commence PAS par « Bon ». C'est le premier mot de la carte du
   * tabac, qui arrive deux secondes après, et on entendait « Bon… » puis
   * « Bon… » d'affilée. Le défaut n'existe dans aucun des deux textes pris
   * séparément, il n'apparaît qu'enchaîné : on ne le voit pas en relisant, on
   * l'entend une fois le parcours joué. Un test garde la porte.
   *
   * Le voisin y était pour annoncer la carte du témoin ; elle a été retirée du
   * parcours le 09/09/2026 et la phrase tient sans elle, c'est une façon de
   * dire « tout le monde », pas une promesse d'écran.
   */
  "signature-jusqu-au-median":
    "[flat] Le salaire de tout le monde. [dry] Ils ont fait pareil avec votre voisin. [scoffs] Et avec le sien.",

  /* Au-dessus du médian. Formulation de Coq, gardée telle quelle. */
  "signature-au-dessus":
    "[scoffs] Ah. Pas mal. [sarcastic] Les braqueurs ont dû se régaler. [laughs]",

  /* Le haut du panier : la seule fois où il se penche vraiment. */
  "signature-tres-haut":
    "[whispers] Oh. [scoffs] Alors là. [tired] J'ai vu des braquages à main armée rapporter moins. "
    + "[dry] Et eux, ils ont pris vingt ans.",
};

export const TOUTES: Record<string, string> = { ...REPLIQUES, ...REACTIONS, ...AVOCATE };

/**
 * Le texte tel qu'on le LIT : sans les balises, guillemets compris.
 *
 * Les guillemets sont ajoutés ici plutôt que tapés dans chaque carte, parce
 * qu'une bulle sur deux les oubliait et que la citation est ce qui distingue ce
 * qu'il dit de ce que le dossier affiche.
 */
export function dit(nom: string): string {
  const nu = texte(nom);
  if (!nu) return "";
  return `« ${nu} »`;
}

/**
 * Le même texte SANS les guillemets, pour les cartes qui ajoutent une phrase.
 *
 * Elles en ajoutent une parce qu'elles connaissent les montants du visiteur,
 * alors que les fichiers audio sont fixes. Tout ce qu'il DIT reste écrit ; c'est
 * l'écrit qui en dit un peu plus.
 */
export function texte(nom: string): string {
  const brut = TOUTES[nom];
  if (!brut) return "";
  return brut.replace(/\[[a-z]+\]\s*/g, "").replace(/\s+/g, " ").trim();
}
