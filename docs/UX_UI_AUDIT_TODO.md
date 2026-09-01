# JeryMotro Web — Audit UX/UI & TODO

> Audit visuel du frontend réalisé le 1er septembre 2026.
>
> **Périmètre :** observation et améliorations ciblées.
> **Important :** pas de refonte globale, pas de changement d’architecture, pas de remplacement du système de composants.

## Constat général

L'application possède une bonne base visuelle : typographie identifiable, palette cohérente autour de l'orange/vert, composants réutilisables et navigation structurée. Le principal problème était l'hétérogénéité entre les pages et certains contrôles natifs qui ne suivaient pas correctement le thème sombre.

## Priorités

### P0 — Cohérence de navigation

- [x] Alléger visuellement la Sidebar.
- [x] Réduire la quantité de séparation visuelle dans la navigation.
- [x] Rendre les actions de la Topbar plus discrètes.
- [ ] Vérifier que la recherche de Topbar possède un comportement clairement identifiable.
- [x] Réduire les informations institutionnelles dans la navigation principale.
- [x] Séparer clairement les shells public et authentifié : public = header horizontal ; authentifié = Sidebar + Topbar.
- [x] Garder langue/thème dans le header public et dans la Topbar authentifiée, jamais dans la Sidebar.

### P1 — Pages métier

- [x] Réduire l'effet « boîte dans boîte » du Dashboard.
- [x] Alléger les KPI : moins d'icônes, moins de bordures, meilleure hiérarchie des chiffres.
- [x] Détections : transformer le panneau de détail en drawer/panneau latéral léger, notamment sur mobile.
- [x] Détections : rendre la toolbar de filtres moins lourde visuellement.
- [x] Stats : réduire la dominance des bordures et de la grille des graphiques.
- [x] Map : alléger les contrôles Leaflet et garder les contrôles avancés dans l'overlay existant.

### P1 — Couleurs

- [x] Introduire et utiliser les tokens sémantiques `primary`, `accent`, `warning` et `destructive`.
- [x] Stabiliser les quatre états métier : `critical`, `high`, `medium`, `low` au niveau de la palette partagée.
- [x] Réserver les couleurs fortes aux états importants plutôt qu'aux informations décoratives.
- [x] Préserver la palette des pages publiques : les anciennes utilities jaune/bleu sont maintenant mappées vers les tokens partagés.
- [x] Remplacer les principales utilities legacy de couleur détectées dans Dashboard et les vues analytiques par les tokens sémantiques.
- [x] Rendre les contrôles natifs (`select` / `option`) compatibles avec les thèmes clair et sombre via `color-scheme` et les tokens `popover`.
- [x] Harmoniser les tooltips/grilles des graphiques authentifiés avec les tokens du thème.

### P2 — Typographie et spacing

- [ ] Uniformiser les niveaux de titre entre les pages.
- [ ] Converger vers un petit nombre de spacings récurrents.
- [ ] Éviter les variations excessives de `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
- [ ] Uniformiser les headers de page : titre + description + actions.

### P2 — États d'interface

- [ ] Uniformiser les `loading states`.
- [ ] Uniformiser les `empty states`.
- [ ] Uniformiser les messages d'erreur et les actions de récupération.
- [x] Garder les métadonnées secondaires discrètes.

> **Passe core réalisée — 1er septembre 2026 :** composant partagé `AsyncState` introduit et appliqué au chargement global ainsi qu'aux pages Dashboard, Détections, Stats, Clusters et Predictions. Le chargement global utilise également l'identité JeryMotro (logo + accents de marque). Alerts et Zones gardent encore des loaders locaux à harmoniser lors de la prochaine passe de finition.

### P3 — Responsive / finition

- [ ] Vérifier chaque page en desktop large, laptop et mobile via navigateur réel.
- [x] Corriger les principaux risques responsive de Profile et Export.
- [x] Contrôler les tableaux et panneaux des pages Détections, Profile et Export en faible largeur.
- [x] Ajouter des zones tactiles minimales et des focus visibles sur la navigation et les contrôles publics.
- [ ] Contrôler les panneaux latéraux, graphiques et modales des pages restantes en faible largeur.
- [ ] Ajouter seulement des micro-interactions utiles : hover, focus, transitions courtes.
- [ ] Vérifier le contraste et la navigation clavier sur toutes les pages.

### P4 — Pages publiques

- [x] Conserver les routes publiques sans connexion : Landing, About, CV, Legal, Privacy.
- [x] Conserver Map et Dashboard accessibles publiquement selon le routage existant.
- [x] Conserver Login/Register comme portes d'entrée vers les fonctionnalités authentifiées.
- [x] Harmoniser les couleurs publiques avec les tokens globaux sans imposer l'AppShell privé.
- [x] Aligner le sélecteur langue/thème du header public avec la Topbar authentifiée.
- [ ] Dernière vérification UX mobile des pages publiques.

## Progression

- [x] Chat — interface épurée et rendu Mermaid stabilisé.
- [x] Navigation — Sidebar/Topbar allégées.
- [x] Détections — filtres et panneau détail allégés.
- [x] Dashboard — KPI et surfaces simplifiés.
- [x] Stats — graphiques, KPI et surfaces simplifiés.
- [x] Map — contrôles secondaires allégés et regroupés visuellement.
- [ ] États loading/empty/error — core harmonisé, Alerts et Zones restent à uniformiser.
- [ ] Audit responsive final de toutes les pages.
- [x] Passe tokens/couleurs — base sémantique, contrôles natifs et pages publiques compatibles thème.
- [x] Audit shell public/authentifié — séparation et contrôles langue/thème cohérents.
- [ ] Passe finale typographie / spacing / rayons.

## Ordre recommandé pour la suite

1. Uniformiser Alerts/Zones avec `AsyncState`.
2. Contrôle navigateur réel des breakpoints mobile/tablette/desktop, y compris pages publiques.
3. Remplacer les dernières couleurs legacy détectées.
4. Dernier passage typographie / spacing / rayons.
5. Vérification finale des micro-interactions et de l'accessibilité clavier/tactile.
6. Vérification finale du build et des routes public/authentifié.
