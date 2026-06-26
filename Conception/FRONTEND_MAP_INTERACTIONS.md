# 🗺️ Guide des Interactions Cartographiques — JeryMotro

Ce document décrit le comportement attendu pour l'interface cartographique du Frontend JeryMotro. L'objectif est d'offrir une expérience utilisateur fluide, interactive et très similaire à celle de la plateforme **NASA FIRMS**.

---

## 1. Agencement de l'Interface

L'interface principale doit être divisée en deux parties :
- **Panneau Latéral (Sidebar) :** Affiche la liste des détections de feux et des clusters sous forme de cartes/tuiles.
- **Vue Principale (Map) :** Affiche la carte interactive avec les foyers d'incendie (marqueurs).

---

## 2. Interaction Liste <-> Carte (Comme NASA FIRMS)

Il est indispensable que la liste des feux et la carte soient parfaitement synchronisées.

### 2.1 Survol (Hover)
- Lorsqu'un utilisateur **survole** une détection dans la liste latérale, le marqueur correspondant sur la carte doit **se mettre en surbrillance** (ex: augmentation de la taille, changement de bordure ou animation "pulse").
- Inversement, survoler un marqueur sur la carte doit mettre en évidence son élément correspondant dans la liste.

### 2.2 Clic et Zoom Automatique (FlyTo)
- Au **clic sur un élément de la liste** des détections :
  1. La carte déclenche une animation fluide de déplacement et de zoom (**FlyTo** ou **PanTo**) centré sur les coordonnées exactes du feu (`latitude`, `longitude`).
  2. Le niveau de zoom cible doit être suffisamment élevé (ex: `zoom: 14` ou `15`) pour voir précisément le terrain.
  3. Une **Popup d'information** s'ouvre automatiquement sur le marqueur ciblé, affichant les détails (FRP, Score de risque, Date, etc.).

### 2.3 Rafraîchissement de la vue au déplacement (BBox)
- La liste latérale ne doit afficher **que les détections actuellement visibles** sur la portion de la carte à l'écran. 
- Lorsque l'utilisateur déplace la carte (drag/pan) ou zoome, le Frontend doit intercepter l'événement `onBoundsChanged` ou `onMoveEnd` pour filtrer ou recharger la liste en fonction des limites géographiques (Bounding Box).

---

## 3. Gestion Visuelle des Points et des Clusters

### 3.1 Vue Dé-zoomée (Niveau Pays/Région)
- Afficher les **Clusters** (agrégats) plutôt que les points isolés.
- Les marqueurs de clusters affichent le nombre total de feux (ex: badge "42").
- La taille du cluster sur la carte doit être proportionnelle au nombre de feux.
- Un clic sur un cluster zoome de façon à faire entrer tous les sous-points du cluster dans l'écran (Bounding Box du cluster).

### 3.2 Vue Zoomée (Niveau Local)
- Lorsque le zoom est assez profond, les clusters éclatent pour laisser place aux détections individuelles (points rouges/oranges/jaunes).
- Le dégradé de couleur des points est basé sur le `risk_score` (0-100) :
  - **Rouge foncé / clignotant** : Danger Critique (Score ≥ 80 ou FRP élevé).
  - **Orange** : Danger Élevé (Score ≥ 60).
  - **Jaune** : Danger Moyen (Score ≥ 40).
  - **Vert** : Bas Risque.

---

## 4. Outils Additionnels (Overlay)

L'interface cartographique doit intégrer les contrôles suivants :
1. **Sélecteur de calques (Layers) :** Vue Satellite, Vue Terrain, Vue Carte simplifiée.
2. **Couche JeryMotroNet (GeoJSON) :** Un toggle pour afficher/masquer la grille des prédictions (heatmap / polygones colorés à J+1).
3. **Filtre Temporel :** Un curseur ou sélecteur de date (ex: "Aujourd'hui", "24h", "7 jours") qui met à jour la liste et la carte instantanément.
