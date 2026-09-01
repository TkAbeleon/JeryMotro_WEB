# JeryMotro Web — Audit UX/UI & TODO

> Audit visuel du frontend réalisé le 1er septembre 2026.
>
> **Périmètre :** observation et améliorations ciblées.
> **Important :** pas de refonte globale, pas de changement d'architecture, pas de remplacement du système de composants.

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
- [ ] Stats : réduire la dominance des bordures et de la grille des graphiques.
- [ ] Map : conserver les contrôles avancés dans un panneau/drawer plutôt que les afficher simultanément.

### P1 — Couleurs

- [ ] Remplacer progressivement les couleurs hexadécimales écrites directement dans les pages par des tokens sémantiques.
- [ ] Stabiliser les quatre états métier : `critical`, `high`, `medium`, `low`.
- [ ] Réserver les couleurs fortes aux états importants plutôt qu'aux informations décoratives.

### P2 — Typographie et spacing

- [ ] Uniformiser les niveaux de titre entre les pages.
- [ ] Converger vers un petit nombre de spacings récurrents.
- [ ] Éviter les variations excessives de `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
- [ ] Uniformiser les headers de page : titre + description + actions.

### P2 — États d'interface

- [ ] Uniformiser les `loading states`.
- [ ] Uniformiser les `empty states`.
- [ ] Uniformiser les messages d'erreur et les actions de récupération.
- [ ] Garder les métadonnées secondaires discrètes.

### P3 — Responsive / finition

- [ ] Vérifier chaque page en desktop large, laptop et mobile.
- [ ] Contrôler les panneaux latéraux, tableaux et graphiques en faible largeur.
- [ ] Ajouter seulement des micro-interactions utiles : hover, focus, transitions courtes.

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
- [ ] Stats — graphiques plus sobres.
- [ ] Map — contrôles secondaires regroupés.
- [ ] États loading/empty/error — harmonisation finale.
- [ ] Audit responsive final de toutes les pages.

## Ordre recommandé pour la suite

1. Stats — graphiques plus sobres.
2. Map — contrôles secondaires regroupés.
3. Harmonisation finale des états loading/empty/error.
4. Audit responsive final.
5. Nettoyage progressif des couleurs et tokens, sans refonte globale.
