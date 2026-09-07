/**
 * La caricature du Braqueur, pièce n° 13 du dossier.
 *
 * ⚠ Elle se dessine AU TRAIT, jamais en photoréalisme, et c'est une contrainte
 * de fond et non de goût : une caricature est protégée, un portrait
 * photoréaliste d'un personnage qui « braque » les Français ne l'est plus, il
 * devient une image fabriquée que rien ne distingue d'un montage. Toute la
 * planche d'images du site suit la même règle : aucune ne contient de visage
 * identifiable, et la pièce n° 3 met des façades de ministères là où un tableau
 * d'enquête mettrait des têtes. On accuse une mécanique, pas des gens.
 *
 *   node scripts/braqueur/dessiner.mjs [nombre de pistes]
 *
 * Écrit les pistes dans `scripts/braqueur/pistes/`. La retenue se copie à la
 * main dans `public/images/13-braqueur.<ext>` : le choix est éditorial, il ne
 * s'automatise pas.
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

/**
 * Le personnage : un cambrioleur de dessin de presse, mais qui tient un
 * TROUSSEAU DE CLÉS et pas un pied-de-biche. C'est toute la thèse de la page en
 * un objet : il ne force rien, il a la clé et il a le droit.
 */
const PROMPT = [
  'Hand-drawn pen and ink caricature, single figure, chest up, on aged off-white paper.',
  'A cartoon burglar with a black domino eye mask, a flat cap and a striped jersey,',
  'wearing a smug satisfied grin, holding up a heavy ring of brass keys in one gloved hand,',
  'a bulging money sack slung over the other shoulder.',
  'Vintage French newspaper engraving style, bold confident black linework with cross-hatching,',
  'wanted poster woodcut feel, no colour except black ink on paper,',
  'flat plain paper background, no photorealism, no gradients, no lettering, no text.',
].join(' ');

const NEGATIF = 'photograph, photorealistic, 3d render, cgi, colour, lettering, text, watermark, real person, recognisable face';

const pistes = Number(process.argv[2] ?? 4);
const dossier = join(ici, 'pistes');
await mkdir(dossier, { recursive: true });

const dodo = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * ⚠ Sous 5 $ de crédit, Replicate limite à six créations par minute AVEC UNE
 * RAFALE DE UNE : deux appels lancés coup sur coup, et le second part en 429.
 * On respecte le `retry_after` qu'il renvoie plutôt que d'espacer à l'aveugle.
 */
const appel = async (chemin, options, essais = 5) => {
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

for (let i = 1; i <= pistes; i += 1) {
  let p = await appel(`/models/${MODELE}/predictions`, {
    method: 'POST',
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        // Le cadre de la pièce n° 6 attend un portrait, pas un carré.
        aspect_ratio: '3:4',
        output_format: 'png',
        safety_tolerance: 2,
        prompt_upsampling: false,
        seed: 1000 + i,
        image_prompt_strength: 0,
        negative_prompt: NEGATIF,
      },
    }),
  });

  while (['starting', 'processing'].includes(p.status)) {
    await dodo(2500);
    p = await appel(`/predictions/${p.id}`);
  }

  if (p.status !== 'succeeded') {
    console.log(`piste ${i} : ${p.status} — ${p.error ?? 'sans détail'}`);
    continue;
  }

  const url = Array.isArray(p.output) ? p.output[0] : p.output;
  const octets = Buffer.from(await (await fetch(url)).arrayBuffer());
  const sortie = join(dossier, `braqueur-${String(i).padStart(2, '0')}.png`);
  await writeFile(sortie, octets);
  console.log(`${resolve(sortie)} · ${(octets.length / 1024).toFixed(0)} Ko`);
}
