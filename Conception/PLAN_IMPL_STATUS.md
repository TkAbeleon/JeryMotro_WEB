# Plan d'Implémentation — Backend JeryMotro

> Dernière mise à jour : 03 Juin 2026 · Cycle de développement : Sprint 03
> Statut Infrastructure : Base de données PostgreSQL en production, intégration des flux de données en cours.

---

## 📋 Légende des Statuts

| Symbole | Signification |
| :--- | :--- |
| ✅ | Terminé et validé |
| 🔄 | En cours de développement ou d'intégration |
| ⬜ | Planifié |
| 🔗 | Dépend du chargement des données historiques |

---

## 1. Architecture et Fondations

| Jalon / Tâche | Statut | Notes |
| :--- | :--- | :--- |
| Spécifications fonctionnelles et techniques | ✅ | Validées sous `Conception/*.md` |
| Couche de persistance async (`database.py`) | ✅ | Support PostgreSQL & SQLite (tests) |
| Migrations de schéma (Alembic 001 à 004) | ✅ | Initialisation des tables de détection et événements |
| Définition des modèles ORM (SQLAlchemy) | ✅ | Modélisation des entités clés (8 tables) |
| Système d'authentification JWT & OTP | ✅ | Gestion des accès et abonnements Premium |
| Fichiers de configuration & Dépendances | ✅ | Initialisation de l'environnement |

---

## 2. Intégration et Traitement des Données Historiques

| Jalon / Tâche | Statut | Notes |
| :--- | :--- | :--- |
| Analyse exploratoire du jeu de données | ✅ | Évaluation de 3.6M de détections (2020–2026) |
| Documentation des formats de données | ✅ | Rédigée sous `scripts/DATASET_FIRMS_MADA.md` |
| Développement du script d'importation | ✅ | Import résilient des données historiques (limites & index) |
| Script de vérification de base de données | ✅ | Validation de la cohérence après chargement |
| **Chargement initial de la base** | ✅ | **2.4M de détections historiques chargées** |
| Validation de l'API de consultation (`GET /detections/meta`) | ✅ | Testé et approuvé |

---

## 3. Schémas et Services Métier

| Composant | Statut | Fichier |
| :--- | :--- | :--- |
| Schémas d'API (Pydantic v2) | ✅ | Définis sous `api/schemas/` |
| Client d'intégration ML (`jerymotronet_service`) | ✅ | Service résilient avec fallback en cas de panne ML |
| Connecteur NASA FIRMS (`firms_service`) | ✅ | Récupération des flux temps réel |
| Système d'alertes (`alert_service`) | ✅ | Dispatch SMTP / Twilio / WhatsApp (WAHA) |
| Service d'assistance conversationnelle (`rag_service`) | ✅ | n8n / Qdrant RAG Connector |
| Module de cycle de vie des feux | ✅ | États : ACTIVE / COOLING / LIKELY_OUT |
| Algorithme de clustering | ✅ | Regroupement spatial et temporel |

---

## 4. Points d'Entrée API (Routers)

| Route / Ressource | Statut | Dépendance de données |
| :--- | :--- | :--- |
| `/auth/*` | ✅ | Aucune |
| `/zones/*` | ✅ | Aucune |
| `/detections/*` | ✅ | Requiert données de détections |
| `/clusters/*` | ✅ | Requiert traitement de clustering |
| `/predictions/*` | ✅ | Requiert modèle ML actif |
| `/chat` | ✅ | Aucune (RAG optionnel) |
| `/alerts/*` | ✅ | Aucune |
| `/internal/process-firms` | ✅ | Tâche planifiée interne |
| `/internal/rebuild-clusters` | ✅ | Batch de calcul de clusters |

---

## 5. Pipeline d'Analyse et de Machine Learning

| Tâche | Statut | Description |
| :--- | :--- | :--- |
| Évaluation du score de risque (Scoring ML) | ✅ | Intégration du modèle XGBoost |
| Clustering spatial via HDBSCAN | ✅ | Regroupement automatique des foyers actifs |
| Agrégation historique des événements | ✅ | Création de la table `fire_events` |
| Modèle de prédiction spatio-temporel | ⬜ | Déploiement du modèle de prédiction ConvLSTM |
| Moteur conversationnel RAG | ✅ | Intégration de l'agent d'analyse IA avec Qdrant |
| Déclenchement automatique des alertes | ✅ | Routage selon les seuils configurés |

---

## 6. Tests et Assurance Qualité

| Module de Test | Statut | Cible |
| :--- | :--- | :--- |
| Environnement de test en mémoire (SQLite) | ✅ | `conftest.py` |
| Validation des algorithmes et états | ✅ | Test statut feux & clustering |
| Validation du module d'authentification | ✅ | Tests de sécurité JWT & OTP |
| Validation des endpoints de détections | ⬜ | Test des filtres de recherche temporelle |
| Validation des clusters | ⬜ | Test des agrégations spatiales |
| Validation du module d'alerte | ✅ | Test d'envoi SMTP & Twilio |

---

## 7. Jalons de Livraison et Documentation

| Jalons | Statut | Notes |
| :--- | :--- | :--- |
| Validation Swagger / OpenAPI | ✅ | Contrat d'interface 100% conforme |
| Seuil de couverture de tests (pytest >= 60%) | ✅ | Tests unitaires principaux validés |
| Documentation d'architecture | ✅ | Mise à jour des guides d'intégration |

---

## Prochaines étapes

1. **Intégration du Modèle de Prédiction** : Finaliser le déploiement de l'API de prédiction ConvLSTM.
2. **Optimisation des alertes** : Finaliser le système de filtrage géographique des alertes WhatsApp pour éviter le spam.
3. **Couverture des tests** : Augmenter la couverture globale des tests sur les contrôleurs de données (Auth, Detections, Alertes) avec Pytest.
4. **Finalisation du projet** : Consolidation du rapport technique, des guides d'utilisation et de la démonstration fonctionnelle.
