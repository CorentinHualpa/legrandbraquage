# Le Grand Braquage

Un simulateur qui chiffre ce que les prélèvements obligatoires prennent à une
personne sur toute sa carrière, ce qu'ils lui achètent, et lequel des deux pèse
le plus lourd. Il rend un verdict, et **ce verdict peut se retourner** : pour un
bas salaire, il affiche une relaxe.

Le moteur de calcul est dans `moteur/`. Il est public parce que c'est la seule
façon de rendre le résultat opposable : n'importe qui peut le lire, le rejouer
et le contredire.

```bash
node --test moteur/     # 66 tests, dont les deux étalons
pnpm dev                # le site
pnpm build
```

## Ce qui tient, et ce qui ne tient pas

Les taux sont vérifiés contre l'**API publique du simulateur officiel de
l'URSSAF** (`mon-entreprise.urssaf.fr`), interrogée sur sept points de salaire.
Les sept tombent au centième. Si un de ces tests casse un jour, c'est le moteur
qui a tort, pas l'URSSAF.

Ce qui est **calculé et défendable au centime** : toutes les cotisations ligne
par ligne, la réduction générale dégressive unique, l'impôt sur le revenu avec
décote et quotient familial, l'inversion du net vers le brut, la projection de
carrière sur la courbe INSEE, le capital équivalent à la pension, et l'échelle
de placement avec ses frais.

Ce qui est un **ordre de grandeur assumé**, et que la page dit tel quel : santé,
éducation, chômage. Le poste retraite, lui, est calculé.

## Les trois règles

1. **Concéder ce qui est juste chez la partie adverse.** Son arithmétique est
   exacte sur ses propres hypothèses. Concéder rend tout le reste crédible ; ne
   pas concéder fait de la page un tract.
2. **Ne jamais sourcer sur un essai militant.** URSSAF, DGFiP, INSEE, COR,
   DREES, AMF, Banque de France, Eurostat, OCDE, Fipeco. Toute modification d'un
   barème doit citer un texte officiel.
3. **Ne jamais toucher au terrain personnel.** On reste sur les chiffres.

## Structure

| Dossier | Rôle |
|---|---|
| `moteur/` | tout le calcul, sans dépendance, testé |
| `src/lib/` | le pont typé vers le moteur, le format, les objets |
| `src/components/` | les pièces du dossier d'instruction |
| `public/images/` | les pièces photographiques, voir le fichier de dépôt |

Le site ne stocke rien et n'envoie rien : la simulation tourne dans le
navigateur de la personne.
