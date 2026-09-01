# JeryMotro Web — Audit UX/UI & TODO

> Audit visuel du frontend réalisé le 1er septembre 2026.
>
> **Périmètre :** observation et améliorations ciblées.
> **Important :** pas de refonte globale, pas de changement d’architecture, pas de remplacement du système de composants.

## Constat général

L'application possède une bonne base visuelle : typographie identifiable, palette cohérente autour de l'orange/vert, composants réutilisables et navigation structurée. Le principal problème est l'hétérogénéité entre les pages : certaines sont très légères (notamment le Chat), alors que d'autres restent très « dashboard/card ».

Le risque principal n'est donc pas le manque de design, mais l'accumulation de petites conventions différentes selon les écrans.

## Priorités

### P0 — Cohérence de navigation

- [x] Alléger visuellement la Sidebar.
- [x] Réduire la quantité de séparation visuelle dans la navigation.
- [x] Rendre les actions de la Topbar plus discrètes.
- [ ] Vérifier que la recherche de Topbar possède un comportement clairement identifiable.
- [ ] Réduire les informations institutionnelles dans la navigation principale.

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
- [ ] Remplacer les dernières utilities legacy directement utilisées dans les composants par les tokens sémantiques.

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

> **Passe core réalisée — 1er septembre 2026 :** composant partagé `AsyncState` introduit et appliqué au chargement global ainsi qu'aux pages Dashboard, Détections, Stats, Clusters et Predictions. Les états `loading`, `empty` et `error` partagent désormais la même hiérarchie visuelle et les erreurs exposent une récupération. Le chargement global utilise également l'identité JeryMotro (logo + accents de marque).

### P3 — Responsive / finition

- [ ] Vérifier chaque page en desktop large, laptop et mobile.
- [x] Corriger les principaux risques responsive de Profile et Export.
- [ ] Contrôler les panneaux latéraux, tableaux et graphiques en faible largeur sur les pages restantes.
- [ ] Ajouter seulement des micro-interactions utiles : hover, focus, transitions courtes.

### P4 — Pages publiques

- [x] Conserver les routes publiques sans connexion : Landing, About, CV, Legal, Privacy.
- [x] Conserver Map et Dashboard accessibles publiquement selon le routage existant.
- [x] Conserver Login/Register comme portes d'entrée vers les fonctionnalités authentifiées.
- [x] Harmoniser les couleurs publiques avec les tokens globaux sans imposer l'AppShell privé.
- [ ] Dernière vérification UX mobile des pages publiques.

## Règles visuelles proposées

### Hiérarchie

```text
Contenu principal
    ↓
Titres / métriques importantes
    ↓
Actions
    ↓
Métadonnées
```

### Surfaces

Favoriser :

```text
background
surface légère
surface interactive
```

Éviter d'empiler plusieurs cartes et bordures lorsqu'une simple séparation ou un espacement suffit.

### Couleur

```text
orange = action / marque
rouge = critique / erreur
ambre = attention
vert = état sain / faible risque
neutre = information
```

### Principe directeur

> **Le contenu doit être plus visible que l'interface qui l'entoure.**

Le Chat sert actuellement de référence pour cette direction : contenu centré, actions discrètes, compositeur compact, métadonnées secondaires.

## Hors périmètre pour cette itération

- Pas de réécriture complète du design system.
- Pas de modification de l'API ou des modèles de données.
- Pas de nouvelle librairie UI.
- Pas de refonte fonctionnelle des pages.
- Pas de modification du comportement métier.

## Progression

- [x] Chat — interface épurée et rendu Mermaid stabilisé.
- [x] Navigation — Sidebar/Topbar allégées.
- [x] Détections — filtres et panneau détail allégés.
- [x] Dashboard — KPI et surfaces simplifiés.
- [x] Stats — graphiques, KPI et surfaces simplifiés.
- [x] Map — contrôles secondaires allégés et regroupés visuellement.
- [ ] États loading/empty/error — core harmonisé, pages restantes à vérifier.
- [ ] Audit responsive final de toutes les pages.
- [x] Passe tokens/couleurs — base sémantique et compatibilité des pages publiques.
- [ ] Passe finale typographie / spacing / rayons.

## Ordre recommandé pour la suite

1. Finaliser l'harmonisation des états loading/empty/error sur les pages restantes.
2. Terminer l'audit responsive écran par écran, y compris toutes les pages publiques.
3. Remplacer les dernières utilities de couleur legacy par les tokens.
4. Dernier passage typographie / spacing / rayons.
5. Vérification finale des micro-interactions et de l'accessibilité tactile.
