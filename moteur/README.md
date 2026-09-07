# Le Grand Braquage — le moteur de calcul

Le code qui produit tous les chiffres du simulateur. Il est public parce que
c'est la seule façon de rendre le résultat opposable : n'importe qui peut le
lire, le rejouer et le contredire.

```bash
node --test moteur/     # 28 tests
```

Aucune dépendance, aucune étape de build. Modules ES natifs, exécutables tels
quels par Node et importables dans Next.

---

## L'étalon

Les taux sont vérifiés contre **l'API publique du simulateur officiel de
l'URSSAF** (`mon-entreprise.urssaf.fr`), interrogée le 05/09/2026 sur sept
points de salaire. Les sept tombent au centième. Si un de ces tests casse un
jour, c'est le moteur qui a tort, pas l'URSSAF.

| Brut mensuel | Salarial | Patronal | RGDU |
|---|---|---|---|
| 1 823,03 € (SMIC) | 20,84 % | **3,09 %** | 725,75 € |
| 3 000 € | 20,84 % | 32,91 % | 299,70 € |
| 5 000 € | 20,74 % | 40,91 % | 109,00 € |
| 10 000 € | 20,27 % | **43,05 %** | 0 € |

---

## Les trois résultats

### 1. Le salaire-pivot est le salaire médian

**2 219 € net par mois**, périmètre complet. Le salaire net médian du privé
français est de **2 190 €** (INSEE 2024).

Autrement dit : **la moitié des salariés français reçoivent plus qu'ils ne
versent, l'autre moitié l'inverse.** Le point de bascule tombe à trente euros
du médian. Ce n'est pas un cadrage, c'est ce que rendent les barèmes.

Personne ne publie ce chiffre. C'est la ligne de la page.

### 2. Si on ne compte que la fiche de paie, la bascule n'existe pas

Sur le seul périmètre des cotisations salariales, **aucun salarié n'est perdant
net**, à aucun niveau de revenu. Le braquage n'apparaît qu'en ajoutant ce qui
est prélevé avant la paie et après la paie. Ce qu'on voit ne suffit jamais à
faire le procès.

### 3. Le facteur 14

Au SMIC, les cotisations patronales pèsent **3,09 % du brut**. À 10 000 €,
**43,05 %**. La RGDU rembourse presque intégralement les bas salaires, et c'est
elle, à elle seule, qui fabrique le point de bascule.

---

## Résultats par salaire

Salarié du privé, non-cadre, effectif < 50, célibataire, carrière de 22 à
64 ans, en euros d'aujourd'hui.

| Net/mois | Salariales | Patronales | IR | Conso | **Total prélevé** | Reçu | Verdict |
|---|---|---|---|---|---|---|---|
| 1 450 € | 215 k€ | 159 k€ | 13 k€ | 96 k€ | **483 k€** | 873 k€ | relaxe, +390 k€ |
| 1 800 € | 273 k€ | 343 k€ | 40 k€ | 110 k€ | **766 k€** | 990 k€ | relaxe, +224 k€ |
| 2 190 € (médian) | 343 k€ | 550 k€ | 89 k€ | 120 k€ | **1 103 k€** | 1 120 k€ | relaxe, +17 k€ |
| 2 500 € | 402 k€ | 711 k€ | 143 k€ | 124 k€ | **1 379 k€** | 1 223 k€ | braquage, 156 k€ |
| 3 000 € | 498 k€ | 966 k€ | 241 k€ | 123 k€ | **1 827 k€** | 1 389 k€ | braquage, 437 k€ |
| 4 000 € | 688 k€ | 1 424 k€ | 449 k€ | 121 k€ | **2 682 k€** | 1 723 k€ | braquage, 959 k€ |
| 6 000 € | 1 091 k€ | 2 319 k€ | 974 k€ | 159 k€ | **4 544 k€** | 2 389 k€ | braquage, 2 155 k€ |

⚠ Ces montants remplacent les valeurs d'illustration des maquettes. Le cas type
à 2 500 € passe de 1 057 k€ à **1 379 k€** prélevés et de 1 004 k€ à
**1 223 k€** reçus, pour un écart de **156 k€** au lieu de 53 k€.

---

## Ce qui est calculé et ce qui ne l'est pas

**Calculé, défendable au centime** : toutes les cotisations ligne par ligne, la
RGDU, l'impôt sur le revenu avec décote et quotient familial, l'inversion du
net vers le brut, la projection de carrière sur la courbe INSEE, et le capital
équivalent à la pension.

**Ordres de grandeur assumés**, à remplacer par un chiffrage par décile :
santé (216 k€), éducation (127 k€), chômage (47 k€). Le poste retraite, lui,
est calculé.

**Approximation signalée** : le taux d'effort TVA est interpolé linéairement
entre le premier et le dernier décile, alors que le Conseil des prélèvements
obligatoires décrit une courbe proportionnelle jusqu'au 8e décile puis
régressive. La table complète est dans un rapport que nous n'avons pas pu
ouvrir. À corriger dès qu'on l'a, et à dire dans la page méthodologie.

---

## Deux points ouverts

1. **Effectif ≥ 50 salariés.** Le moteur trouve 0,45 point de moins que la
   ligne de synthèse du rapport de recherche, soit exactement l'écart de
   contribution à la formation professionnelle. Les sept points de la table
   < 50 salariés tombent au centième, donc le doute porte sur la ligne de
   référence, pas sur la mécanique. À reprendre directement sur
   `mon-entreprise.urssaf.fr` avant mise en ligne. L'application reste sur
   l'effectif < 50 en attendant.

2. **Statuts autres que salarié du privé.** Indépendant, fonctionnaire et
   patron de TPE sont dans les maquettes mais pas dans le moteur. Chacun a son
   propre régime : ce sont trois chantiers distincts, pas un paramètre.

---

## Structure

| Fichier | Rôle |
|---|---|
| `baremes-2026.js` | Toutes les constantes, chacune avec sa source |
| `salaire.js` | Cotisations, RGDU, inversion net ↔ brut |
| `impot.js` | Impôt sur le revenu, TVA et taxes de consommation |
| `carriere.js` | Projection sur quarante ans, en euros constants |
| `capitalisation.js` | Les paliers de l'alibi, les frais, la rente |
| `index.js` | `simuler()` et `salairePivot()` |
| `test.mjs` | 28 tests, dont l'étalon URSSAF |

Toute modification d'un barème doit citer un texte officiel. C'est cette règle,
et pas le ton de la page, qui rend le simulateur inattaquable.
