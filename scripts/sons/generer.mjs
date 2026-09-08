/**
 * Les sons du dossier, générés par l'API « sound effects » d'ElevenLabs.
 *
 * Même raison que les dessins du butin : une série doit sonner comme un seul
 * enregistrement. Aller chercher huit échantillons libres de droits sur trois
 * banques différentes donne huit pièces qui ne vont pas ensemble, et huit
 * licences à suivre. Ici on décrit ce qu'on veut, la même main les rend.
 *
 *   node scripts/sons/generer.mjs [nom ...]
 *
 * Écrit `public/sons/<nom>.mp3`. Les fichiers sont des LIVRABLES, on les
 * commite : la génération coûte des crédits et ne doit pas se rejouer au
 * build. Clé lue dans le vault, jamais affichée.
 *
 * ⚠ Ne JAMAIS générer de musique ici. Le dossier est une scène de crime, pas
 * un film : ce qu'on veut, ce sont des bruits qui datent la pièce (une porte,
 * un tampon, une machine à écrire), pas une nappe qui dit au visiteur ce
 * qu'il doit ressentir.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');
const sortie = join(racine, 'public', 'sons');

const VAULT = 'C:/Users/msi/.secrets/api-keys.env';
const cle = (readFileSync(VAULT, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!cle) throw new Error(`ELEVENLABS_API_KEY absent de ${VAULT}`);

/**
 * Un son par moment du parcours. `influence` près de 1 colle au texte, près
 * de 0 laisse le modèle inventer : pour un bruit précis on monte, pour une
 * ambiance on descend.
 */
const SONS = {
  porte: {
    duree: 2.5,
    influence: 0.75,
    texte:
      'A heavy old wooden door with a metal latch closing shut in a quiet 1970s police station '
      + 'corridor, single close, slight room reverb, no music, no voices',
  },
  page: {
    duree: 1.2,
    influence: 0.8,
    texte:
      'A single sheet of thick paper being turned over in a cardboard case file, dry paper '
      + 'rustle, close microphone, no music, no voices',
  },
  tampon: {
    duree: 1.4,
    influence: 0.85,
    texte:
      'A rubber ink stamp pressed hard onto a paper document on a wooden desk, one firm thud '
      + 'then the stamp lifting, close microphone, no music, no voices',
  },
  flash: {
    duree: 1.6,
    influence: 0.8,
    texte:
      'A vintage press camera flashbulb firing, short electric pop with a faint capacitor whine '
      + 'before it, close microphone, no music, no voices',
  },
  machine: {
    duree: 0.9,
    influence: 0.85,
    texte:
      'One single key strike on a mechanical typewriter hitting paper, sharp metallic clack, '
      + 'close microphone, dry, no music, no voices',
  },
  ruban: {
    duree: 2,
    influence: 0.8,
    texte:
      'A length of plastic barrier tape being pulled off a roll and stretched taut, plastic '
      + 'crackle and a sharp tear, close microphone, no music, no voices',
  },
  coche: {
    duree: 0.7,
    influence: 0.8,
    texte:
      'A ballpoint pen ticking a box on a paper form, two short scratches on paper, very close '
      + 'microphone, dry, no music, no voices',
  },
  /*
   * ⚠ L'ambiance `commissariat` de 22 secondes a été RETIRÉE le 08/09/2026.
   * Elle tournait en boucle sur tout le parcours, et l'oreille repérait la
   * boucle au deuxième passage. Elle contenait en plus « faint radio static »,
   * un grésillement CONTINU, c'est-à-dire le pire contenu possible pour une
   * boucle courte, puisque rien n'y bouge. Coq : « c'est le même grésillement
   * qui tourne en boucle ».
   *
   * Les ambiances vivent maintenant dans `ambiances.mjs`, à côté : l'API
   * plafonne à 22 secondes par appel, donc elles se fabriquent en plusieurs
   * PRISES de la même pièce enchaînées en fondu. Ce fichier garde les bruits
   * ponctuels, qui tiennent en un appel.
   */
  'bruit-telephone': {
    duree: 3.5,
    influence: 0.8,
    texte:
      'An old rotary desk telephone ringing twice in a distant room and stopping unanswered, '
      + 'corridor reverb, no music, no voices',
  },
  'bruit-chaise': {
    duree: 1.6,
    influence: 0.85,
    texte:
      'A heavy wooden chair scraping back on a tiled floor, close microphone, dry, no music, '
      + 'no voices',
  },
  'bruit-briquet': {
    duree: 1.4,
    influence: 0.85,
    texte:
      'A metal petrol lighter opening with a click, flint striking, flame catching, then the lid '
      + 'snapping shut, very close microphone, no music, no voices',
  },
  'bruit-tiroir': {
    duree: 2.2,
    influence: 0.8,
    texte:
      'A metal filing cabinet drawer rolling open and being pushed shut with a dull clang, '
      + 'office room reverb, no music, no voices',
  },
  'bruit-clavier-court': {
    duree: 2.2,
    influence: 0.85,
    texte:
      'A short burst of typing on a modern membrane computer keyboard, about ten keystrokes then '
      + 'stopping, office desk, close microphone, no music, no voices',
  },
  'bruit-clavier-long': {
    duree: 5,
    influence: 0.8,
    texte:
      'Someone typing a sentence on a computer keyboard at a police station desk, uneven rhythm '
      + 'with two short pauses, ending with a single firm Enter key press, close microphone, '
      + 'no music, no voices',
  },
  'bruit-clavier-mecanique': {
    duree: 3,
    influence: 0.85,
    texte:
      'Typing on an old clicky mechanical computer keyboard, loud plastic clacks, about fifteen '
      + 'keystrokes, office room, close microphone, no music, no voices',
  },
};

const demandes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SONS);
await mkdir(sortie, { recursive: true });

for (const nom of demandes) {
  const son = SONS[nom];
  if (!son) throw new Error(`Son inconnu : « ${nom} ». Connus : ${Object.keys(SONS).join(', ')}`);

  const reponse = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': cle, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: son.texte,
      duration_seconds: son.duree,
      prompt_influence: son.influence,
    }),
  });
  if (!reponse.ok) {
    throw new Error(`${nom} : ${reponse.status} ${(await reponse.text()).slice(0, 300)}`);
  }

  const octets = Buffer.from(await reponse.arrayBuffer());
  const fichier = join(sortie, `${nom}.mp3`);
  await writeFile(fichier, octets);
  console.log(`${nom.padEnd(14)} ${String(Math.round(octets.length / 1024)).padStart(4)} Ko  ${fichier}`);
}
