# Forestois SC 1 · site du club

Site Angular 22 pour Forestois SC 1 (ABSSA, division 4C). Le projet utilise des composants standalone, Signals et une séparation Domain / Application / Infrastructure / Presentation.

L’interface est disponible en français et en espagnol sur les mêmes routes. Le bouton `FR` / `ES` change la langue immédiatement et mémorise le choix dans le navigateur.

## Administration locale

La route directe `/#/admin` ouvre un tableau de bord simplifié inspiré des fonctions essentielles de SportEasy : gestion de l’effectif et création d’événements du club. Les événements sont stockés dans le navigateur.

Chaque membre peut recevoir une photo à la création ou depuis la liste de l’effectif. L’image est recadrée au centre, redimensionnée en 384 × 384 px et convertie automatiquement en WebP avant son stockage local. Les formats JPEG, PNG et WebP sont acceptés, avec une limite de 10 Mo pour le fichier source.

- Identifiant : `forestois`
- Mot de passe : `CocoLoco2026!`

Ces identifiants sont volontairement codés dans le frontend pour cette maquette. Ils ne constituent pas une sécurité réelle : une mise en production avec données privées nécessitera un backend, une authentification côté serveur et une base de données partagée.

## Effectif SportEasy

L’effectif initial a été importé depuis le fichier SportEasy fourni le 25 septembre 2026. Seuls les noms, statuts joueur/joueur-coach, postes et numéros de maillot sont intégrés. Les coordonnées, adresses, dates de naissance et autres données privées du tableur ne sont pas publiées. Les postes absents de l’export sont affichés « à confirmer ».

## Instagram

La page Instagram pointe vers `@forestoisc3` et propose une sélection de publications publiques définie dans `src/app/infrastructure/instagram-feed.ts`. Les cartes ouvrent toujours la publication originale. Instagram laissant les intégrations anonymes vides dans certains navigateurs, le site utilise des cartes locales fiables plutôt que de grands cadres blancs. Pour une mise à jour réellement automatique, remplacer cette source par un endpoint serveur utilisant l’API Meta ; ne jamais placer le token Meta dans le code Angular.

## Démarrer dans Codex

```bash
npm install
npm start
```

Puis ouvrir `http://localhost:4200/`. Pour valider la compilation : `npm run build`.

Les scripts `start` et `build` lancent Angular avec Node 22 (LTS). Cela évite les plantages natifs observés avec Node 26, qui n'est pas encore une version prise en charge par Angular 22.

## Calendrier

- Les 26 rencontres et les résultats connus sont dans `src/app/infrastructure/initial-fixtures.ts`.
- Les dates, coups d’envoi, adversaires et terrains sont une copie de la page officielle [CalABSSA · Forestois SC 1](https://www.calabssa.be/c/152_1_forestois_sc/).
- La prochaine rencontre reste affichée jusqu’à quatre heures après le coup d’envoi. Elle est recalculée chaque minute.
- La page Matchs affiche l’encart du match à venir, l’entraînement récurrent du mardi (rendez-vous 19 h 45, début à 20 h au Bempt), puis les rencontres avec filtres domicile / extérieur.
- `npm run import:calendar` récupère les blocs structurés `icalEvents` et `standings` publiés dans la page rendue par CalABSSA, les valide, puis régénère les fichiers de secours et `public/data/calabssa.json`.
- En production, Angular lit `data/calabssa.json` au démarrage. Si ce fichier ou CalABSSA est temporairement indisponible, les données compilées dans l’application restent utilisées comme secours.
- La page affiche la date de la dernière mise à jour réussie. Une synchronisation échouée ne remplace jamais le dernier fichier valide.
- Les horodatages UTC de CalABSSA sont convertis en heure locale `Europe/Brussels` (heure d’été/hiver comprise). Vérifier le diff généré avant publication.

### Synchronisation serveur chaque dimanche à 20 h

Le build contient `api/sync-calabssa.php`. Ce script PHP est réservé à la ligne de commande : il n’est pas possible de le déclencher publiquement depuis une URL. Il télécharge les données officielles, exige au moins 26 rencontres et 2 équipes, puis remplace atomiquement `data/calabssa.json`. Le calendrier et le classement se mettent ainsi à jour sans recompiler Angular.

Prérequis : PHP 8 en ligne de commande, sorties HTTPS autorisées, extension cURL ou `allow_url_fopen`, et droit d’écriture PHP sur le dossier `data/`.

Pour tester une première synchronisation sur le serveur :

```bash
/usr/bin/php /CHEMIN_DU_SITE/coco-loco/api/sync-calabssa.php --force
```

Dans le panneau de l’hébergeur, ajouter ensuite cette tâche cron :

```cron
0 * * * 0 /usr/bin/php /CHEMIN_DU_SITE/coco-loco/api/sync-calabssa.php >> /CHEMIN_DU_SITE/coco-loco/api/data/calabssa-sync.log 2>&1
```

Le cron se présente chaque heure du dimanche, mais le script n’effectue réellement l’import qu’entre 20 h et 21 h selon le fuseau `Europe/Brussels`. Cette garde interne conserve l’heure correcte lors des changements d’heure d’été et d’hiver, indépendamment du fuseau du serveur. Adapter `/usr/bin/php` et `/CHEMIN_DU_SITE` aux valeurs indiquées par l’hébergeur.

## Où poursuivre le développement

- `src/app/domain/` : modèles et contrats des dépôts.
- `src/app/application/` : façade et règles côté application.
- `src/app/infrastructure/` : dépôt navigateur et données initiales.
- `src/app/presentation/` : pages Angular.
- `src/styles.scss` : thème, variables et styles partagés.
- `src/app/brand.config.ts` : couleurs et variantes des blasons.

L’effectif administré et les événements restent stockés dans le navigateur. La seule partie serveur actuelle est le registre d’acceptation du règlement, basé sur PHP et un fichier JSON.

## Accord du règlement et registre PHP

La section d’accord est pilotée par `src/app/rules-agreement.config.ts` :

- `enabled` affiche ou masque toute la section ;
- `deadline` accepte une date ISO ou `null` tant que l’échéance n’est pas fixée ;
- `regulationVersion` distingue les versions successives du règlement ;
- `apiPath` indique l’adresse relative de l’API.

Le joueur sélectionne son profil et confirme son accord. L’API `public/api/agreements.php` enregistre le nom, l’identifiant, la version du règlement et l’heure fournie par le serveur. Un verrou de fichier protège les écritures simultanées. Le serveur crée le registre `api/data/.acceptances.json` lors du premier accès ; il n’est volontairement pas inclus dans le build afin qu’un déploiement ultérieur n’efface pas les accords. Son accès HTTP direct est bloqué par `.htaccess`.

Prérequis d’hébergement : PHP 8 ou plus récent et droit d’écriture PHP sur `api/data/`. Sur un hébergement Apache classique, attribuer au besoin les permissions `775` au dossier `api/data` depuis le gestionnaire de fichiers. Si le serveur affiche le code source PHP au lieu d’exécuter l’API, ne pas utiliser cette installation avant d’avoir activé PHP.

Pendant `npm start`, Angular ne peut pas exécuter PHP : la page passe volontairement en mode hors ligne et garde les accords dans `localStorage`. Après déploiement sur PHP, les accords locaux sont envoyés au registre central dès que l’API répond.

Le choix d’un nom n’est pas une authentification forte. Pour empêcher l’usurpation, une prochaine étape pourra ajouter un code personnel par joueur ou une connexion sécurisée.

## Déployer sur un autre hébergeur

1. Installer les dépendances avec `npm install`.
2. Construire le site avec `npm run build`.
3. Publier **le contenu du dossier `dist/`** comme site statique, pas la racine du projet.

Pour une publication sous `https://domaine.be/coco-loco/`, utiliser `npm run build:coco-loco`. Ce script produit explicitement un build production avec `<base href="/coco-loco/">`.

Le dossier `dist/api/` doit être envoyé avec le reste du build. Ne jamais supprimer ni remplacer le fichier `.acceptances.json` déjà créé sur le serveur lors d’une mise à jour. Vérifier ensuite que `https://domaine.be/coco-loco/api/agreements.php` renvoie du JSON et non le contenu du fichier PHP.

Les illustrations et les deux blasons se trouvent dans `public/assets/`. Angular les copie dans `dist/assets/`. Les pages utilisent des chemins relatifs à la base Angular afin qu’ils fonctionnent aussi lorsque l’application est hébergée sous un sous-chemin. Vérifier que le dossier publié contient bien `index.html` et `assets/`.
