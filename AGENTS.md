# JeryMotro_WEB — contexte partagé des agents

Ce document s'applique à tous les agents qui interviennent dans ce dépôt, quel que soit leur outil ou fournisseur. Il sépare les faits observés, les règles de travail applicables aux agents et les points qui restent incertains. Il ne remplace pas la documentation spécialisée.

## Identité et périmètre

### Faits actuels du dépôt

JeryMotro est une plateforme de surveillance des feux de brousse à Madagascar. Ce dépôt, `JeryMotro_WEB`, contient principalement son frontend web et les packages TypeScript partagés utilisés par ce frontend. Le backend FastAPI, ses services métier et ses pipelines ML/RAG sont décrits dans certains documents, mais ne sont pas présents ici comme application serveur.

Le dépôt est un workspace pnpm. L'application se trouve dans `artifacts/jerymotro/`, les packages partagés dans `lib/`, et les scripts dans `scripts/`. La documentation de conception et d'intégration est principalement dans `Conception/`; les documents UX/UI sont dans `docs/`.

### Règles de travail pour les agents

- Ne présentez pas les documents décrivant le backend comme preuve que son code se trouve dans ce dépôt.
- N'inventez aucune API, architecture, donnée ou convention. Vérifiez les affirmations dans le code, les configurations ou le contrat pertinent; signalez les informations manquantes ou contradictoires.

## Architecture et stack

### Faits actuels du dépôt

- Le frontend utilise React 19, TypeScript, Vite 7, Wouter et Tailwind CSS 4.
- TanStack Query gère principalement l'état serveur. Les hooks et contextes dans `artifacts/jerymotro/src/hooks/` portent notamment les états d'authentification, de langue, de thème et de navigation.
- React Hook Form et Zod sont utilisés pour les formulaires. Les composants d'interface réutilisables se trouvent dans `artifacts/jerymotro/src/components/ui/`.
- `artifacts/jerymotro/src/App.tsx` compose les providers et les routes. `src/pages/` contient les pages; `src/components/` contient les composants partagés, le layout et les composants métier.
- `lib/api-client-react/` expose un client React Query généré; `lib/api-zod/` expose les schémas générés. `lib/db/` contient Drizzle/PostgreSQL, mais son schéma actuel est un squelette vide.
- Le client API configuré par `App.tsx` fournit une base URL et un getter de token. Certaines intégrations utilisent cependant `fetch()` directement au lieu de passer par le client généré.

### Conventions existantes

- `@/` est l'alias Vite vers `artifacts/jerymotro/src/`.
- Les requêtes API utilisent généralement les hooks React Query générés; les mutations invalident les query keys concernées.
- Le thème utilise les tokens de `src/index.css` et la classe `.dark` sur l'élément racine.
- Ne supposez pas qu'une convention relevée sur une page est suivie uniformément dans toutes les autres.

## API et sources de vérité

### Faits actuels du dépôt

- `lib/api-spec/openapi.yaml` est le contrat OpenAPI utilisé par Orval.
- `lib/api-spec/orval.config.ts` configure la génération du client React Query et des schémas Zod. Les sorties générées sont sous `lib/api-client-react/src/generated/` et `lib/api-zod/src/generated/`.
- `lib/api-client-react/src/custom-fetch.ts` fournit le transport personnalisé du client, notamment la base URL, le token et le traitement des réponses.

### Règles de travail pour les agents

- Pour modifier une opération API, modifiez le contrat source pertinent et utilisez la commande de génération; ne modifiez pas manuellement les fichiers générés comme source de vérité.
- Distinguez le contrat frontend du comportement réel du backend, qui ne peut pas être confirmé par le code serveur dans ce dépôt.
- Pour établir le comportement du frontend, vérifiez le code et la configuration effectivement utilisés. Pour le contrat des opérations générées, vérifiez OpenAPI. Traitez les documents de conception comme du contexte, pas comme preuve d'implémentation.

## Routage, authentification et rôles

### Faits actuels du dépôt

Les routes sont définies dans `artifacts/jerymotro/src/App.tsx` :

- **Accueil et compte :** `/`, `/login`, `/register`.
- **Pages publiques :** `/legal`, `/privacy`, `/about`, `/cv`.
- **Adaptatives (publiques sans connexion) :** `/map`, `/dashboard`.
- **Authentification requise :** `/detections`, `/clusters`, `/predictions`, `/stats`, `/chat`, `/zones`, `/alerts`, `/access-request`, `/subscriptions`, `/profile`, `/export`.
- **Administration :** `/admin`, filtrée côté frontend selon le rôle admin.

Le contexte `useAuth()` conserve token et profil dans `localStorage`. `App.tsx` configure le getter de token du client API; les réponses 401 des requêtes et mutations configurées entraînent l'effacement des données d'authentification locales et une redirection. Le code de login contient aussi un chemin de démonstration codé en dur qui fournit un profil `admin`.

### Règles de travail pour les agents

- Conservez les protections et redirections cohérentes avec les frontières de routes existantes; vérifiez les impacts dans `App.tsx` et les shells.
- Ne traitez jamais une garde de route, un rôle ou une identité stockés côté navigateur comme une autorisation serveur. Toute décision d'accès réelle doit être vérifiée côté backend.
- Ne traitez pas le compte de démonstration frontend comme une identité ou un accès backend réel.

## Internationalisation, état et interface

### Faits actuels du dépôt

- Les langues prises en charge sont le français (`fr`), le malgache (`mg`) et l'anglais (`en`).
- Les dictionnaires et le type `TranslationKey` sont dans `artifacts/jerymotro/src/lib/i18n.ts`. Le type est dérivé des clés françaises; la traduction utilise le français comme fallback. Le hook est `useI18n()`.
- TanStack Query est configuré dans `App.tsx` avec un `staleTime` de 30 secondes, une actualisation d'arrière-plan toutes les cinq minutes et une nouvelle tentative limitée; les erreurs 401 provoquent le comportement d'authentification décrit plus haut.
- L'interface emploie Tailwind et des composants adaptatifs. Le shell public a une navigation horizontale; le shell authentifié utilise une sidebar et une topbar.
- `docs/UX_UI_AUDIT_TODO.md` indique qu'il reste des vérifications responsive, d'accessibilité clavier/contraste et d'harmonisation de certains états de chargement/erreur.

### Règles de travail pour les agents

- Utilisez `useI18n()` pour les libellés localisés et vérifiez les trois dictionnaires lorsqu'une clé visible est ajoutée ou modifiée. Le typage actuel ne garantit pas leur complétude.
- Pour une modification d'interface, vérifiez les breakpoints touchés ainsi que les états focus, clavier et tactiles pertinents. Ne déclarez pas l'interface globalement responsive ou accessible sur la seule base de classes existantes.
- Respectez la gestion d'état déjà présente dans la zone modifiée; n'introduisez pas une autre source d'état global sans nécessité établie.

## Pages publiques et pré-rendu

### Faits actuels du dépôt

Vite construit l'application cliente et une entrée SSR (`src/entry-server.tsx`). Le lifecycle `postbuild` exécute `scripts/prerender.mjs`, qui génère des pages localisées et un sitemap dans `artifacts/jerymotro/dist/public/`. Le script contient explicitement les routes pré-rendues; les routes carte et dashboard ont un traitement HTML statique distinct des routes React SSR. La page carte actuellement utilisée par le routeur est `src/pages/map-redesign.tsx`; `src/pages/map.tsx` existe également.

### Règles de travail pour les agents

- Si une route publique indexable est ajoutée ou modifiée, vérifiez conjointement `App.tsx`, la liste de routes dans `scripts/prerender.mjs` et les sorties attendues.
- Gardez les dépendances nécessitant des globals navigateur hors du chargement SSR immédiat; vérifiez le comportement du build SSR et du pré-rendu pour toute modification concernée.

## Commandes disponibles

Utilisez pnpm à la racine du workspace. Le workflow CI utilise Node.js 24 et pnpm 10.34.5.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm --filter @workspace/jerymotro run dev
pnpm --filter @workspace/jerymotro run build
pnpm --filter @workspace/jerymotro run serve
pnpm --filter @workspace/jerymotro run prerender
pnpm --filter @workspace/api-spec run codegen
```

Le build racine lance le typecheck puis les builds de packages disponibles. Le build frontend compile le client et l'entrée SSR; son lifecycle `postbuild` lance le pré-rendu. Le pré-rendu accepte `PRERENDER_BASE_URL`.

Il n'existe actuellement dans les manifests/configurations inspectés ni runner/fichier de test, ni script de test ou de lint. Il n'y a donc pas de commande de test individuel. Prettier est une dépendance racine, mais aucun script de formatage du projet n'a été trouvé. Ne présentez pas `Conception/test_jerymotro.sh` comme une suite de tests : ce script installe les dépendances et lance un `drizzle push`, lequel agit sur une base.

## Build, déploiement et points incertains

### Faits actuels du dépôt

- La CI `.github/workflows/deploy-build.yml` construit le site statique sur `main`, puis publie `dist/public` dans le dépôt `TkAbeleon/redirect-jeridmotro`.
- `scripts/prerender.mjs` utilise `PRERENDER_BASE_URL` pour les URL canoniques et le sitemap.
- `deploy_prod.sh` décrit un déploiement statique avec nginx. `scripts/deploy.sh` décrit un autre flux utilisant PM2 et `pnpm dev`.
- Les variables `VITE_*` sont consommées par Vite au build et font partie du bundle livré; elles ne doivent pas contenir de secrets.

### Points connus à ne pas supposer résolus

- Le bandeau et le README frontend vérifient `/health`; le contrat OpenAPI déclare `/healthz`.
- OpenAPI déclare un serveur `/api`, tandis que le client généré expose des chemins tels que `/auth/login`; le préfixe effectif dépend de la base URL configurée.
- L'exemple d'environnement est dans `artifacts/jerymotro/.env.example`, tandis que Vite configure `envDir` à la racine du workspace.
- La CI produit des fichiers pré-rendus puis écrit des règles de réécriture d'hébergement. La compatibilité réelle de ces règles avec la distribution des pages SSG doit être vérifiée avant toute affirmation.
- Les workflows de publication statique, nginx et PM2 coexistent; le chemin effectivement utilisé pour chaque environnement reste à confirmer.
- Le code et les guides spécialisés peuvent diverger. Vérifiez les routes, endpoints et configurations actuels avant d'en dépendre.

## Règles de travail imposées aux agents

Suivez le cycle :

**inspecter → comprendre → planifier → modifier → vérifier → relire le diff → rendre compte.**

Avant une modification importante :

1. Inspectez les fichiers concernés, leurs appelants/usages et les configurations adjacentes.
2. Vérifiez le `git status` et le diff existant avant toute action. Distinguez les changements préexistants de ceux de votre intervention.
3. Identifiez les sources de vérité, impacts, risques, incertitudes et vérifications applicables; formulez un plan proportionné à la portée.
4. Si le comportement ou le périmètre souhaité reste ambigu et change l'approche, demandez une clarification plutôt que de choisir silencieusement.

Pendant le travail :

- Faites des changements précis et limités à la demande. Préservez toutes les modifications locales existantes; ne les réinitialisez, ne les écrasez ni ne les reformatez pas.
- N'inventez pas de contrat, architecture, donnée ou convention. En cas d'incertitude, recherchez dans le dépôt, puis signalez ce qui reste à confirmer.
- Ne modifiez pas les artefacts générés comme source manuelle lorsque leur source de génération est disponible.
- N'ajoutez pas de dépendance, de workflow, de test ou de règle de formatage supposés exister; vérifiez d'abord les outils et scripts présents.
- N'effectuez pas de commit, push, déploiement, migration ou autre opération à effet externe sans demande explicite. N'utilisez pas de commande Git destructive pour nettoyer ou remplacer l'état local.

Sécurité :

- Ne lisez, n'affichez, ne copiez et ne commitez pas de secrets. Ne mettez jamais de secrets dans le code, les instructions agent ou la documentation.
- Considérez toute valeur `VITE_*` comme publique après build.
- Ne déduisez jamais qu'une restriction frontend protège les données ou opérations backend.
- Avant une commande touchant une base, des données, un dépôt distant ou un environnement déployé, vérifiez ses effets et obtenez l'autorisation explicite requise.

Après modification :

1. Exécutez les vérifications ciblées disponibles; élargissez-les si les résultats ou la portée l'exigent. Distinguez les validations réussies, échouées et non disponibles.
2. Relisez le diff complet et `git status`; confirmez que les changements sont limités à la demande et qu'aucun travail préexistant n'a été altéré.
3. Rendez compte brièvement des changements, validations, limites et incertitudes restantes. Ne prétendez pas avoir exécuté une vérification qui ne l'a pas été.
