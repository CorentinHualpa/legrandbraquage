# Le Grand Braquage — le moteur de calcul

Le code qui produit tous les chiffres du simulateur. Il est public parce que
c'est la seule façon de rendre le résultat opposable : n'importe qui peut le
lire, le rejouer et le contredire.

```bash
pnpm test               # 52 tests
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

2. **Le travailleur non salarié.** C'est le seul régime qui reste. Le
   fonctionnaire est instruit depuis le 06/09/2026, dans ses trois versants.
   Le patron de TPE n'a jamais été un régime de plus : un gérant majoritaire de
   SARL cotise comme un travailleur non salarié, un président de SAS comme un
   assimilé salarié, et le moteur aiguille sur la forme juridique.

   ⚠ Un régime non instruit **lève** au lieu de retomber sur le salarié. Servir
   les barèmes du privé à un indépendant produirait un chiffre faux et
   parfaitement crédible, c'est-à-dire exactement ce que ce dossier reproche à
   la partie adverse.

3. **Le président de SAS et l'assurance chômage.** Il n'y cotise pas, et le
   moteur lui applique encore le calcul complet du salarié. L'écart est de
   quelques dixièmes de point, en sa défaveur.

4. **La courbe de carrière du secteur public.** Elle existe à l'INSEE et nous ne
   l'avons pas. Le fonctionnaire est projeté sur la courbe du privé : bonne
   forme de carrière, pente pas nécessairement juste.

---

## Structure

| Fichier | Rôle |
|---|---|
| `baremes-2026.js` | Toutes les constantes, chacune avec sa source |
| `salaire.js` | Cotisations, RGDU, inversion net ↔ brut |
| `impot.js` | Impôt sur le revenu, TVA et taxes de consommation |
| `carriere.js` | Projection sur quarante ans, en euros constants |
| `capitalisation.js` | Les paliers de l'alibi, les frais, la rente |
| `baremes-fonction-publique.js` | Les barèmes publics, et l'avertissement du COR |
| `fonction-publique.js` | Retenues, cotisations, pension d'un titulaire |
| `liberation.js` | L'heure de libération, avec ses DEUX dénominateurs |
| `index.js` | `simuler()`, `salairePivot()`, `placerSaRetraite()` |
| `test.mjs` | 52 tests, dont l'étalon URSSAF |

Toute modification d'un barème doit citer un texte officiel. C'est cette règle,
et pas le ton de la page, qui rend le simulateur inattaquable.

---

## 4. Le fonctionnaire, et le chiffre à ne pas lire de travers

Ce qui change du privé n'est pas un taux, c'est l'**assiette** : les primes,
environ un quart du brut, sont hors de l'assiette de pension. Tout en découle,
y compris ce paradoxe apparent : un fonctionnaire retient **deux points de
moins** qu'un salarié du privé et a un taux de remplacement projeté **plus
faible**.

| | Retenues salariales | Coût patronal |
|---|---|---|
| Fonction publique d'État | 18,64 % | **78,70 %** |
| Territoriale | 18,57 % | 46,10 % |
| Hospitalière | 18,79 % | 47,57 % |
| Privé, même brut | 20,86 % | 31,90 à 39,27 % |

⚠⚠ **Ces taux patronaux ne se comparent pas, et c'est le COR qui l'écrit.** La
contribution publique « ne résulte pas d'une générosité plus importante du
régime public » et « ne peut pas être comparée à la contribution des employeurs
des salariés du secteur privé ». Elle mesure une démographie : 1,29 cotisant par
retraité contre 2,25 au régime général. Le taux qui financerait les seuls
droits, hors invalidité et départs anticipés, serait de 34,7 %.

**Conséquence directe, et c'est le second résultat du projet :** au périmètre
complet, un fonctionnaire d'État n'a **aucun salaire pivot**. La balance ne
penche jamais en sa faveur, à aucun niveau de traitement. Ce n'est pas un
résultat sur les fonctionnaires, c'est un résultat sur le dénominateur, et
publier le premier sans le second serait malhonnête. Un test verrouille ce cas.

Le biais joue dans l'autre sens aussi : un employeur public ne cotise pas au
chômage, il s'auto-assure. Le coût existe et ne figure sur aucune ligne. La
contrepartie chômage disparaît donc des **deux** plateaux plutôt que d'être
portée au crédit de quelqu'un qui ne l'a pas payée.

Dernier piège, désamorcé : la pension publique se calcule par une formule
publique, et il est tentant de la préférer à un taux de remplacement. Elle rend
un montant **brut**. Le comparer au net d'un salarié gonflait la pension d'un
quart et sortait un taux de remplacement de 83 %, très au-dessus de tout ce que
le COR publie. Les deux régimes passent donc par le même taux net du COR, sur la
même génération, et la formule reste exposée à part, marquée brute.
