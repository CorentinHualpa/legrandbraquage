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
 * L'aparté est le seul écran où il parle en GROS, sur deux tailles, sans bulle.
 * Ses deux phrases sont donc exportées à part : la carte les met en page, la
 * réplique les recolle avec ses balises. Une seule source quand même, sinon
 * c'est précisément la carte la plus mise en avant qui se désaligne.
 */
export const APARTE = {
  fort: "Entre nous. Ils étaient de bonne foi.",
  suite: "Ils vous ont laissé un petit quelque chose dans le coffre. Ou pas. Ça dépend, en fait.",
};

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

  /*
   * L'aparté : il se penche. C'est la réplique la plus basse du parcours.
   *
   * ⚠ Ici c'est la VOIX qui a été alignée sur la carte, pas l'inverse. Les deux
   * phrases de l'écran sont en gros caractères et portent la révélation du
   * parcours (ils ont laissé quelque chose dans le coffre) : c'est le texte qui
   * commande, la voix le suit.
   */
  aparte: `[whispers] ${APARTE.fort} [pause] [tired] ${APARTE.suite}`,

  /* Les trois interrogatoires : école, santé, chômage. Ce qu'on a reçu en face. */
  ecole:
    "[dry] L'école. [scoffs] Gratuite, hein ? C'est ce qu'on dit. "
    + "[flat] Mettez un prix dessus, on verra bien.",
  sante:
    "[tired] La santé. [pause] Là non plus, personne vous a présenté la note. "
    + "[dry] Allez-y, chiffrez. Ça compte dans l'autre plateau.",
  chomage:
    "[flat] Le chômage. [pause] Vous y avez peut-être jamais touché. "
    + "[scoffs] Ça vous a pas empêché de le payer. [dry] Combien, à votre avis ?",

  /* Le rendu : il concède. Un commissaire honnête, c'est ce qui rend le reste crédible. */
  rendu:
    "[tired] Bon, soyons honnêtes. [pause] Ils vous ont pas tout pris pour rien. "
    + "[dry] Voilà ce qu'ils ont laissé. [scoffs] Des cambrioleurs qui repeignent le salon "
    + "avant de partir, faut le voir pour le croire.",

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

export const TOUTES: Record<string, string> = { ...REPLIQUES, ...REACTIONS };

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
