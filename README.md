# Forestois SC 1 · site du club

Site Angular 22 pour Forestois SC 1 (ABSSA, division 4C). Le projet utilise des composants standalone, Signals et une séparation Domain / Application / Infrastructure / Presentation.

L’interface est disponible en français et en espagnol sur les mêmes routes. Le bouton `FR` / `ES` change la langue immédiatement et mémorise le choix dans le navigateur.

## Administration

La route directe `/#/admin` ouvre un tableau de bord simplifié inspiré des fonctions essentielles de SportEasy. L’authentification est vérifiée par PHP : le mot de passe n’est jamais inclus dans le bundle Angular. La session utilise un cookie `HttpOnly`, un jeton CSRF, une expiration de huit heures et une limitation des essais de connexion.

L’effectif est partagé entre tous les appareils dans `api/data/.members.json`. Le dashboard permet de créer, modifier, supprimer, activer ou désactiver un membre, de gérer son rôle, son numéro et plusieurs postes sous forme de tags. Chaque membre peut recevoir une photo : elle est recadrée, redimensionnée en 384 × 384 px, convertie en WebP puis enregistrée dans `api/uploads/players/`. Les formats JPEG, PNG et WebP sont acceptés, avec une limite de 10 Mo pour le fichier source.

L’identifiant reste `forestois`. Seul un hash BCrypt du mot de passe est conservé dans `public/api/bootstrap.php`. Pour le changer, générer un nouveau hash BCrypt et remplacer la constante `ADMIN_PASSWORD_HASH` ; ne jamais placer le mot de passe en clair dans Angular.

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

Prérequis : PHP 8.0 ou plus récent en ligne de commande, sorties HTTPS autorisées, extension cURL ou `allow_url_fopen`, et droit d’écriture PHP sur le dossier `data/`.

Pour tester une première synchronisation sur le serveur :

```bash
php /htdocs/api/sync-calabssa.php --force
```

Dans le panneau de l’hébergeur, ajouter ensuite cette tâche cron :

```cron
0 20 * * 0 php /htdocs/api/sync-calabssa.php --force >> /htdocs/api/data/calabssa-sync.log 2>&1
```

Cette configuration LWS lance directement la synchronisation chaque dimanche à 20 h. Le site étant publié à la racine du domaine, son chemin est `/htdocs/` et non `/htdocs/coco-loco/`.

## Où poursuivre le développement

- `src/app/domain/` : modèles et contrats des dépôts.
- `src/app/application/` : façade et règles côté application.
- `src/app/infrastructure/` : dépôt navigateur et données initiales.
- `src/app/presentation/` : pages Angular.
- `src/styles.scss` : thème, variables et styles partagés.
- `src/app/brand.config.ts` : couleurs et variantes des blasons.

L’effectif et le registre d’acceptation sont centralisés par les API PHP et des fichiers JSON protégés. Les événements restent pour le moment stockés dans le navigateur.

## Accord du règlement et registre PHP

La section d’accord est pilotée par `src/app/rules-agreement.config.ts` :

- `enabled` affiche ou masque toute la section ;
- `deadline` accepte une date ISO ou `null` tant que l’échéance n’est pas fixée ;
- `regulationVersion` distingue les versions successives du règlement ;
- `apiPath` indique l’adresse relative de l’API.

Le joueur sélectionne son profil et confirme son accord. L’API `public/api/agreements.php` enregistre le nom, l’identifiant, la version du règlement et l’heure fournie par le serveur. Un verrou de fichier protège les écritures simultanées. Le serveur crée le registre `api/data/.acceptances.json` lors du premier accès ; il n’est volontairement pas inclus dans le build afin qu’un déploiement ultérieur n’efface pas les accords. Son accès HTTP direct est bloqué par `.htaccess`.

Prérequis d’hébergement : PHP 8.1 ou plus récent et droit d’écriture PHP sur `api/data/` et `api/uploads/`. Sur un hébergement Apache classique, attribuer au besoin les permissions `775` à ces dossiers depuis le gestionnaire de fichiers. Si le serveur affiche le code source PHP au lieu d’exécuter l’API, ne pas utiliser cette installation avant d’avoir activé PHP.

Pendant `npm start`, Angular ne peut pas exécuter PHP : la page passe volontairement en mode hors ligne et garde les accords dans `localStorage`. Après déploiement sur PHP, les accords locaux sont envoyés au registre central dès que l’API répond.

Le choix d’un nom n’est pas une authentification forte. Pour empêcher l’usurpation, une prochaine étape pourra ajouter un code personnel par joueur ou une connexion sécurisée.

La méthode recommandée ne demande ni terminal ni accès au fichier caché : ouvrir directement `https://votre-domaine.be/#/admin`, se connecter, puis utiliser la section **Accords enregistrés** et son bouton **Supprimer l’accord**.

Le registre se trouve physiquement dans `/htdocs/api/data/.acceptances.json`. Son nom commence par un point, c’est pourquoi le gestionnaire de fichiers LWS peut ne pas l’afficher. La suppression depuis le dashboard verrouille ce fichier et conserve un JSON valide.

Si un accès au Terminal Web devient disponible ultérieurement, la même suppression peut aussi être effectuée avec l’identifiant du joueur. Par exemple, pour Luis Blacio :

```bash
php /htdocs/api/remove-acceptance.php luis-blacio
```

Après suppression, recharger la page du règlement ; le registre serveur est prioritaire et la suppression est répercutée dans le cache du navigateur.

## Déployer sur un autre hébergeur

1. Installer les dépendances avec `npm install`.
2. Construire le site avec `npm run build`.
3. Publier **le contenu du dossier `dist/`** directement dans `/htdocs/`, à la racine du nom de domaine. Ne pas recréer de dossier `coco-loco`.

Le dossier `dist/api/` doit être envoyé avec le reste du build. Lors d’une mise à jour, conserver sur le serveur `api/data/.acceptances.json`, `api/data/.members.json`, `api/data/backups/` et `api/uploads/players/`. Ces éléments ne sont pas générés dans `dist` et ne sont donc pas effacés par un simple transfert qui fusionne les fichiers. Vérifier ensuite que `https://votre-domaine.be/api/agreements.php` et `https://votre-domaine.be/api/members.php` renvoient du JSON, jamais le code source PHP.

Les illustrations et les deux blasons se trouvent dans `public/assets/`. Angular les copie dans `dist/assets/`. Les pages utilisent des chemins relatifs à la base Angular afin qu’ils fonctionnent aussi lorsque l’application est hébergée sous un sous-chemin. Vérifier que le dossier publié contient bien `index.html` et `assets/`.
