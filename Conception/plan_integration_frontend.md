# 🚀 Plan de Travail : Intégration Frontend JeryMotro

Ce plan de travail structure l'intégration complète du frontend de JeryMotro, en s'appuyant sur l'API FastAPI (sur `http://35.192.27.164/jerymotro-api`) et le Design System détaillé (mode sombre par défaut, polices Outfit & Space Grotesk).

---

## Phase 1 : Fondations Techniques & Architecture (Semaine 1)

**Objectif :** Mettre en place le socle du projet, la gestion du thème et le client HTTP.

1.  **Initialisation du Projet**
    *   Création de l'application (React via Vite ou Next.js selon les préférences) en mode Pnpm Workspace.
    *   Configuration du routage : Séparation stricte entre les pages publiques (`/`, `/login`, `/register`) et le dashboard protégé (`/dashboard/*`).
2.  **Intégration du Design System (CSS)**
    *   Importation des polices Google Fonts : *Outfit* (Titres) et *Space Grotesk* (Corps).
    *   Définition de toutes les variables CSS racines (`--bg`, `--surface`, `--fire`, `--text`, etc.) pour le Mode Sombre (défaut) et le Mode Clair (`[data-theme="light"]`).
    *   Mise en place de la grille et des utilitaires d'espacement.
3.  **Client API & Store Global**
    *   Configuration de l'instance **Axios** avec l'URL de base `http://35.192.27.164/jerymotro-api`.
    *   Mise en place des intercepteurs Axios pour l'injection du JWT (`Authorization: Bearer`) et la déconnexion sur erreur `401 Unauthorized`.
    *   Initialisation du state management (ex: Zustand ou React Context) pour stocker les infos de l'utilisateur (`user.role`, `is_active`).

---

## Phase 2 : Bibliothèque de Composants UI (Semaine 1-2)

**Objectif :** Coder les composants atomiques réutilisables selon le Design System.

1.  **Composants de Base**
    *   Boutons (`.btn-primary`, `.btn-ghost`, `.btn-green`, etc.) et modificateurs de taille.
    *   Badges (`.badge-fire`, `.badge-amber`) et Pills de statut (`.pill-active`, `.pill-cooling`).
    *   Système de Cartes (`.card`, `.card-glow`) et indicateurs Live (Point clignotant).
2.  **Formulaires & Modales**
    *   Inputs standards, Selects, Textareas avec états `:focus` et `disabled`.
    *   Composant OTP (6 cases avec auto-focus).
    *   Structure Modale générique avec overlay flouté (`backdrop-filter: blur`).
3.  **Composants Métiers**
    *   Barres de progression pour le Score de Risque.
    *   Items d'Alerte (`.alert-item`) et Source chips pour l'IA.

---

## Phase 3 : Flux d'Authentification & Rôles (Semaine 2)

**Objectif :** Permettre aux utilisateurs de se connecter, s'inscrire et gérer leur profil selon leur rôle.

1.  **Pages d'Accès**
    *   Intégration UI de la Landing Page publique.
    *   Pages `Login` et `Register` (connexion classique).
2.  **Authentification OTP sans mot de passe**
    *   Interface de demande OTP (SMS/Email).
    *   Interface de saisie et validation du code OTP (`POST /auth/otp/verify`).
3.  **Profil & RBAC**
    *   Affichage dynamique du Layout Dashboard selon le rôle (Visiteur, Standard, Premium, Admin).
    *   Page de Profil (`GET /auth/me`, `PUT /auth/me/profile`).

---

## Phase 4 : Core - Cartographie & Visualisation de Données (Semaine 3)

**Objectif :** Afficher les feux en temps réel et les prédictions sur la carte.

1.  **Intégration de la Carte (Google Maps ou Leaflet)**
    *   Configuration du fond de carte sombre.
2.  **Couche Détections & Clusters**
    *   Appel `GET /detections` et affichage des marqueurs avec coloration dynamique (Rouge/Orange/Vert selon le risque).
    *   Appel `GET /clusters` et implémentation des `.cluster-card` cliquables.
3.  **Couche Prédictions (GeoJSON)**
    *   Appel `GET /predictions/risk-map` et rendu de la couche GeoJSON.
    *   Application du dégradé d'opacité/couleur via `map.data.setStyle()` pour illustrer le risque J+1.
4.  **Dashboard Statistiques**
    *   Intégration des `stat-cards` globales.
    *   Graphique temporel historique des détections.

---

## Phase 5 : Fonctionnalités Premium, IA & Alertes (Semaine 4)

**Objectif :** Apporter de la valeur ajoutée avec le Chatbot et la personnalisation de surveillance.

1.  **Système d'Abonnement et d'Alertes**
    *   Interface de gestion des abonnements (`POST /alerts/subscribe`) avec bascules (Toggles) SMS/WhatsApp/Email.
    *   Vue liste de l'historique personnel d'alertes.
2.  **Zones Prioritaires (Premium)**
    *   UI de définition (Dessin sur carte) d'un polygone ou cercle.
    *   Appels `GET /zones/` et `POST /zones/` avec saisie de prompt IA personnalisé.
3.  **Module Chatbot (JeryMotro AI RAG)**
    *   UI des bulles de messages (droite/gauche).
    *   Appel de `POST /chat` avec gestion de l'état "Analyse des données ChromaDB...".
    *   Rendu du Markdown et des sources associées.

---

## Phase 6 : Dashboard Admin & Finalisation (Semaine 5)

**Objectif :** Finaliser les outils d'administration et préparer la livraison.

1.  **Outils Pipeline Administrateur**
    *   Interface pour lancer le process FIRMS (`POST /internal/process-firms`).
    *   Appels itératifs pour le re-calcul des clusters en batch.
    *   Interface de lancement du scoring ML.
2.  **Optimisation et Recette**
    *   Gestion globale des erreurs API (401, 403, 422, 500) et affichage des feedbacks UI (Toast/Notifications).
    *   Vérification fine du mode Clair/Sombre.
    *   Tests de réactivité (Responsive Design) de la carte et du dashboard sur Mobile.
