/**
 * Le butin, dessiné : une image par barreau de l'échelle des objets.
 *
 * Même règle que la caricature du Braqueur : au TRAIT, encre sur papier, sans
 * la moindre personne, sans texte, sans marque lisible. La série doit se lire
 * comme une seule main, parce que l'image change sous le curseur de salaire et
 * qu'un style qui saute d'un barreau à l'autre ferait croire qu'on a changé de
 * dossier.
 *
 *   node scripts/butin/dessiner.mjs [id ...]
 *
 * Écrit dans `scripts/butin/pistes/<id>.png`. Le choix se fait ensuite à la
 * main vers `public/images/butin/<id>.webp` : voir `installer.mjs`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));

const VAULT = 'C:/Users/msi/.secrets/api-keys.env';
const jeton = (readFileSync(VAULT, 'utf8').match(/^REPLICATE_API_TOKEN=(.+)$/m) ?? [])[1]?.trim();
if (!jeton) throw new Error(`REPLICATE_API_TOKEN absent de ${VAULT}`);

const MODELE = 'black-forest-labs/flux-1.1-pro';

/** Le style, identique pour tous : c'est lui qui fait la série. */
const STYLE =
  'Hand-drawn pen and ink illustration on aged off-white paper, vintage French '
  + 'newspaper engraving style, bold confident black linework with cross-hatching, '
  + 'no colour except black ink, flat plain paper background, no people, no faces, '
  + 'no lettering, no text, no logos, no photorealism, no gradients.';

/**
 * Un sujet par barreau de `src/lib/objets.ts`. Les identifiants sont ceux de
 * l'échelle : c'est par eux que l'écran retrouve l'image.
 */
const SUJETS = {
  'grande-maison':
    'A grand French country manor with two storeys of tall windows, a slate roof '
    + 'with chimneys, a long gravel drive and clipped hedges, seen from the gate.',
  'maison-var':
    'A Provençal stone house with a terracotta tiled roof and pale shutters, two '
    + 'cypress trees, a low garden wall, and the corner of a swimming pool behind it.',
  maison:
    'A modest detached suburban French house with a small front lawn, a low fence, '
    + 'a garage door and a single tree, seen from the street.',
  t3:
    'The living room of a three-room apartment with a small balcony door open, a '
    + 'sofa, a bookshelf and two moving boxes still half unpacked.',
  studio:
    'A tiny studio flat with a fold-down wall bed, a kitchenette with two hobs, one '
    + 'window and a single chair, drawn from the doorway.',
  twingo:
    'A small rounded French city car with a short bonnet and big round headlights, '
    + 'parked at a kerb, three-quarter front view.',
  sandero:
    'A plain budget hatchback car with steel wheels and no options, parked in an '
    + 'empty supermarket car park, three-quarter front view.',
  courses:
    'A supermarket trolley half full of groceries, a baguette and a leek sticking '
    + 'out of the top, standing alone in an aisle.',
};

const NEGATIF =
  'person, people, face, hands, text, letters, watermark, logo, brand name, '
  + 'colour, photograph, photorealistic, 3d render';

const demandes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SUJETS);
const dossier = join(ici, 'pistes');
await mkdir(dossier, { recursive: true });

const dodo = (ms) => new Promise((r) => setTimeout(r, ms));

/** ⚠ Sous 5 $ de crédit, Replicate sert une rafale de UNE requête par minute. */
const appel = async (chemin, options, essais = 6) => {
  const r = await fetch(`https://api.replicate.com/v1${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${jeton}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  const j = await r.json();
  if (r.status === 429 && essais > 0) {
    const attente = (Number(j.retry_after) || 10) + 1;
    console.log(`  429, on attend ${attente} s`);
    await dodo(attente * 1000);
    return appel(chemin, options, essais - 1);
  }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};

for (const id of demandes) {
  const sujet = SUJETS[id];
  if (!sujet) {
    console.log(`${id} : inconnu, ignoré`);
    continue;
  }

  let p = await appel(`/models/${MODELE}/predictions`, {
    method: 'POST',
    body: JSON.stringify({
      input: {
        prompt: `${sujet} ${STYLE}`,
        // Paysage : l'image se pose à côté du montant, pas au-dessus.
        aspect_ratio: '3:2',
        output_format: 'png',
        safety_tolerance: 2,
        prompt_upsampling: false,
        seed: 2026,
        negative_prompt: NEGATIF,
      },
    }),
  });

  while (['starting', 'processing'].includes(p.status)) {
    await dodo(2500);
    p = await appel(`/predictions/${p.id}`);
  }

  if (p.status !== 'succeeded') {
    console.log(`${id} : ${p.status} — ${p.error ?? 'sans détail'}`);
    continue;
  }

  const url = Array.isArray(p.output) ? p.output[0] : p.output;
  const octets = Buffer.from(await (await fetch(url)).arrayBuffer());
  const sortie = join(dossier, `${id}.png`);
  await writeFile(sortie, octets);
  console.log(`${resolve(sortie)} · ${(octets.length / 1024).toFixed(0)} Ko`);
}
