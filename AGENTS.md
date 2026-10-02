# Conventions du projet Forestois SC

- Chaque composant ou page Angular doit posséder trois fichiers séparés : `.ts`, `.html` et `.scss`.
- Ne pas utiliser de template HTML inline ni de tableau `styles` inline dans `@Component`.
- Référencer systématiquement `templateUrl` et `styleUrl`, même lorsque le fichier SCSS est encore minimal.
- Un fichier TypeScript de composant ne doit déclarer qu’un seul composant. Un fichier d’exports séparé peut servir de barrel pour préserver les imports existants.
- Les variables de thème et les fondations réellement globales restent dans `src/styles.scss`; les nouveaux styles propres à une page ou à un composant vont dans son fichier SCSS dédié.
