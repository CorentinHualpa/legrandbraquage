/**
 * Rend l'image de partage à partir de `carte.html`, en 1200 × 630.
 *
 * On passe par le navigateur du poste en mode headless plutôt que par
 * `next/og` : la carte est un fichier posé une fois dans `public/`, donc elle
 * ne coûte rien au serveur, ne dépend d'aucune police téléchargée à chaud, et
 * ne peut pas casser en production un jour où Google Fonts répond mal.
 *
 *   node scripts/og/rendre.mjs
 *
 * Le rendu écrit `public/og.png`. Le commiter : c'est un livrable, pas un
 * artefact de build.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

const LARGEUR = 1200;
const HAUTEUR = 630;

/** Les navigateurs candidats, dans l'ordre. Le premier trouvé gagne. */
const CANDIDATS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function trouverNavigateur() {
  const surMesure = process.env.NAVIGATEUR_HEADLESS;
  if (surMesure) {
    if (!existsSync(surMesure)) throw new Error(`NAVIGATEUR_HEADLESS introuvable : ${surMesure}`);
    return surMesure;
  }
  const trouve = CANDIDATS.find((c) => existsSync(c));
  if (!trouve) {
    throw new Error(
      'Aucun navigateur headless trouvé. Poser le chemin dans NAVIGATEUR_HEADLESS.',
    );
  }
  return trouve;
}

const navigateur = trouverNavigateur();
const source = join(ici, 'carte.html');
const sortie = resolve(racine, 'public', 'og.png');

// Chrome et Edge refusent d'écrire dans un profil existant : on leur en donne
// un jetable, sinon le rendu échoue en silence sur un poste où le navigateur
// est déjà ouvert.
const profil = await mkdtemp(join(tmpdir(), 'og-'));

try {
  await execFileP(
    navigateur,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      // laisse le temps aux polices distantes d'arriver ET d'être appliquées
      '--virtual-time-budget=10000',
      `--user-data-dir=${profil}`,
      `--window-size=${LARGEUR},${HAUTEUR}`,
      `--screenshot=${sortie}`,
      pathToFileURL(source).href,
    ],
    { timeout: 90_000 },
  );
} finally {
  await rm(profil, { recursive: true, force: true }).catch(() => {});
}

const png = await readFile(sortie);
if (png.length < 10_000) throw new Error(`Rendu suspect : ${png.length} octets.`);

// Le PNG porte ses dimensions en clair : on les relit plutôt que de faire
// confiance à --window-size, qui rate d'un pixel selon la mise à l'échelle.
const largeur = png.readUInt32BE(16);
const hauteur = png.readUInt32BE(20);
if (largeur !== LARGEUR || hauteur !== HAUTEUR) {
  throw new Error(`Attendu ${LARGEUR}×${HAUTEUR}, obtenu ${largeur}×${hauteur}.`);
}

console.log(`public/og.png · ${largeur}×${hauteur} · ${(png.length / 1024).toFixed(0)} Ko`);
