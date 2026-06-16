# 🚀 Plan de Travail : Intégration Frontend JeryMotro

Ce plan de travail structure l'intégration complète du frontend de JeryMotro, en s'appuyant sur l'API FastAPI (sur `http://35.192.27.164/jerymotro-api`) et le Design System détaillé (mode sombre par défaut, polices Outfit & Space Grotesk).

---

## Statut Global de l'Intégration : 🟢 100% Terminé

Toutes les phases d'intégration ont été complétées avec succès. Le frontend est entièrement connecté à l'API de production en temps réel, toutes les dépendances aux données simulées (mock data) ont été définitivement purgées de l'application, et le build TypeScript compile sans aucune erreur (Exit code 0).

---

## Phase 1 : Fondations Techniques & Architecture (Semaine 1) · ✅ TERMINÉ

**Objectif :** Mettre en place le socle du projet, la gestion du thème et le client HTTP.

1.  **Initialisation du Projet** · ✅
    *   Création de l'application React/Vite en mode Pnpm Workspace.
    *   Configuration du routage : Séparation stricte avec gardes d'authentification (`AuthGuard`) entre les pages publiques et le tableau de bord protégé.
2.  **Intégration du Design System (CSS)** · ✅
    *   Importation des polices Google Fonts : *Outfit* et *Space Grotesk*.
    *   Définition des variables CSS racines pour le Mode Sombre (défaut) et le Mode Clair.
3.  **Client API & Store Global** · ✅
    *   Configuration du proxy Vite pour rediriger `/jerymotro-api` vers l'IP de production `http://35.192.27.164` (résolution définitive des erreurs CORS).
    *   Intercepteurs dans `customFetch` pour l'injection automatique du JWT dans le header `Authorization: Bearer`.
    *   Gestionnaire global 401 via React Query déconnectant automatiquement l'utilisateur et nettoyant le localStorage en cas de session expirée.

---

## Phase 2 : Bibliothèque de Composants UI (Semaine 1-2) · ✅ TERMINÉ

**Objectif :** Coder les composants atomiques réutilisables selon le Design System.

1.  **Composants de Base** · ✅
    *   Boutons, badges de risque et pills de statut animés.
    *   Système de cartes avec effets de lueur (`.card-glow`) et indicateurs d'état en direct.
2.  **Formulaires & Modales** · ✅
    *   Formulaires d'authentification et de profil avec validation Zod.
    *   Structure de dialogue modale générique avec floutage d'arrière-plan.
3.  **Composants Métiers** · ✅
    *   Indicateurs de progression de score de risque et chips de source d'information.

---

## Phase 3 : Flux d'Authentification & Rôles (Semaine 2) · ✅ TERMINÉ

**Objectif :** Permettre aux utilisateurs de se connecter, s'inscrire et gérer leur profil selon leur rôle.

1.  **Pages d'Accès** · ✅
    *   Intégration de la Landing page, Login et Register avec gestion d'erreurs en temps réel.
2.  **Authentification OTP sans mot de passe** · ✅
    *   Vérification et validation de l'OTP via `POST /auth/otp/verify`.
3.  **Profil & RBAC** · ✅
    *   Affichage dynamique et protection des routes/actions selon le rôle (Standard, Premium, Admin).

---

## Phase 4 : Core - Cartographie & Visualisation de Données (Semaine 3) · ✅ TERMINÉ

**Objectif :** Afficher les feux en temps réel et les prédictions sur la carte.

1.  **Intégration de la Carte (Leaflet)** · ✅
    *   Carte interactive Leaflet en mode sombre avec marqueurs géographiques.
2.  **Couche Détections & Clusters** · ✅
    *   Affichage des détections réelles avec coloration dynamique selon le score de risque (Rouge, Orange, Vert).
    *   Remplacement total des données de démo par les flux API en temps réel.
3.  **Couche Prédictions (GeoJSON)** · ✅
    *   Intégration de la carte de prédiction des risques à J+1.
4.  **Dashboard Statistiques** · ✅
    *   Statistiques globales et graphiques interactifs (Recharts) basés sur l'API `/stats/daily`.

---

## Phase 5 : Fonctionnalités Premium, IA & Alertes (Semaine 4) · ✅ TERMINÉ

**Objectif :** Apporter de la valeur ajoutée avec le Chatbot et la personnalisation de surveillance.

1.  **Système d'Abonnement et d'Alertes** · ✅
    *   Gestion des alertes multicanaux (Email, WhatsApp, SMS) via l'API.
2.  **Zones Prioritaires (Premium)** · ✅
    *   Définition et enregistrement des zones d'intérêt utilisateur personnalisées.
3.  **Module Chatbot (JeryMotro AI RAG)** · ✅
    *   Assistant conversationnel intelligent connecté à `POST /chat` avec sources d'informations réelles.

---

## Phase 6 : Dashboard Admin & Finalisation (Semaine 5) · ✅ TERMINÉ

**Objectif :** Finaliser les outils d'administration et préparer la livraison.

1.  **Outils Pipeline Administrateur** · ✅
    *   Déclenchement des tâches internes de collecte FIRMS, de reconstruction de clusters et de scoring ML.
2.  **Nettoyage & Production Ready** · ✅
    *   Suppression complète de `mock-data.ts` et `use-api-with-mock.tsx`.
    *   Mise en place de fallbacks et d'indicateurs de chargement (Spinners) natifs.
    *   Validation complète du build TypeScript (Zéro erreur, Exit code 0).
