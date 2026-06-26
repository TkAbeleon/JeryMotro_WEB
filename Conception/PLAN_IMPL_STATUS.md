# Plan d’implémentation — JeryMotro Backend

> Mis à jour : 03/06/2026 · Sprint 03–13 juin  
> DB en ligne (PostgreSQL) · Python local (sans venv) · Données HF en cours d’import

---

## Légende

| Symbole | Signification                |
| ------- | ---------------------------- |
| ✅       | Terminé                      |
| 🔄       | En cours (toi / import long) |
| ⬜       | À faire                      |
| 🔗       | Dépend de l’import Parquet   |

---

## 1. Fondations

| Tâche                               | Statut | Notes                                     |
| ----------------------------------- | ------ | ----------------------------------------- |
| Conception (5 docs)                 | ✅      | `conception/*.md`                         |
| `database.py` async Postgres/SQLite | ✅      |                                           |
| Alembic 001→004                     | ✅      | `firms_fire_detections`, `fire_events`, … |
| Models SQLAlchemy complets          | ✅      | 8 tables                                  |
| Auth JWT + OTP + zones Premium      | ✅      |                                           |
| `.env` / `requirements.txt`         | ✅      |                                           |

---

## 2. Import données réelles (HF)

| Tâche                                         | Statut | Notes                                  |
| --------------------------------------------- | ------ | -------------------------------------- |
| Analyse `Analyse.ipynb`                       | ✅      | 3,6M lignes, 33 cols, 2020–2026        |
| Doc structure `scripts/DATASET_FRIMS_MADA.md` | ✅      |                                        |
| Script `scripts/import_firms_parquet.py`      | ✅      | `--inspect`, `--limit`, import complet |
| Script `scripts/verify_db.py`                 | ✅      | Compte lignes après import             |
| **Import complet en base**                    | ✅      | **Données historiques OK (2.4M lignes uniques)** |
| Vérifier `GET /detections/meta`               | ✅      | Validé lors du test_jerymotro.sh       |

**Commandes (manuel) :**
```bash
cd Backend
python3 scripts/import_firms_parquet.py --limit 5000   # test
python3 scripts/import_firms_parquet.py               # complet
python3 scripts/verify_db.py
```

---

## 3. Schémas & services (sans données)

| Tâche                                            | Statut | Fichier                       |
| ------------------------------------------------ | ------ | ----------------------------- |
| Schémas detection / cluster / prediction / alert | ✅      | `api/schemas/`                |
| `jerymotronet_service` (client ML HTTP)          | ✅      | mode dégradé si ML down       |
| `firms_service` (fetch NASA CSV)                 | ✅      |                               |
| `alert_service` (SMTP / Twilio)                  | ✅      |                               |
| `rag_service` (RAG géré en externe via n8n)          | ✅      |                               |
| `fire_status_service`                            | ✅      | ACTIVE / COOLING / LIKELY_OUT |
| `cluster_service` (agrégation clusters)          | ✅      | pour job post-import          |
| `config` pydantic-settings                       | ✅      |                               |

---

## 4. Routers API

| Route                                           | Statut | Dépend import         |
| ----------------------------------------------- | ------ | --------------------- |
| `/auth/*`                                       | ✅      | Non                   |
| `/zones/*`                                      | ✅      | Non                   |
| `/detections`, `/{id}`, `/stats/daily`, `/meta` | ✅      | Liste 🔗 données       |
| `/clusters/*`                                   | ✅      | 🔗                     |
| `/predictions/latest`, `/risk-map`              | ✅      | 🔗                     |
| `/chat`                                         | ✅      | Non (RAG optionnel)   |
| `/alerts/*`                                     | ✅      | Non                   |
| `/internal/process-firms`                       | ✅      | Log `collection_runs` |
| `/internal/rebuild-clusters`                    | ✅      | Limité (batchs de 50k) pour la prod |

---

## 5. Pipeline post-import 🔗

| Tâche                                    | Statut | Description                                  |
| ---------------------------------------- | ------ | -------------------------------------------- |
| Scoring ML (`risk_score` / `fire_label`) | ✅      | `POST /internal/run-scoring`                 |
| Clustering HDBSCAN → `cluster_id`        | ✅      | `cluster_service.perform_hdbscan_clustering` |
| Agrégation → `fire_events`               | ✅      | `POST /internal/rebuild-clusters`            |
| ConvLSTM → table `predictions`           | ⬜      | Service ML `/predict-grid`                   |
| RAG Chatbot (Externalisé vers n8n)       | ✅      | RAG backend (ChromaDB) décommissionné        |
| Alertes auto sur seuils                  | ✅      | `alert_service.route_alert`                  |

---

## 6. Tests (≥ 60 % mémoire)

| Tâche                                                              | Statut | Fichier |
| ------------------------------------------------------------------ | ------ | ------- |
| `conftest.py` (SQLite mémoire)                                     | ✅      |         |
| `test_fire_status.py`, `test_cluster_service.py`, `test_health.py` | ✅      |         |
| `test_auth.py`                                                     | ✅      |         |
| `test_detections.py`                                               | ⬜ 🔗    |         |
| `test_clusters.py`                                                 | ⬜ 🔗    |         |
| `test_chat.py` (via webhook n8n)                                   | ⬜      |         |
| `test_alerts.py`                                                   | ✅      |         |
| `test_zones.py`                                                    | ✅      |         |
| `test_user_seeds.py`                                               | ✅      |         |

---

## 7. Livrables mémoire / soutenance

| Livrable                | Date     | Statut |
| ----------------------- | -------- | ------ |
| Backend Swagger complet | 06/06    | ✅      |
| Tests pytest ≥ 60 %     | 08/06    | ⬜      |
| Mémoire PDF             | 09/06    | ⬜      |
| Slides + démo vidéo     | 10–11/06 | ⬜      |

---

## Fichiers clés créés récemment

```
api/models/detection.py          # FirmsFireDetection
api/models/cluster.py            # FireEvent
api/alembic/versions/004_*.py
scripts/import_firms_parquet.py
scripts/verify_db.py
scripts/DATASET_FRIMS_MADA.md
conception/PLAN_IMPL_STATUS.md   # ce fichier
```

---

## Prochaines actions (ordre recommandé)

1. **Prédictions Spatiales** : Mettre en service le modèle ConvLSTM (table `predictions`) via l'endpoint `/predict-grid`.
2. **Alertes Automatisées** : Finaliser le routage et l'envoi des alertes (`alert_service.route_alert`).
3. **Tests unitaires (QA)** : Rédiger les tests complets (Auth, Detections, Alertes) avec Pytest pour atteindre la couverture ≥ 60%.
4. **Livrables Académiques** : Finalisation du mémoire PDF, création des slides et préparation de la vidéo de démonstration.
