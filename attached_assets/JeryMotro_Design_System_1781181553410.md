# JeryMotro — Design System & Documentation UI/UX
**Plateforme de Surveillance des Feux · Madagascar**

> Version 1.0 · Juin 2026 · Projet L3  
> Référence de conception pour développeurs, intégrateurs et équipe produit

---

## Table des matières

1. [Vision & Principes de Design](#1-vision--principes-de-design)
2. [Fondations Visuelles](#2-fondations-visuelles)
   - 2.1 [Palette de couleurs — Mode Sombre (défaut)](#21-palette-de-couleurs--mode-sombre-défaut)
   - 2.2 [Palette de couleurs — Mode Clair](#22-palette-de-couleurs--mode-clair)
   - 2.3 [Typographie](#23-typographie)
   - 2.4 [Espacements & Rayons](#24-espacements--rayons)
   - 2.5 [Ombres & Effets lumineux](#25-ombres--effets-lumineux)
3. [Système de Grille & Mise en Page](#3-système-de-grille--mise-en-page)
4. [Composants de Base](#4-composants-de-base)
   - 4.1 [Boutons](#41-boutons)
   - 4.2 [Badges & Étiquettes de statut](#42-badges--étiquettes-de-statut)
   - 4.3 [Cartes](#43-cartes)
   - 4.4 [Formulaires](#44-formulaires)
   - 4.5 [Tableaux](#45-tableaux)
   - 4.6 [Barres de progression](#46-barres-de-progression)
   - 4.7 [Toggles](#47-toggles)
   - 4.8 [Indicateurs de statut live](#48-indicateurs-de-statut-live)
5. [Composants Métier](#5-composants-métier)
   - 5.1 [Carte de détection (table row)](#51-carte-de-détection-table-row)
   - 5.2 [Carte de cluster FireEvent](#52-carte-de-cluster-fireevent)
   - 5.3 [Carte de zone prioritaire](#53-carte-de-zone-prioritaire)
   - 5.4 [Item d'alerte](#54-item-dalerte)
   - 5.5 [Carte d'abonnement](#55-carte-dabonnement)
   - 5.6 [Carte statistique (stat-card)](#56-carte-statistique-stat-card)
   - 5.7 [Source chip (chat IA)](#57-source-chip-chat-ia)
   - 5.8 [Bulles de message (chat)](#58-bulles-de-message-chat)
6. [Modales](#6-modales)
7. [Navigation](#7-navigation)
   - 7.1 [Navbar Landing (publique)](#71-navbar-landing-publique)
   - 7.2 [Sidebar Dashboard (authentifié)](#72-sidebar-dashboard-authentifié)
   - 7.3 [Topbar Dashboard](#73-topbar-dashboard)
8. [Pages & Écrans](#8-pages--écrans)
   - 8.1 [Landing Page](#81-landing-page)
   - 8.2 [Page de Connexion](#82-page-de-connexion)
   - 8.3 [Page d'Inscription](#83-page-dinscription)
   - 8.4 [Dashboard — Vue d'ensemble](#84-dashboard--vue-densemble)
   - 8.5 [Tab Détections Live](#85-tab-détections-live)
   - 8.6 [Tab Clusters FireEvents](#86-tab-clusters-fireevents)
   - 8.7 [Tab Prédictions J+1](#87-tab-prédictions-j1)
   - 8.8 [Tab Statistiques](#88-tab-statistiques)
   - 8.9 [Tab JeryMotro AI (Chat RAG)](#89-tab-jerymotro-ai-chat-rag)
   - 8.10 [Tab Zones Prioritaires (Premium)](#810-tab-zones-prioritaires-premium)
   - 8.11 [Tab Historique Alertes](#811-tab-historique-alertes)
   - 8.12 [Tab Abonnements](#812-tab-abonnements)
   - 8.13 [Tab Profil](#813-tab-profil)
9. [Composant Carte (Leaflet)](#9-composant-carte-leaflet)
10. [Système de Rôles & Accès](#10-système-de-rôles--accès)
11. [Mode Clair — Adaptations](#11-mode-clair--adaptations)
12. [Responsive & Mobile](#12-responsive--mobile)
13. [Animations & Micro-interactions](#13-animations--micro-interactions)
14. [Accessibilité](#14-accessibilité)
15. [Iconographie](#15-iconographie)
16. [Variables CSS complètes](#16-variables-css-complètes)

---

## 1. Vision & Principes de Design

JeryMotro est une plateforme critique de surveillance environnementale. Son design reflète trois valeurs fondamentales :

**Clarté opérationnelle** — L'utilisateur doit comprendre l'état du risque en moins de 3 secondes. Chaque donnée est hiérarchisée visuellement par sa criticité. Les scores de risque dominent l'affichage, colorés selon un gradient universellement compris (vert → amber → orange → rouge).

**Densité d'information maîtrisée** — Le dashboard agrège des données complexes (coordonnées GPS, FRP en MW, scores ML, statuts de feux) sans jamais surcharger l'écran. On atteint cela par un dark mode profond, des bordures très subtiles et une typographie à fort contraste hiérarchique.

**Confiance & Sérieux** — Les couleurs sombres évoquent la nuit, la surveillance continue, la technicité. L'accent `--fire` (orange vif) n'est pas décoratif — il signale un danger réel. Chaque élément interactif a un feedback visuel immédiat.

### Les 5 règles du design JeryMotro

1. **L'orange signifie le feu, pas la marque.** `--fire` et `--fire-light` ne sont jamais utilisés comme simple accent décoratif. Ils indiquent une donnée de surveillance active ou une action primaire critique.
2. **Toujours montrer le statut en temps réel.** Le `live-chip` vert est présent sur chaque vue contenant des données dynamiques.
3. **Les données géospatiales ont la priorité.** La carte occupe le maximum de surface disponible sur les vues détections et prédictions.
4. **Les rôles Visiteur / Standard / Premium ont des frontières visuelles claires.** Les éléments Premium sont marqués de badges spécifiques, jamais cachés.
5. **Les scores ML s'affichent toujours avec leur barre de progression.** Un chiffre seul (0.91) n'a pas de sens sans contexte visuel immédiat.

---

## 2. Fondations Visuelles

### 2.1 Palette de couleurs — Mode Sombre (défaut)

Le mode sombre est le mode principal de JeryMotro. Il est conçu pour une utilisation prolongée en environnement de veille (nuit, salle de crise).

#### Couleurs de fond (du plus sombre au plus clair)

| Token CSS | Valeur HEX | Usage |
|-----------|-----------|-------|
| `--bg` | `#080c0a` | Fond de page, background global |
| `--bg2` | `#0d1210` | Zones secondaires de fond |
| `--surface` | `#101814` | Surfaces principales : sidebar, topbar, navbar scrollée |
| `--surface2` | `#161f1b` | Inputs, filtres, fond des sections intérieures |
| `--surface3` | `#1c2822` | États hover/focus, surfaces tertiaires |
| `--card` | `#141e19` | Fond des cards (légèrement plus clair que `--surface`) |

> **Règle de profondeur** : Plus un élément est "au-dessus" visuellement (tooltip, modal), plus sa couleur de fond doit être plus claire dans cette gamme. On n'inverse jamais cette logique.

#### Couleurs de bordure

| Token CSS | Valeur HEX | Usage |
|-----------|-----------|-------|
| `--border` | `#1a2820` | Bordures de repos (cards, dividers) |
| `--border2` | `#213029` | Bordures d'éléments interactifs (inputs, boutons ghost) |
| `--border3` | `#2a3d35` | Bordures hover ou focus non-fire |

#### Couleurs de texte

| Token CSS | Valeur HEX | Usage |
|-----------|-----------|-------|
| `--white` | `#edf5f1` | Titres principaux, valeurs critiques, labels actifs |
| `--text` | `#b8cec6` | Corps de texte principal |
| `--text2` | `#8aa89e` | Texte secondaire, sous-titres, métadonnées |
| `--muted` | `#566d65` | Texte désactivé, placeholders, labels uppercase |

> **Ratio de contraste** : `--white` sur `--bg` = 14.8:1 (WCAG AAA). `--text` sur `--card` = 7.2:1 (WCAG AA).

#### Couleurs d'accent — Système de risque

| Token CSS | Valeur HEX | Signification opérationnelle |
|-----------|-----------|----------------------------|
| `--fire` | `#e8531a` | Action primaire, risque CRITIQUE, clusters actifs |
| `--fire-light` | `#ff6b35` | Hover/accent fire, badges Premium, valeurs de risque élevé |
| `--fire-dim` | `#9c360e` | Variante sombre du fire (non utilisée en surface) |
| `--amber` | `#f59e0b` | Risque MEDIUM, statut COOLING, avertissement modéré |
| `--red` | `#ef4444` | Risque CRITICAL, erreurs système, danger (delete) |
| `--green` | `#22c55e` | Risque LOW, statut LIKELY_OUT, succès, API online |
| `--green-dim` | `#16a34a` | Hover du green |
| `--blue` | `#3b82f6` | Informations neutres, métriques IA (temps de réponse) |

> **Échelle de risque complète** :  
> `#22c55e` (0–0.3) → `#f59e0b` (0.3–0.5) → `#f97316` (0.5–0.7) → `#ef4444` (0.7–1.0)  
> Note : `#f97316` (orange intermédiaire) n'a pas de token dédié — il est utilisé en valeur directe pour les niveaux HIGH (0.5–0.7).

#### Couleurs de halos (glows)

| Token CSS | Valeur | Usage |
|-----------|--------|-------|
| `--fire-glow` | `rgba(232,83,26,.18)` | Halos intenses autour des éléments fire |
| `--fire-glow2` | `rgba(232,83,26,.08)` | Halos subtils, fond de sections fire |
| `--green-glow` | `rgba(34,197,94,.12)` | Halo vert pour indicateurs live/succès |
| `--glow-fire` | `0 0 40px rgba(232,83,26,.15)` | Box-shadow pour cards critiques |

---

### 2.2 Palette de couleurs — Mode Clair

Le mode clair doit conserver la même hiérarchie sémantique en remplaçant les surfaces sombres par des surfaces lumineuses. Les couleurs d'accent restent identiques (le feu reste orange, le risque critique reste rouge).

| Token (dark) | Valeur Mode Clair | Raisonnement |
|---|---|---|
| `--bg` | `#f5f7f5` | Fond très légèrement teinté vert-gris (évoque la forêt) |
| `--bg2` | `#eef1ee` | Fond secondaire |
| `--surface` | `#ffffff` | Surfaces principales blanches |
| `--surface2` | `#f0f4f2` | Inputs, filtres |
| `--surface3` | `#e5ebe8` | États hover |
| `--card` | `#ffffff` | Cards blanches avec bordure visible |
| `--border` | `#d0dbd6` | Bordures légères sur fond clair |
| `--border2` | `#b8ccc6` | Bordures interactives |
| `--border3` | `#9ab5ac` | Bordures focus/hover |
| `--white` | `#0d1a16` | Titres principaux (noir profond teinté vert) |
| `--text` | `#2a3d36` | Corps de texte |
| `--text2` | `#4a6b61` | Texte secondaire |
| `--muted` | `#7a9e94` | Texte discret |
| `--fire` | `#e8531a` | **Inchangé** |
| `--fire-light` | `#d94a14` | Légèrement assombri pour contraste sur fond clair |
| `--green` | `#16a34a` | Légèrement assombri pour lisibilité |
| `--amber` | `#d97706` | Légèrement assombri |
| `--red` | `#dc2626` | Légèrement assombri |
| `--blue` | `#2563eb` | Légèrement assombri |
| `--shadow` | `0 4px 24px rgba(0,0,0,.08)` | Ombres légères |

> **Implémentation du mode clair** : Utiliser `[data-theme="light"]` sur l'élément `<html>` pour surcharger les variables CSS. Le basculement est géré par un toggle dans la navbar et persiste via `localStorage`.

---

### 2.3 Typographie

JeryMotro utilise deux familles complémentaires importées depuis Google Fonts.

#### Outfit — Titres et chiffres

**Usage :** Tous les titres (`h1`→`h5`), nombres statistiques, logo, prix, valeurs de score ML.  
**Weights disponibles :** 300 · 400 · 500 · 600 · 700 · 800 · 900  
**Caractère :** Géométrique, moderne, très lisible en grande taille. Les weights 800–900 donnent un impact visuel fort aux données critiques.

```css
font-family: 'Outfit', sans-serif;
```

#### Space Grotesk — Corps de texte

**Usage :** Tout le texte de corps, boutons, inputs, labels, tableaux, navigation.  
**Weights disponibles :** 300 · 400 · 500 · 600 · 700  
**Caractère :** Grotesque humaniste avec des détails techniques (chiffres tabulaires). Excellente lisibilité en petite taille. Ton légèrement technique, cohérent avec la nature data-driven du produit.

```css
font-family: 'Space Grotesk', sans-serif;
```

#### Échelle typographique

| Classe | Font | Size | Weight | Letter-spacing | Line-height | Usage |
|--------|------|------|--------|----------------|-------------|-------|
| `.display` | Outfit | `clamp(40px, 5.5vw, 72px)` | 900 | `-2px` | 1.05 | Hero titre landing |
| `.h1` | Outfit | `clamp(28px, 4vw, 48px)` | 800 | `-1px` | 1.1 | Titres de sections landing |
| `.h2` | Outfit | `clamp(22px, 3vw, 36px)` | 700 | `-.5px` | 1.2 | Titres de pages/modales |
| `.h3` | Outfit | `18px` | 700 | — | — | Titres de cards, widgets |
| `.stat-num` | Outfit | `28px` | 800 | — | 1 | Chiffres stat-cards |
| `.price-num` | Outfit | `44px` | 900 | — | 1 | Prix tarification |
| Body | Space Grotesk | `16px` (base) | 400 | — | — | Corps global |
| `.nav-link` | Space Grotesk | `14px` | 500 | — | — | Navigation |
| `.form-label` | Space Grotesk | `11px` | 600 | `0.8px` | — | Labels formulaire |
| `.label` | Space Grotesk | `11px` | 600 | `1.5px` | — | Labels uppercase décoratifs |
| `.sidebar-section` | Space Grotesk | `10px` | 700 | `1.8px` | — | Sections sidebar |
| `.table th` | Space Grotesk | `10px` | 700 | `1.2px` | — | En-têtes de tableaux |
| Monospace | monospace (system) | `11–12px` | — | — | — | Coordonnées GPS, endpoints API |

> **Règle :** Les labels uppercase (`text-transform: uppercase`) sont toujours en couleur `--muted`. Un texte uppercase coloré dans `--white` ou `--fire` trahit une importance excessive.

---

### 2.4 Espacements & Rayons

#### Système de rayons (border-radius)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | `8px` | Boutons, inputs, badges larges, code blocks |
| `--radius` | `12px` | Cards, filtres, stat-cards, map-wrap, modales secondaires |
| `--radius-lg` | `18px` | Modales principales, pricing-cards |
| Circulaire | `50%` | Avatars, points live, toggles (plaque) |
| `20px` | valeur directe | Badges pill, live-chip, sidebar-pill |

#### Espacements principaux

| Élément | Valeur | Token ou règle |
|---------|--------|----------------|
| Container max-width | `1180px` | `.container` |
| Padding container | `0 28px` | `.container` |
| Section padding | `96px 0` | `.section` |
| Card padding (standard) | `24px` | `.card-p` |
| Card padding (small) | `16px` | `.card-sm` |
| App body padding | `24px` | `.app-body` |
| Sidebar width | `228px` | `.sidebar` |
| Topbar height | `58px` | `.topbar` |
| Navbar height | `68px` | `.nav-inner` |
| Gap grille dashboard | `14–20px` | contextuel |
| Gap formulaires | `14–16px` | `.form-group` |

---

### 2.5 Ombres & Effets lumineux

| Token / Valeur | Usage |
|----------------|-------|
| `--shadow: 0 4px 24px rgba(0,0,0,.4)` | Ombres génériques (mode sombre) |
| `var(--glow-fire): 0 0 40px rgba(232,83,26,.15)` | Cards critiques, cluster actif |
| `0 24px 80px rgba(0,0,0,.5)` | Modales (ombre de profondeur) |
| `0 0 20px rgba(232,83,26,.3)` | Hover btn-primary |
| `filter: blur(90px)` | Blobs de fond (effets d'ambiance) |
| `backdrop-filter: blur(20px)` | Navbar scrollée, modal overlay |
| `backdrop-filter: blur(6px)` | Overlay des modales |

**Blobs d'ambiance** : Deux blobs flottants sont présents sur les pages landing et auth. Blob fire (top-right) : `radial-gradient(circle, rgba(232,83,26,.09), transparent 65%)`, 700×700px. Blob green (bottom-left) : `radial-gradient(circle, rgba(34,197,94,.05), transparent 65%)`, 500×500px. Ces éléments créent une atmosphère sans distraire le contenu.

**Grille de fond** : Une grille orthogonale subtile (`48px × 48px`) en `rgba(255,255,255,.025)` est appliquée sur les pages landing et auth. Elle renforce l'aspect technique/data et donne de la profondeur aux pages à fond plat.

---

## 3. Système de Grille & Mise en Page

### Mise en page globale

L'application a trois contextes de mise en page distincts :

**Pages publiques (Landing, Login, Register)** : Centrage horizontal via `.container` (max 1180px). Sections pleine largeur avec padding vertical généreux (80–96px). Navigation fixe en haut.

**Dashboard (authentifié)** : Layout app-shell en deux colonnes. Sidebar fixe à gauche (228px), zone de contenu flexible à droite. La topbar est fixe en haut de la zone de contenu. Le scroll est isolé dans `.app-body`.

```
┌─────────────────────────────────────────────────┐
│  NAVBAR (fixed, 68px)                            │
├──────────┬──────────────────────────────────────┤
│ SIDEBAR  │ TOPBAR (58px)                         │
│ (228px)  ├──────────────────────────────────────┤
│          │ APP BODY (scroll indépendant, 24px pad)│
│          │                                        │
│          │                                        │
└──────────┴──────────────────────────────────────┘
```

**Pages auth (Login, Register)** : Centrage vertical et horizontal via `min-height: 100vh` + flexbox. Carte de formulaire max `420–440px` de large.

### Grilles de contenu fréquentes

| Usage | Règle CSS | Breakpoint |
|-------|-----------|------------|
| Features landing | `repeat(3, 1fr)` | 3 col > 768px |
| Stat-cards dashboard | `repeat(4, 1fr)` | 4 col > 768px |
| Pricing | `repeat(3, 1fr)` | 3 col > 768px |
| Clusters | `repeat(2, 1fr)` | 2 col > 768px |
| Prédictions | `1fr 300px` | Carte + panneau latéral |
| Profil | `1fr 1fr` | 2 col > 768px |
| Abonnements | `repeat(3, 1fr)` | 3 col > 768px |
| Footer | `2fr 1fr 1fr 1fr` | 4 col > 768px |
| Zones | `1 colonne` | Liste verticale |
| Alertes | `1 colonne` | Liste verticale |

---

## 4. Composants de Base

### 4.1 Boutons

Six variantes de bouton, toutes utilisant `font-family: 'Space Grotesk'`, `font-weight: 600`, `border-radius: 8px (--radius-sm)`, transition `all .2s`.

#### `.btn-primary` — Action principale
```
Background : --fire (#e8531a)
Couleur texte : #fff
Padding : 10px 22px (base) / 13px 28px (lg) / 16px 36px (xl)
Hover : background --fire-light + box-shadow 0 0 20px rgba(232,83,26,.3)
```
Usage : CTA landing, soumission de formulaires critiques, actions de déclenchement.

#### `.btn-ghost` — Action secondaire
```
Background : transparent
Bordure : 1px solid --border2
Couleur texte : --text
Hover : background --surface2 · border --border3 · couleur --white
```
Usage : Actions alternatives, navigation "Précédent", bouton "Fermer" dans les modales.

#### `.btn-surface` — Action tertiaire
```
Background : --surface2
Bordure : 1px solid --border2
Couleur texte : --text
Hover : background --surface3 · couleur --white
```
Usage : Boutons de filtre de carte (toggleCtrl), actions de panneau.

#### `.btn-green` — Confirmation / Succès
```
Background : --green (#22c55e)
Couleur texte : #fff
Hover : background --green-dim
```
Usage : Validation OTP, actions de confirmation non-critique.

#### `.btn-danger` — Action destructrice
```
Background : rgba(239,68,68,.1)
Bordure : 1px solid rgba(239,68,68,.2)
Couleur texte : --red
Hover : background rgba(239,68,68,.2)
```
Usage : Bouton "Supprimer le compte", actions irréversibles. **Ne jamais remplacer par btn-primary rouge.**

> **Variante destructrice confirmée** : Dans la modale de confirmation de suppression, le bouton final utilise `background: var(--red); color: #fff` (rouge plein) pour signaler l'irréversibilité finale. C'est la seule exception à la règle du btn-danger translucide.

#### Modificateurs de taille
| Classe | Padding | Font-size |
|--------|---------|-----------|
| `.btn-sm` | `7px 14px` | `12px` |
| *(base)* | `10px 22px` | `14px` |
| `.btn-lg` | `13px 28px` | `15px` |
| `.btn-xl` | `16px 36px` | `16px` |
| `.btn-block` | `width: 100%` | — |

---

### 4.2 Badges & Étiquettes de statut

#### Badges génériques (`.badge`)
Padding `4px 11px`, `border-radius: 20px`, `font-size: 11px`, `font-weight: 600`, `letter-spacing: .3px`. Affichage `inline-flex` avec gap pour icône optionnelle.

| Classe | Background | Couleur | Bordure | Usage |
|--------|-----------|---------|---------|-------|
| `.badge-fire` | `rgba(232,83,26,.12)` | `--fire-light` | `rgba(232,83,26,.2)` | Alertes feu, risque élevé, Premium |
| `.badge-green` | `rgba(34,197,94,.1)` | `--green` | `rgba(34,197,94,.18)` | Succès, LOW risk, Standard recommandé |
| `.badge-amber` | `rgba(245,158,11,.1)` | `--amber` | `rgba(245,158,11,.2)` | Risque MEDIUM, avertissements |
| `.badge-red` | `rgba(239,68,68,.12)` | `--red` | `rgba(239,68,68,.2)` | Risque CRITICAL, erreurs |
| `.badge-muted` | `--surface2` | `--muted` | `--border2` | Sources de données, rôle Visiteur |
| `.badge-blue` | `rgba(59,130,246,.1)` | `--blue` | `rgba(59,130,246,.2)` | Informations neutres, métriques IA |

#### Pills de statut de feu (`.pill-*`)
Padding `3px 10px`, `border-radius: 12px`, `font-size: 11px`, `font-weight: 600`.

| Classe | Background | Couleur | Valeur correspondante |
|--------|-----------|---------|----------------------|
| `.pill-active` | `rgba(239,68,68,.12)` | `--red` | ACTIF / ACTIVE |
| `.pill-cooling` | `rgba(245,158,11,.1)` | `--amber` | REFROID. / COOLING |
| `.pill-out` | `rgba(34,197,94,.1)` | `--green` | ÉTEINT / LIKELY_OUT |

> **Différence badge vs pill** : Les badges sont plus arrondis (20px) et servent à catégoriser. Les pills sont légèrement moins arrondis (12px) et indiquent uniquement l'état d'un feu.

---

### 4.3 Cartes

#### `.card` — Carte de base
```
Background : --card (#141e19)
Bordure : 1px solid --border
Border-radius : --radius (12px)
Hover : border-color --border2
```
Paddings via modificateurs : `.card-p` (24px), `.card-sm` (16px).

`.card-glow` ajoute `box-shadow: var(--glow-fire)` pour les cards à contenu critique.

#### `.cluster-card` — Carte cluster cliquable
Hérite de `.card`. Ajoute `cursor: pointer`, transition `border-color` et `transform`.
```
Hover : border-color --fire · transform translateY(-2px)
```
Contient systématiquement : header (nom + région + pill statut), grille 3 mini-stats, footer (FRP info + bouton Détails).

#### `.zone-card` — Carte zone prioritaire
```
Disposition : flex, space-between
Hover : border-color --green
Margin-bottom : 10px
```
Cas spécial "Ajouter" : `border-style: dashed`, centré, hover fire.

#### `.pricing-card` — Carte de tarification
`border-radius: --radius-lg (18px)`, padding `32px`.
`.pricing-card.featured` : `border-color: rgba(232,83,26,.3)`, dégradé de fond.

#### `.testi-card` — Carte témoignage
Identique à `.card` avec padding `28px`.

---

### 4.4 Formulaires

#### Champs de saisie
```
.form-input, .form-select, .form-textarea {
  background: --surface2
  border: 1px solid --border2
  border-radius: --radius-sm (8px)
  padding: 10px 14px
  font-size: 14px
  color: --text
  transition: .2s
}

:focus {
  border-color: --fire
  background: --surface3
}

::placeholder { color: --muted }
[disabled] { opacity: .45; cursor: not-allowed }
```

#### Labels de formulaire
```
.form-label {
  font-size: 11px
  font-weight: 600
  letter-spacing: .8px
  text-transform: uppercase
  color: --muted
  margin-bottom: 6px
}
```

#### Grilles de formulaire
- `.form-grid-2` : 2 colonnes égales, gap 14px
- `.form-grid-3` : 3 colonnes égales, gap 12px

#### OTP (One-Time Password)
Disposition flex centrée, gap 8px.
```
.otp-box {
  width: 46px
  height: 52px
  background: --surface2
  border: 1px solid --border2
  border-radius: --radius-sm
  font: Outfit 22px 800
  color: --white
  text-align: center
}

:focus { border-color: --fire }
```
Les 6 boîtes se remplissent en séquence avec focus automatique sur la suivante.

#### Divider "ou"
```
.divider {
  display: flex · align-items: center · gap: 14px
  color: --muted · font-size: 12px · margin: 18px 0
  ::before/::after : flex: 1 · height: 1px · background: --border
}
```

---

### 4.5 Tableaux

```
.table th {
  font-size: 10px · font-weight: 700 · letter-spacing: 1.2px
  text-transform: uppercase · color: --muted
  padding: 10px 16px · background: --surface2
  border-bottom: 1px solid --border
}

.table td {
  padding: 13px 16px · font-size: 13px
  border-bottom: 1px solid rgba(26,40,32,.8)
  vertical-align: middle
}

.table tr:hover td { background: rgba(255,255,255,.012) }
.table tr:last-child td { border-bottom: none }
```

Les tableaux sont toujours enveloppés dans un container avec `overflow-x: auto` pour la compatibilité mobile. La première colonne (#) est en `color: --muted, font-size: 11px`. Les coordonnées GPS utilisent `font-family: monospace`.

---

### 4.6 Barres de progression

**Standard** (scores de risque dans tableaux) :
```
.progress { height: 5px · background: --border2 · border-radius: 3px · overflow: hidden }
.progress-fill { height: 100% · border-radius: 3px · transition: width .5s }
```
Largeur = `risque * 100%`. Couleur selon niveau : vert, amber, orange `#f97316`, rouge.

**Gradient de risque** (carte prédictions) :
```
.risk-bar {
  height: 6px · border-radius: 3px
  background: linear-gradient(90deg, #22c55e 0%, #f59e0b 45%, #ef4444 100%)
}
```
Barre continue pour la légende de la carte de risque J+1.

**Barres régions** (panneau prédictions) : Même composant `.progress`, largeur proportionnelle au score, couleur dynamique selon niveau.

---

### 4.7 Toggles

```
.toggle {
  width: 42px · height: 23px · background: --border2
  border-radius: 12px · position: relative
  ::after { width: 17px · height: 17px · background: #fff · border-radius: 50% · left: 3px }
}

.toggle.on {
  background: --fire
  ::after { left: 22px }
}
```
Transitions sur background et position du thumb : `.2s`. Usage : activation des abonnements, filtres "Exclure bruit".

---

### 4.8 Indicateurs de statut live

**Point clignotant** :
```
.live-dot {
  width: 7px · height: 7px · background: --green · border-radius: 50%
  animation: pulse 2s infinite
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,.4) }
  50%       { opacity: .7; box-shadow: 0 0 0 4px rgba(34,197,94,0) }
}
```

**Chip live** (ensemble complet) :
```
.live-chip {
  display: flex · align-items: center · gap: 6px
  font-size: 12px · color: --text2
  background: --surface2 · border: 1px solid --border2
  border-radius: 20px · padding: 5px 12px · font-weight: 500
}
```
Variante alerte : `color: --fire-light`, `border-color: rgba(232,83,26,.2)`, `background: rgba(232,83,26,.06)`.

**Point de notification** (badge count) :
```
.notify-dot {
  position: absolute · top: -2px · right: -2px
  width: 8px · height: 8px · border-radius: 50%
  background: --fire · border: 2px solid --surface
}
```

---

## 5. Composants Métier

### 5.1 Carte de détection (table row)

Chaque ligne du tableau de détection contient ces colonnes dans cet ordre :

| Colonne | Contenu | Style spécifique |
|---------|---------|-----------------|
| # | Numéro d'ordre | `color: --muted, font-size: 11px` |
| Date / Heure | Format `YYYY-MM-DD HH:mm` | `font-size: 12px` |
| Coordonnées | `lat, lng` | `font-family: monospace, font-size: 11px, color: --text2` |
| Région | Nom de région | `font-size: 12px` |
| Source | Badge `.badge-muted` | VIIRS_NOAA21 / VIIRS_SNPP / MODIS |
| FRP (MW) | Valeur numérique | Couleur dynamique selon risque, `font-weight: 700` |
| Score Risque | Progress bar 52px + score | `[progress bar colorée] [0.91]` |
| Niveau | Badge coloré | CRITICAL / HIGH / MEDIUM / LOW |
| Statut | Pill | ACTIF / REFROID. / ÉTEINT |

**Score Risque** : La barre de progression et le chiffre sont toujours côte à côte, jamais l'un sans l'autre. C'est un composant atomique indivisible.

---

### 5.2 Carte de cluster FireEvent

Structure interne obligatoire :

```
[Header]
  Nom cluster (Outfit 700 16px, --white) + région (12px, --muted)   |   Pill statut

[Grille 3 colonnes : mini-stats]
  .cluster-mini-stat → fond --surface2, border-radius --radius-sm, padding 10px, text-align center
  Valeur : Outfit 800 20px + couleur dynamique
  Label : 10px --muted

[Footer]
  FRP info (11px, --muted)   |   Bouton "Détails →" (.btn-ghost .btn-sm)
```

**Couleurs des mini-stats selon statut** :
- ACTIF : fire-light / amber / red
- COOLING : orange #f97316 / amber / orange
- LIKELY_OUT : green / green / green

---

### 5.3 Carte de zone prioritaire

```
[Zone-card : flex, space-between, align-items: flex-start]

  [Gauche : icône + infos]
    Icône 44×44px, border-radius 11px, couleur thématique (green pour forêt, amber pour parc)
    Nom (Outfit 700 15px --white) · coordonnées (12px --muted)
    Badges : min_risk (.badge-fire) + min_frp (.badge-amber)

  [Droite : statut + actions]
    Pill statut (NORMAL / ALERT)
    Bouton "Éditer" (.btn-ghost .btn-sm)
    Bouton "Supprimer" (.btn-danger)
```

**Carte "Ajouter"** : Dashed border, pas de contenu, centré, `cursor: pointer`. Hover change border en `--fire`.

---

### 5.4 Item d'alerte

```
.alert-item : flex, gap 14px, align-items: flex-start
  padding: 14px 16px · background: --card · border: 1px solid --border
  border-radius: --radius

  [Icône .alert-ic : 36×36px, border-radius 9px, couleur contextuelle]
    Rouge (triangle-alert) : incident critique
    Orange (flame) : prédiction risque élevé
    Vert (check-circle) : seuil dégagé / succès
    Rouge (x-circle) : alerte FAILED

  [Corps : flex: 1]
    Titre : 13px font-weight 600 --white, margin-bottom 3px
    Métadonnées : 11px --muted (date, heure, FRP, région)
    Tags canaux : [EMAIL] [SMS] [WHATSAPP] en surface2 + badge SENT (green) ou FAILED (red)
```

---

### 5.5 Carte d'abonnement

`.sub-card` : hérite de `.card`, padding `20px`.

```
[Header : flex, space-between]
  Badge canal (EMAIL/SMS/WHATSAPP) | Toggle on/off

[Destination]
  email ou téléphone : 13px font-weight 600 --white

[Seuils]
  "min_risk ≥ X · min_frp ≥ Y MW" : 12px --muted

[Action]
  .btn-ghost .btn-sm .btn-block "Modifier"
  ou .btn-primary "Configurer" (si non configuré)
```

Couleur de la bordure selon canal actif :
- EMAIL actif → `border-color: --green`
- SMS actif → `border-color: rgba(232,83,26,.2)`
- WHATSAPP non configuré → couleur par défaut

---

### 5.6 Carte statistique (stat-card)

```
.stat-card : background --card · border 1px --border · border-radius --radius · padding 20px
  display: flex · justify-content: space-between · align-items: center

  [Gauche]
    .stat-num : Outfit 28px 800 · couleur dynamique (fire/amber/green/white/blue)
    .stat-label : 11px --muted

  [Droite]
    .stat-icon : 40×40px · border-radius 10px · background coloré à 10% opacité
```

---

### 5.7 Source chip (chat IA)

```
.source-chip {
  font-size: 10px · padding: 3px 9px
  background: rgba(34,197,94,.08) · color: --green
  border: 1px solid rgba(34,197,94,.18)
  border-radius: 10px · cursor: pointer
}
```
Apparaît sous les bulles de réponse IA. Cliquable pour filtrer par source.

---

### 5.8 Bulles de message (chat)

**Message utilisateur** (droite) :
```
.msg-bubble-user {
  background: --fire · color: #fff
  border-radius: 14px 14px 4px 14px
  padding: 12px 16px · font-size: 13px · line-height: 1.55
  align-self: flex-end · max-width: 75%
}
```

**Message IA** (gauche) :
```
.msg-bubble-ai {
  background: --surface2 · border: 1px solid --border2
  border-radius: 4px 14px 14px 14px
  padding: 12px 16px · font-size: 13px · line-height: 1.55
  align-self: flex-start · max-width: 80%
}
```
Suivi par `.msg-sources` (flex wrap des source chips) et la ligne de méta `gemini-1.5-flash · 1.2s · RAG` en `font-size: 10px, color: --muted`.

**État de chargement IA** : Avant la réponse, le texte est `color: --muted` : "Analyse des données ChromaDB..."

---

## 6. Modales

Toutes les modales partagent la même structure overlay :

```
.modal {
  position: fixed · inset: 0 · background: rgba(0,0,0,.75)
  z-index: 2000 · display: flex · align-items: center · justify-content: center
  padding: 24px · backdrop-filter: blur(6px)
}

.modal-box {
  background: --surface · border: 1px solid --border2
  border-radius: --radius-lg (18px) · padding: 32px
  max-width: 480px (défaut) · width: 100%
  box-shadow: 0 24px 80px rgba(0,0,0,.5)
}

.modal-close {
  position: absolute · top: 16px · right: 16px
  width: 28px · height: 28px · border-radius: 6px
  background: --surface2 · border: 1px solid --border
  color: --muted
  Hover : color --white · background --surface3
}
```

**Fermeture** : Clic sur l'overlay ET sur le bouton ×. Navigation par touche Escape (à implémenter).

### Inventaire des modales

#### Modal Cluster (max-width: 560px)
Header : badge statut + titre Cluster + sous-titre ID/date + icône flame rouge.
Grille 3 mini-stats (Foyers / FRP Total / Durée).
Bloc "Dernières détections" en surface2.
Footer : `[Déclencher Alerte (btn-danger)] [Fermer (btn-ghost)]`

#### Modal Zone Prioritaire
Titre + sous-titre `POST /zones · Réservé aux comptes Premium`.
Champs : Nom · Latitude/Longitude (grid 2) · Rayon/Risque Min/FRP Min (grid 3) · Prompt IA personnalisé (textarea).
Footer : `[Créer la zone (btn-primary)] [Annuler (btn-ghost)]`

#### Modal Abonnement
Champs : Canal (select) · Destination · Seuil Risque/Seuil FRP (grid 2).
Footer : `[S'abonner (btn-primary)] [Annuler (btn-ghost)]`

#### Modal Suppression de compte (max-width: 400px, centré)
Icône trash-2 centrée dans cercle rouge translucide (56×56px).
Titre destructeur + texte de confirmation.
Footer : `[Annuler (btn-ghost)] [Supprimer (rouge plein, btn-danger override)]`
> Absence de bouton × intentionnelle : force l'utilisateur à choisir explicitement.

---

## 7. Navigation

### 7.1 Navbar Landing (publique)

```
#nav {
  position: fixed · top 0 · z-index: 900
  Transition background .3s
}

#nav.scrolled {
  background: rgba(8,12,10,.92) · backdrop-filter: blur(20px)
  border-bottom: 1px solid --border
}
```

**Contenu** (height 68px, max-width container 1180px) :
- **Logo** : Image 36×36px (border-radius 9px, box-shadow fire-glow) + texte Outfit 800 20px ("Jery" blanc + "Motro" fire-light)
- **Liens centraux** : 14px, font-weight 500, color --text2, hover --white. Sections : Fonctionnalités, Carte Live, Rôles, Tarifs, Contact.
- **Actions droite** : `[Connexion (btn-ghost)] [Démarrer gratuitement (btn-primary)]`

---

### 7.2 Sidebar Dashboard (authentifié)

```
.sidebar {
  width: 228px · flex-shrink: 0
  background: --surface · border-right: 1px solid --border
  display: flex · flex-direction: column · overflow: hidden
}
```

**Structure verticale** :
1. `.sidebar-head` (padding 20px, border-bottom) : Logo compact (30×30px, font-size 16px)
2. `.sidebar-nav` (flex: 1, overflow-y auto, padding 10px) : Liens de navigation
3. `.sidebar-user` (padding 14px, border-top) : Profil utilisateur compact

**Liens** (`.sidebar-link`) :
```
display: flex · align-items: center · gap: 10px
padding: 9px 10px · border-radius: --radius-sm
font-size: 13px · font-weight: 500 · color: --text2
transition: .15s

:hover { background: --surface2 · color: --text }
.active { background: rgba(232,83,26,.1) · color: --fire-light }
```

**Icônes** : `.sidebar-link-icon` 15×15px, opacity .7 (1.0 si active).

**Sections** (`.sidebar-section`) : `10px, font-weight 700, letter-spacing 1.8px, uppercase, --muted, padding 14px 8px 5px`.

**Pills de count** (`.sidebar-pill`) : `margin-left: auto, font-size: 10px, font-weight: 700, padding: 2px 7px, border-radius: 10px`. Couleurs : fire pour détections, amber pour clusters, green pour RAG.

**Profil utilisateur** (sidebar-user-inner) :
- Fond `--surface2`, border `--border2`, `--radius-sm`
- Avatar initiales : 30×30px, circle, `rgba(232,83,26,.2)`, initiales en `--fire-light`, Outfit 11px 800
- Nom : 12px 600 --white (ellipsis) + rôle : 10px --fire-light 600

**Navigation hiérarchique complète** :
```
[Détections]
  Détections Live     (flame)      [87]  ← badge fire
  Clusters FireEvents (layers)     [14]  ← badge amber

[Analyse]
  Prédiction J+1      (brain)
  Statistiques        (bar-chart-2)
  JeryMotro AI        (bot)         [RAG] ← badge green

[Premium]
  Zones Prioritaires  (map-pin)

[Mon Compte]
  Mes Alertes         (bell)        [3]   ← badge fire + notify-dot
  Abonnements         (rss)
  Profil              (user)

  Déconnexion         (log-out)
```

---

### 7.3 Topbar Dashboard

```
.topbar {
  height: 58px · background: --surface · border-bottom: 1px solid --border
  display: flex · align-items: center · padding: 0 24px · gap: 14px
}
```

**Contenu** :
- `.topbar-title` : Outfit 700 15px --white (flex: 1) — titre dynamique de l'onglet actif
- `live-chip` vert : "API opérationnelle"
- `live-chip` fire : "3 alertes actives" avec icône triangle-alert
- Bouton icône bell avec `notify-dot` (largeur 32px, --surface2, --border)
- Bouton icône user (accès profil)

---

## 8. Pages & Écrans

### 8.1 Landing Page

**Structure de page** :
1. Navbar fixe
2. Hero section (padding 160px top, 100px bottom)
3. Section Carte Live (padding 80px)
4. Section Features (padding 96px, fond légèrement teinté fire)
5. Section Rôles (padding 96px)
6. Section Pricing (padding 96px)
7. Section Contact (padding 96px)
8. Footer (padding 56px top, 28px bottom)

**Hero** :
- Fond : `grid-bg` + blob fire (top-right 700px) + blob green (bottom-left 500px) + 2 anneaux concentriques (hero-ring)
- Badges supérieurs : 3 badges en flex centré
- Titre `.display` : "Détectez les feux. [Protégez Madagascar.]" — le texte entre balises `<em>` est en `--fire-light`
- Sous-titre : 17px --text2, max-width 600px, centré
- CTA row : `[Créer un compte (btn-primary xl)] [Voir la carte (btn-ghost xl)]`
- Barre de stats : 4 colonnes, fond --card, séparées par border de 1px
- Barre "Propulsé par" : badges muted, NASA FIRMS / GEE / Gemini / ChromaDB / Twilio

**Section Features** (3 colonnes) :
Chaque card : icône colorée 46×46px (border-radius 11px), titre h3, description 13px --text2, hover change border en couleur thématique (fire / amber / green).

**Section Pricing** (3 colonnes) :
- **Visiteur** : Gratuit, sans inscription, features listées avec icônes check/x
- **Standard** : `0 Ar`, featured (border fire légère, dégradé fond), badge "Recommandé" top-right
- **Premium** : "Contact", border fire plus prononcée, accès complet

**Section Contact** : Grille 1+1.5, infos contacts à gauche (email, API doc, URL prod, dev local), formulaire card à droite.

**Footer** : Grille `2fr 1fr 1fr 1fr`. Col 1 : logo + tagline. Colonnes 2–4 : liens Plateforme, API, Légal. Bottom bar : copyright + stack technologique.

---

### 8.2 Page de Connexion

**Layout** : Centrage vertical/horizontal, fond avec grid-bg + blob fire top-right, largeur formulaire max `420px`.

**Structure** :
1. Logo centré (42×42px) + titre "Connexion" + sous-titre
2. Card principale avec :
   - **Switcher de méthode** : fond --surface2, border-radius --radius-sm, padding 4px. Onglet actif en --fire plein (texte blanc), inactif transparent.
   - **Mode Mot de passe** : Email + Mot de passe + Lien "Mot de passe oublié ?" (aligné droite, --fire-light) + btn-primary block
   - **Mode OTP (step 1)** : Email + Canal (select) + btn-primary "Envoyer le code"
   - **Mode OTP (step 2)** : Email masqué + 6 boîtes OTP + btn-green "Valider" + lien "Renvoyer"
   - Divider "ou"
   - Lien vers inscription
   - Lien "← Retour à l'accueil"

---

### 8.3 Page d'Inscription

**Layout** : Identique au login, max `440px`, blob green (bottom-left).

**Formulaire** :
- Grid 2 : Nom complet + Organisation (optionnel)
- Email (label inclut `· POST /auth/register`) + Mot de passe + Confirmer
- Zone légale (CGU + Politique) en --surface2 border
- btn-primary block "Créer mon compte gratuit"
- Liens : "Déjà un compte" + "← Retour"

---

### 8.4 Dashboard — Vue d'ensemble

App-shell layout. Contenu = ensemble Sidebar + [Topbar + app-body]. Chaque onglet de la sidebar correspond à un `div[id="tab-*"]` affiché/masqué. Le titre de la topbar est mis à jour dynamiquement.

---

### 8.5 Tab Détections Live

**Filter bar** (`.filter-bar`) :
```
background: --surface · border: 1px solid --border · border-radius: --radius · padding: 18px 20px
```
Header : icône sliders + label `Filtres · GET /detections`.
Champs en flex wrap : Date début · Date fin · Région (select) · Risque min · FRP min · Toggle "Exclure bruit" · btn-primary "Appliquer".

**Tableau** (`.card` sans padding, overflow hidden) :
- Header de card : compteur détections + endpoint monospace + bouton "Export CSV"
- Table avec 9 colonnes
- Pagination : "Page 1 / 9 · 87 résultats" + boutons Préc./Suiv.

---

### 8.6 Tab Clusters FireEvents

**Filtres** : Ligne compacte avec endpoint monospace + boutons filtre statut.

**Grille 2×2** de `.cluster-card`.

**Modale détail** au clic sur une card.

---

### 8.7 Tab Prédictions J+1

**Layout 2 colonnes** : Carte (flexible) + Panneau latéral (300px fixe).

**Colonne gauche** :
- Titre + endpoint monospace + contrôle de seuil (range slider avec `accent-color: --fire`)
- Carte Leaflet dark (400px de hauteur)
- Légende gradient + valeurs seuils

**Colonne droite** :
- Card "Métadonnées GeoJSON" : paires clé/valeur (Date, Modèle, Total cellules, Haut risque, Couverture)
- Card "Top régions à risque" : 4 barres de progression avec région + score + couleur

---

### 8.8 Tab Statistiques

**Grid 4 stat-cards** : Détections (fire) · Clusters (amber) · Précision XGBoost (green) · Réponse IA (blue)

**Grid 2 colonnes** (2fr 1fr) :
- Graphique SVG "Évolution 7 jours" : courbe fire avec dégradé de remplissage + points + labels de dates + sélecteur 7j/30j
- Donut chart ou barres "Répartition par risk_level" (CRITICAL/HIGH/MEDIUM/LOW)

---

### 8.9 Tab JeryMotro AI (Chat RAG)

**Layout** : `chat-container` en flex (hauteur = 100vh - topbar - padding).

**Sidebar chat** (216px) :
- Header "Conversation" + bouton "+"
- Liste de sessions passées (fond --card, border --border, hover surface2)

**Zone principale** :
- `.chat-body` : colonne flex
- `.chat-messages` : scroll, gap 14px entre messages
- `.chat-input-bar` : textarea + btn-primary "Envoyer"

**Suggestions rapides** :
Chips pré-remplies (ex: "Situation Menabe ?", "Prévisions demain ?") en surface2, hover fire.

**Format réponse IA complète** :
```
[Bulle msg-bubble-ai]
[.msg-sources → source chips verts]
[Méta : gemini-1.5-flash · 1.2s · RAG (10px, --muted)]
```

---

### 8.10 Tab Zones Prioritaires (Premium)

**Header** : Titre + sous-titre `POST /zones · Comptes Premium` + btn-primary "Nouvelle zone" (ouvre modal-zone).

**Liste** de `.zone-card` + carte dashed "Ajouter".

Chaque zone affiche son état de surveillance avec le pill-statut (NORMAL = aucun feu dans le périmètre, ALERT = feu détecté).

---

### 8.11 Tab Historique Alertes

**Header** : Titre + endpoint + filtres statut (Toutes / SENT / FAILED).

**Liste** de `.alert-item` triée chronologiquement, la plus récente en haut.

---

### 8.12 Tab Abonnements

**Header** : Titre + endpoint + btn-primary "Nouvel abonnement".

**Grille 3 sub-cards** : EMAIL · SMS · WHATSAPP.

---

### 8.13 Tab Profil

**Grid 2 colonnes** :

**Colonne Informations** (`.card card-p`) :
- Header profil : avatar 54px (circle, --fire bg translucide, initiales fire-light Outfit 900 18px) + nom + badge rôle
- Champs : Nom complet · Organisation · Email (disabled)
- btn-primary sm "Sauvegarder"

**Colonne Contacts** (`.card card-p`) :
- Champs : Téléphone SMS · WhatsApp
- Badge "Téléphone vérifié (OTP)" en badge-green
- btn-primary sm "Mettre à jour"
- "Zone de danger" : titre rouge + texte d'avertissement + btn-danger "Supprimer mon compte"

---

## 9. Composant Carte (Leaflet)

### Tile layer
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
```
Fond CARTO Dark est obligatoire pour la cohérence avec le dark theme. En mode clair, basculer sur `carto_light_all`.

### Personnalisation des popups
```css
.leaflet-popup-content-wrapper {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border2);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}
.leaflet-popup-tip { background: var(--surface2); }
.leaflet-container { background: var(--bg) !important; font-family: 'Space Grotesk', sans-serif; }
```

### Marqueurs de feux (CircleMarker)
| Niveau | Couleur | Radius formule |
|--------|---------|---------------|
| CRITICAL (≥ 0.8) | `#ef4444` | `6 + risk * 8` |
| HIGH (0.6–0.8) | `#f97316` | `6 + risk * 8` |
| MEDIUM (0.4–0.6) | `#f59e0b` | `6 + risk * 8` |
| LOW (< 0.4) | `#22c55e` | `6 + risk * 8` |

Tous les marqueurs : `color: #fff, weight: 1, opacity: 0.9, fillOpacity: 0.8`.

### Clusters (cercle dashed)
```javascript
L.circle(center, {
  radius: 15000, // mètres
  color: '#e8531a', fillColor: '#e8531a',
  fillOpacity: 0.1, weight: 2, dashArray: '5, 5'
})
```

### Carte Prédictions (GeoJSON)
Marqueurs circulaires, radius = `12 + risk * 10`. Couleur selon seuils identiques aux feux. FillOpacity = `risk * 0.7`.

### Conteneur de carte
```css
.map-wrap { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
```
Landing : `height: 500px`. Dashboard prédictions : `height: 400px`.

---

## 10. Système de Rôles & Accès

### Matrice des accès visuels

| Fonctionnalité | Visiteur | Standard | Premium | Admin |
|----------------|----------|----------|---------|-------|
| Carte publique | ✅ | ✅ | ✅ | ✅ |
| Détections Live | ✅ | ✅ | ✅ | ✅ |
| Clusters FireEvents | ✅ | ✅ | ✅ | ✅ |
| Prédictions J+1 | ✅ | ✅ | ✅ | ✅ |
| Chat IA général | ✅ | ✅ | ✅ | ✅ |
| Alertes EMAIL | ❌ | ✅ | ✅ | ✅ |
| Alertes SMS/WhatsApp | ❌ | ❌ | ✅ | ✅ |
| Zones prioritaires | ❌ | ❌ | ✅ | ✅ |
| Chat IA avec zone_id | ❌ | ❌ | ✅ | ✅ |
| Déclenchement manuel | ❌ | ❌ | ❌ | ✅ |

### Signalisation visuelle des accès

**Éléments Premium** dans la sidebar :
```
Section "Premium" avec badge latéral (pas de lock, pas d'opacité réduite)
→ L'élément est visible et accessible, mais l'API renvoie 403 pour les non-Premium
```

**Badge de rôle** dans la sidebar user :
- Premium → texte `10px --fire-light font-weight: 600`
- Standard → texte `10px --text2`

**Restriction visible dans les modales** :
`POST /zones · Réservé aux comptes Premium` en sous-titre gris.

**Éléments grisés (Standard essayant SMS)** :
Dans la grille des abonnements, la card WHATSAPP est en état "Non configuré" avec le bouton "Configurer" (btn-primary). L'erreur 403 s'affichera après soumission du formulaire — on ne bloque pas l'UI avant.

---

## 11. Mode Clair — Adaptations

### Principe de bascule
```css
:root { /* variables dark par défaut */ }
[data-theme="light"] { /* surcharges light */ }
```

### Adaptations spécifiques

**Blobs d'ambiance** : Opacité légèrement réduite (`.09` → `.06` pour le fire, `.05` → `.03` pour le green) pour éviter la surcharge sur fond clair.

**Grille de fond** : `rgba(0,0,0,.04)` au lieu de `rgba(255,255,255,.025)`.

**Scrollbar** : `.scrollbar-thumb` → `var(--border2)` (plus visible sur fond clair).

**Carte Leaflet** : Basculer sur `carto_light_all` tile layer.

**Graphique SVG** : Les lignes de grille passent de `rgba(26,40,32,.9)` à `rgba(0,0,0,.08)`. La courbe fire reste inchangée.

**Code block** : `color: var(--green-dim)` au lieu de `--green` pour contraste.

**Popups Leaflet** : Fond blanc, texte sombre, bordure `--border`.

**Modal overlay** : `rgba(0,0,0,.4)` au lieu de `.75` (moins opaque sur fond clair).

**Toggle button** (mode sombre/clair) :
Placé dans la navbar, icône soleil/lune (lucide: `sun` / `moon`), `.topbar-btn` style.

---

## 12. Responsive & Mobile

### Breakpoints

| Breakpoint | Règle | Comportements |
|-----------|-------|---------------|
| Mobile | `max-width: 768px` | Sidebar masquée, nav-links masqués |
| Desktop | `> 768px` | Layout complet |

### Adaptations déclarées

```css
@media (max-width: 768px) {
  .nav-links { display: none; }
  .sidebar { display: none; }
  .display { font-size: clamp(32px, 8vw, 56px); }
}
```

### Comportements recommandés (à implémenter)

**Mobile Dashboard** : La sidebar devient un drawer latéral (slide-in depuis la gauche). Un bouton hamburger dans la topbar l'ouvre. Overlay semi-transparent derrière le drawer.

**Grilles responsive** :
- `repeat(4, 1fr)` → `repeat(2, 1fr)` sur mobile (stat-cards)
- `repeat(3, 1fr)` → `1fr` sur mobile (features, pricing)
- `repeat(2, 1fr)` → `1fr` sur mobile (clusters, profil)
- `1fr 300px` → `1fr` sur mobile (prédictions, empile verticalement)

**Tableaux** : Sur mobile, utiliser `overflow-x: auto` (déjà implémenté) + réduire les colonnes non essentielles.

**Chat** : Sur mobile, le sidebar chat disparaît, seule la conversation reste.

**Clavier OTP** : Sur mobile, `inputmode="numeric"` sur les `.otp-box`.

---

## 13. Animations & Micro-interactions

### Transitions globales

Tous les éléments interactifs utilisent `transition: .2s` (ou `.15s` pour les petits éléments). Aucun élément ne change d'état sans transition visible.

### Animations définies

**`pulse`** (live-dot) :
```css
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
  50%       { opacity: .7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
}
animation: pulse 2s infinite;
```

### Micro-interactions

| Élément | Interaction | Effet |
|---------|-------------|-------|
| `.btn-primary` | hover | background fire-light + glow box-shadow |
| `.cluster-card` | hover | border fire + translateY(-2px) |
| `.card` features | hover | border thématique (fire/amber/green) |
| `.zone-card` | hover | border green |
| `.zone-card` (dashed) | hover | border fire |
| Sidebar link | hover | surface2 + text white |
| `.modal-close` | hover | surface3 + white |
| `.form-input` | focus | border fire + background surface3 |
| `.otp-box` | focus | border fire |
| `.chat-textarea` | focus | border fire |
| Toggles | click | transition left thumb + background |
| `.topbar-btn` | hover | surface3 + white |
| Navbar | scroll | appear avec blur background |
| `.btn-ghost` | hover | surface2 + border3 + white |

### État de chargement IA

Lors d'une requête RAG, la bulle IA apparaît immédiatement avec le texte "Analyse des données ChromaDB..." en couleur `--muted`. Après 1.2s (simulated), le contenu réel remplace le texte de chargement. L'effet de remplacement doit être une transition douce (`opacity 0 → 1`).

---

## 14. Accessibilité

### Contraste vérifié
- `--white` sur `--bg` : 14.8:1 (AAA)
- `--fire-light` sur `--card` : ≥ 4.5:1 (AA)
- `--text` sur `--surface` : 7.2:1 (AA)
- Texte de bouton blanc sur `--fire` : 3.8:1 (AA Large)

### Labels et sémantique

Tous les `form-input` ont un `form-label` associé. Les icônes décoratives (lucide-icons) ont `aria-hidden="true"`. Les boutons sans texte (icon-only topbar-btn) doivent avoir `aria-label`.

### Navigation clavier

Tous les éléments interactifs sont accessibles au clavier (focus natif). La modale devrait piéger le focus (focus trap) pendant son ouverture.

### Scroll behavior

`html { scroll-behavior: smooth; }` pour les ancres de la landing page.

### Textes de screen reader

Les live-chips ("API opérationnelle") sont `role="status"` pour les lecteurs d'écran. Les live-dots ont `aria-label="Live"`.

---

## 15. Iconographie

JeryMotro utilise exclusivement **Lucide Icons** (v0.latest, chargé via CDN UMD). Les icônes sont initialisées via `lucide.createIcons()` après chaque changement de DOM dynamique.

### Correspondances sémantiques

| Icône Lucide | Usage dans JeryMotro |
|---|---|
| `flame` | Détections, risque feu, alerte critique |
| `layers` | Clusters FireEvents |
| `brain` | Prédictions ML, JeryMotro AI |
| `bot` | Chat IA |
| `map-pin` | Zones prioritaires |
| `bell` | Alertes, notifications |
| `rss` | Abonnements |
| `user` | Profil, bouton topbar |
| `bar-chart-2` | Statistiques |
| `satellite` | Source NASA FIRMS |
| `triangle-alert` | Alerte critique active |
| `check-circle` | Succès, seuil dégagé, vérifié |
| `x-circle` | Échec, alerte FAILED |
| `log-out` | Déconnexion |
| `plus` / `plus-circle` | Ajouter |
| `trash-2` | Supprimer |
| `save` | Sauvegarder |
| `send` | Envoyer (OTP, message, formulaire) |
| `download` | Export CSV |
| `sliders-horizontal` | Filtres |
| `search` | Appliquer filtres |
| `map` | Voir la carte |
| `rocket` | CTA principal (créer compte) |
| `cpu` | ML/modèle IA |
| `zap` | Performance, vitesse |
| `radio` | Temps réel, live |
| `globe` | URL de production |
| `code` | API documentation |
| `mail` | Email, contact |
| `log-in` | Connexion |
| `user-plus` | Inscription |
| `check` | Validation, feature incluse |
| `x` | Feature exclue, fermer |
| `bell-ring` | Déclencher alerte |
| `mountain` | Parc national |
| `sun` / `moon` | Basculement mode clair/sombre |

### Tailles d'icônes par contexte

| Contexte | Taille |
|----------|--------|
| Sidebar nav link | `15×15px` |
| Bouton action | `12–14px` |
| Card feature | `22×22px` |
| stat-icon | `20×20px` |
| alert-ic | `16×16px` |
| Modal header | `24×24px` |
| Topbar btn | `15×15px` |
| Badge inline | `11–12px` |

---

## 16. Variables CSS complètes

Référence complète pour l'implémentation :

```css
:root {
  /* === COULEURS DE FOND === */
  --bg:       #080c0a;
  --bg2:      #0d1210;
  --surface:  #101814;
  --surface2: #161f1b;
  --surface3: #1c2822;
  --card:     #141e19;

  /* === BORDURES === */
  --border:  #1a2820;
  --border2: #213029;
  --border3: #2a3d35;

  /* === TEXTE === */
  --text:  #b8cec6;
  --text2: #8aa89e;
  --muted: #566d65;
  --white: #edf5f1;

  /* === ACCENTS — RISQUE === */
  --fire:       #e8531a;
  --fire-light: #ff6b35;
  --fire-dim:   #9c360e;
  --green:      #22c55e;
  --green-dim:  #16a34a;
  --amber:      #f59e0b;
  --red:        #ef4444;
  --blue:       #3b82f6;

  /* === HALOS === */
  --fire-glow:  rgba(232,83,26,.18);
  --fire-glow2: rgba(232,83,26,.08);
  --green-glow: rgba(34,197,94,.12);
  --glow-fire:  0 0 40px rgba(232,83,26,.15);

  /* === FORME === */
  --radius:    12px;
  --radius-lg: 18px;
  --radius-sm: 8px;

  /* === OMBRES === */
  --shadow: 0 4px 24px rgba(0,0,0,.4);
}

/* === MODE CLAIR === */
[data-theme="light"] {
  --bg:       #f5f7f5;
  --bg2:      #eef1ee;
  --surface:  #ffffff;
  --surface2: #f0f4f2;
  --surface3: #e5ebe8;
  --card:     #ffffff;
  --border:   #d0dbd6;
  --border2:  #b8ccc6;
  --border3:  #9ab5ac;
  --text:     #2a3d36;
  --text2:    #4a6b61;
  --muted:    #7a9e94;
  --white:    #0d1a16;
  --fire:       #e8531a;  /* inchangé */
  --fire-light: #d94a14;
  --green:      #16a34a;
  --green-dim:  #15803d;
  --amber:      #d97706;
  --red:        #dc2626;
  --blue:       #2563eb;
  --glow-fire:  0 0 40px rgba(232,83,26,.08);
  --shadow:     0 4px 24px rgba(0,0,0,.08);
}
```

---

*Documentation générée le 11 juin 2026 · JeryMotro Platform L3 · Encadrante : RANDRIAMIARISON Zilga Heritiana*
