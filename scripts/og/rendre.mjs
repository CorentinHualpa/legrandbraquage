/**
 * Rend l'image de partage par DÉFAUT, `public/og.png`, en 1200 × 630.
 *
 * Depuis le 08/09/2026, la une est fabriquée par la route `/api/avis` : un
 * lien partagé porte tout le dossier dans sa requête, donc son aperçu porte
 * les chiffres de celui qui partage. Ce fichier-ci ne sert plus qu'à UN cas,
 * l'adresse nue, sans requête : celui qui tombe sur `braquage.revolutionagency.ai`
 * sans paramètre voit le salarié médian.
 *
 * Il a d'abord été rendu depuis un `carte.html` par le navigateur du poste en
 * mode headless. Deux mises en page à tenir à jour pour la même une, c'est une
 * de trop : elles ont divergé au premier changement. On appelle donc la route,
 * qui est la seule à savoir dessiner la une.
 *
 *   pnpm dev            (ou tout serveur du projet)
 *   node scripts/og/rendre.mjs [http://localhost:4471]
 *
 * Le rendu écrit `public/og.png`. Le commiter : c'est un livrable, pas un
 * artefact de build. À refaire dès qu'un barème ou la mise en page bouge.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');
const hote = process.argv[2] ?? 'http://localhost:4471';

const reponse = await fetch(`${hote}/api/avis`);
if (!reponse.ok) {
  throw new Error(
    `${hote}/api/avis a répondu ${reponse.status}. Le serveur de dev tourne-t-il ?`,
  );
}
const type = reponse.headers.get('content-type') ?? '';
if (!type.startsWith('image/png')) {
  throw new Error(`Réponse inattendue (${type}) : on attend une image PNG.`);
}

const sortie = join(racine, 'public', 'og.png');
await writeFile(sortie, Buffer.from(await reponse.arrayBuffer()));
console.log(`Écrit : ${sortie}`);
