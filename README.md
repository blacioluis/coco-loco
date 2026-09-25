# Forestois SC 1 · site du club

Site Angular 22 pour Forestois SC 1 (ABSSA, division 4C). Le projet utilise des composants standalone, Signals et une séparation Domain / Application / Infrastructure / Presentation.

L’interface est disponible en français et en espagnol sur les mêmes routes. Le bouton `FR` / `ES` change la langue immédiatement et mémorise le choix dans le navigateur.

## Administration locale

La route directe `/#/admin` ouvre un tableau de bord simplifié inspiré des fonctions essentielles de SportEasy : gestion de l’effectif et création d’événements du club. Les événements sont stockés dans le navigateur.

- Identifiant : `forestois`
- Mot de passe : `CocoLoco2026!`

Ces identifiants sont volontairement codés dans le frontend pour cette maquette. Ils ne constituent pas une sécurité réelle : une mise en production avec données privées nécessitera un backend, une authentification côté serveur et une base de données partagée.

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
- `npm run import:calendar` récupère le bloc structuré `icalEvents` publié dans la page rendue par CalABSSA, le valide (26 rencontres minimum), puis régénère le fichier de secours. Cet import se fait à la maintenance/déploiement, jamais par scraping dans le navigateur des visiteurs.
- Le fichier généré reste versionné : si CalABSSA est indisponible, le calendrier du site continue donc à fonctionner. La page affiche la date de la dernière mise à jour réussie.
- Les horodatages UTC de CalABSSA sont convertis en heure locale `Europe/Brussels` (heure d’été/hiver comprise). Vérifier le diff généré avant publication.

## Où poursuivre le développement

- `src/app/domain/` : modèles et contrats des dépôts.
- `src/app/application/` : façade et règles côté application.
- `src/app/infrastructure/` : dépôt navigateur et données initiales.
- `src/app/presentation/` : pages Angular.
- `src/styles.scss` : thème, variables et styles partagés.
- `src/app/brand.config.ts` : couleurs et variantes des blasons.

Le projet n’a pas de backend : l’effectif administré est stocké dans le navigateur. L’authentification, la base de données partagée et la synchronisation automatique du calendrier restent à implémenter.

## Déployer sur un autre hébergeur

1. Installer les dépendances avec `npm install`.
2. Construire le site avec `npm run build`.
3. Publier **le contenu du dossier `dist/`** comme site statique, pas la racine du projet.

Les illustrations et les deux blasons se trouvent dans `public/assets/`. Angular les copie dans `dist/assets/`. Les pages utilisent des chemins relatifs à la base Angular afin qu’ils fonctionnent aussi lorsque l’application est hébergée sous un sous-chemin. Vérifier que le dossier publié contient bien `index.html` et `assets/`.
