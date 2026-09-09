# La base de connaissance du commissaire

Les dix-neuf fiches que l'agent Dale Voz `le-braqueur` a sous les yeux quand il
répond. Elles ne sont pas décoratives : sans elles il invente, et le dossier
repose entièrement sur le fait qu'il ne le fait jamais.

## Pourquoi elles sont ici et pas seulement en base

Elles ont été écrites directement dans la console le 08/09/2026, donc elles
n'existaient qu'en base : la suppression de l'agent ou de l'espace les
supprimait définitivement, et aucune session ne pouvait les régénérer. Le
prompt, lui, était versionné dans `agent/commissaire.md` depuis le début.

C'était une erreur de méthode et elle a un nom : **ce qui vit en base doit
partir du dépôt**, comme le prompt, les images et les voix. Le MCP sait poser
une fiche (`dalevoz_kb_add_document`), donc rien ne l'imposait.

⚠ Le texte d'origine n'est stocké nulle part dans la plateforme : `kb_documents`
ne garde que le nom, la source et les étiquettes, et le corps vit découpé dans
`kb_chunks`. Ces fichiers sont donc le résultat d'un RECOLLAGE des extraits
(`braquage-savoir-exporter.ts`, dans le dépôt de la plateforme). Le découpage
tombe sur des frontières de paragraphe, donc le texte revient tel qu'il a été
écrit, mais c'est une récupération et pas une sauvegarde : ces fichiers sont
désormais la source, la base en est la copie.

## Reposer une fiche modifiée

Le MCP, jamais un script jetable :

1. `dalevoz_kb_list_documents` pour retrouver l'identifiant de la fiche.
2. `dalevoz_kb_delete_document` sur l'ancienne.
3. `dalevoz_kb_add_document` avec le `nom`, le corps et les `etiquettes` de
   l'en-tête du fichier.

⚠ Les étiquettes comptent : elles servent de périmètre à une éventuelle
casquette. `dossier` est sur les dix-neuf ; les autres (`methode`, `mecanique`,
`alibi`, `verdict`, `placement`, `comparaison`, `fonction-publique`,
`independant`) découpent la base par sujet.

⚠ Une fiche reste d'un seul tenant. Le découpage à l'ingestion est le travail de
la plateforme ; couper soi-même une fiche en trois donne trois extraits qui se
retrouvent séparément et perdent leur raison d'être.
