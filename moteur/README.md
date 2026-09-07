# Le Grand Braquage — le moteur de calcul

Le code qui produit tous les chiffres du simulateur. Il est public parce que
c'est la seule façon de rendre le résultat opposable : n'importe qui peut le
lire, le rejouer et le contredire.

```bash
pnpm test               # 66 tests
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

### 4. Le libéral réglementé n'est pas une nuance de l'artisan

L'écart entre la CIPAV et la sécurité sociale des indépendants **change de
signe** : à 25 000 € de revenu, un libéral réglementé paie **13 % de moins**
qu'un artisan ; à 250 000 €, il paie **24 % de plus**. Le croisement tombe vers
1,5 plafond de sécurité sociale d'assiette.

La cause tient en deux lignes : sa retraite de base est deux fois moins chère
(8,73 % contre 17,87 %) et sa complémentaire deux fois plus (21 % contre 9,1 %
au-dessus d'un plafond). Aucun régime « moyen » ne peut donc servir les deux : il
serait faux des deux côtés à la fois.

Sa pension diffère aussi de STRUCTURE, pas seulement de montant. Depuis 2020 la
base d'un artisan est celle du régime général, la moitié du revenu moyen de ses
vingt-cinq **meilleures** années. Celle d'un libéral est un régime par points, sur
**toute** la carrière, plafonné à 582 points par an. Une mauvaise année pèse chez
l'un et disparaît chez l'autre.

Le salaire-pivot suit : **6 681 € net** pour un libéral CIPAV, contre 5 669 €
pour un artisan.

---

## Deux points ouverts

1. **Effectif ≥ 50 salariés.** Le moteur trouve 0,45 point de moins que la
   ligne de synthèse du rapport de recherche, soit exactement l'écart de
   contribution à la formation professionnelle. Les sept points de la table
   < 50 salariés tombent au centième, donc le doute porte sur la ligne de
   référence, pas sur la mécanique. À reprendre directement sur
   `mon-entreprise.urssaf.fr` avant mise en ligne. L'application reste sur
   l'effectif < 50 en attendant.

2. **Le barème CIPAV a DEUX sources officielles qui se contredisent.** L'URSSAF
   publie 8,73 % de retraite de base et 11 % puis 21 % de complémentaire ; la
   fiche pratique 2026 de la CIPAV elle-même annonce 8,23 %, puis 9 % et 22 %.
   Aucune des deux ne mentionne l'autre. On retient l'URSSAF, qui recouvre ces
   cotisations depuis 2023 et dont les taux sont ceux du décret 2024-688. Un
   libéral qui compare avec sa fiche verra un écart : la page méthode le dit.

   La CIPAV publie par ailleurs, dans la même phrase, un ratio d'un point de
   retraite de base pour 89,71 € de revenus ET un plafond de 557 points, or les
   deux ne se réconcilient pas (le ratio ne rend que 536 points au plafond de la
   tranche). Les deux sont appliqués tels quels ; la pension de base est minorée
   d'environ 4 %.

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
| `baremes-tns.js` | Les barèmes de l'indépendant, et pourquoi l'étalon change |
| `tns.js` | Assiette unique, cotisations, pension par les règles |
| `baremes-cipav.js` | Le barème du libéral réglementé, et ses deux sources qui divergent |
| `cipav.js` | Cotisations CIPAV, et une pension par POINTS dans les deux étages |
| `test.mjs` | 66 tests, dont deux étalons |

Toute modification d'un barème doit citer un texte officiel. C'est cette règle,
et pas le ton de la page, qui rend le simulateur inattaquable.

---

## 4. L'indépendant, et le jour où l'étalon a changé

⚠⚠ **L'API publique de mon-entreprise.urssaf.fr sert encore l'ancien barème**
pour ce régime : 17,75 % de retraite de base, un plafond de complémentaire à
43 891 €, une CSG assise sur l'assiette PLUS les cotisations. La réforme de
l'assiette unique s'applique depuis avril 2026 et les pages de barème de
l'URSSAF publient les nouveaux taux.

L'étalon qui valide le salarié ne peut donc pas valider l'indépendant. La table
de référence est reconstruite depuis le **barème opposable**, ligne par ligne,
et chaque taux renvoie à son article du code de la sécurité sociale. C'est moins
confortable et c'est plus honnête : on vérifie contre le droit, pas contre un
simulateur en retard.

Quinze points de revenu tombent au centime, plus six points de contrôle qui se
recalculent à la main. Le plus discriminant : **le taux de maladie n'est pas un
barème marginal**, c'est un taux unique interpolé puis appliqué à toute
l'assiette. À 22 200 € d'assiette, un barème marginal donne environ 74 €, le bon
calcul en donne 505. Un facteur sept, sur toute la plage.

Deux résultats à connaître :

**Le taux effectif dessine une cloche**, pas une droite. Il culmine à 31,98 % au
voisinage d'un plafond de sécurité sociale d'assiette, puis redescend.

**Il n'y a aucune part employeur**, et ce zéro n'est pas un trou : un
indépendant voit cent pour cent de ce qu'il verse. C'est ce qui place son
salaire pivot à **5 669 €**, très au-dessus des 2 219 € du salarié.

⚠ Sa pension se **calcule** par les règles, faute de taux de remplacement
publié : la DREES exclut explicitement les non-salariés de son champ, parce que
son panel ne contient aucun revenu non salarié, et le COR n'a jamais eu de cas
type artisan ni commerçant. Le montant obtenu dépasse largement la pension
moyenne observée (1 230 €), et le moteur le dit dans son résultat : on simule
une carrière ENTIÈRE en indépendant, ce qui est le cas de 12 % d'entre eux.
97 % des anciens artisans sont polypensionnés et la moitié de leur pension vient
d'un travail salarié. La moyenne basse mesure des carrières courtes dans le
régime, pas des règles avares.

---

## 5. Le fonctionnaire, et le chiffre à ne pas lire de travers

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
