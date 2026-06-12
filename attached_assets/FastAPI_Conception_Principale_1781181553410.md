# 🏗️ Conception FastAPI — JeryMotro Platform

#FastAPI #Architecture #Backend #API

---

## 📋 SOMMAIRE

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Stack technologique](#stack-technologique)
4. [Structure du projet](#structure-du-projet)
5. [Flux de données](#flux-de-données)
6. [Sécurité et configuration](#sécurité-et-configuration)

---

## 1. VUE D'ENSEMBLE

### 1.1 Rôle de FastAPI dans l'écosystème

FastAPI constitue le **cœur névralgique** de la plateforme JeryMotro, agissant comme :

```mermaid
graph TB
    A[FIRMS API + Background Tasks] -->|Données brutes| B[FastAPI Backend]
    B -->|Inférence| C[JeryMotroNet ML/DL]
    B -->|Stockage| D[PostgreSQL]
    B -->|RAG| E[ChromaDB + Vertex AI (Gemini)]
    B -->|Alertes| F[Email + Twilio]
    B -->|API REST| G[Frontend (Google Maps)]
```

**Responsabilités principales :**

- ✅ Exposition des endpoints REST (détections, prédictions, clusters, alertes, chat)
- ✅ Orchestration de l'inférence ML/DL (XGBoost + ConvLSTM)
- ✅ Gestion de la persistance des données (PostgreSQL)
- ✅ Interface avec l'IA générative (RAG via Vertex AI + ChromaDB)
- ✅ Déclenchement du système d'alertes multi-canal
- ✅ Documentation automatique (Swagger UI + ReDoc)

### 1.3 Rôles utilisateurs

| Rôle         | Qui                               | Accès                                                                                                                                                   |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visiteur** | Non authentifié                   | Lecture seule : détections, clusters, carte risque J+1 (Google Maps), chat IA                                                                           |
| **Standard** | Compte gratuit                    | + Alertes email · Historique personnel                                                                                                                  |
| **Premium**  | ONG, aire protégée, parc national | + Alertes WhatsApp + SMS · Export données · **Sélection de zones prioritaires (Google Maps), alertes personnalisées de zones et agent IA personnalisé** |

> Référence complète : `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md`

### 1.2 Choix de FastAPI

| Critère                      | FastAPI                       | Flask                     | Django                |
| ---------------------------- | ----------------------------- | ------------------------- | --------------------- |
| **Performance async**        | ✅ Natif async/await          | 🟡 Avec extensions        | 🟡 Avec channels      |
| **Swagger auto**             | ✅ Généré automatiquement     | ❌ Manuel (flask-swagger) | 🟡 drf-spectacular    |
| **Validation Pydantic**      | ✅ Natif                      | ❌ Manuel                 | ❌ Serializers Django |
| **Type hints**               | ✅ Obligatoires → typage fort | ❌ Optionnels             | ❌ Optionnels         |
| **Courbe d'apprentissage**   | ✅ Simple + moderne           | ✅ Simple                 | 🟡 Lourd (ORM, admin) |
| **Vitesse de développement** | ✅ Très rapide                | 🟡 Moyen                  | 🟡 Lent (boilerplate) |

**Verdict :** FastAPI est optimal pour un projet L3 nécessitant performance, documentation auto, et intégration ML/DL.

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Pattern architectural : Layered Architecture

```
┌─────────────────────────────────────────┐
│         ROUTERS (Couche Présentation)    │  ← Endpoints HTTP
├─────────────────────────────────────────┤
│         SCHEMAS (Validation I/O)         │  ← Pydantic models
├─────────────────────────────────────────┤
│         SERVICES (Logique métier)        │  ← Business logic
├─────────────────────────────────────────┤
│         MODELS (Couche Données)          │  ← SQLAlchemy ORM
├─────────────────────────────────────────┤
│         DATABASE (PostgreSQL)            │  ← Persistence
└─────────────────────────────────────────┘
```

**Avantages :**

- Séparation claire des responsabilités
- Testabilité élevée (mocking par couche)
- Évolutivité (ajout de features sans refactor global)
- Maintenabilité (chaque couche a un rôle défini)

### 2.2 Architecture de déploiement (Docker)

```yaml
Services Docker:
├── madfire-db          (PostgreSQL 15)      port 5432
├── madfire-chromadb    (ChromaDB)           port 8001
├── madfire-api         (FastAPI)            port 8000
└── madfire-frontend    (React)              port 3000

Réseau: madfire-network (bridge interne)
```

**Communication inter-services :**

- FastAPI → PostgreSQL : `postgresql://madfire-db:5432/madfire`
- FastAPI → ChromaDB : `http://madfire-chromadb:8000`
- Frontend → FastAPI : `http://madfire-api:8000` (via CORS)

---

## 3. STACK TECHNOLOGIQUE

### 3.1 Dépendances principales

```bash
# Framework web
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
python-multipart

# Base de données
sqlalchemy>=2.0.27         # ORM async
alembic>=1.13.1            # Migrations
asyncpg>=0.29.0            # Driver PostgreSQL async
aiosqlite>=0.20.0          # Driver SQLite async (dev)

# Validation et configuration
pydantic>=2.6.0
pydantic-settings>=2.2.0

# Authentification
passlib[bcrypt]
PyJWT>=2.8.0

# HTTP Client (appels ML ext, FIRMS, GEE)
httpx>=0.27.0

# Google Cloud / Vertex AI (RAG + Gemini)
google-cloud-aiplatform>=1.51.0
google-auth>=2.29.0

# Base vectorielle RAG
chromadb>=0.4.24

# Traitement données (FIRMS pipeline)
pandas>=2.2.0
numpy>=1.26.0

# Alertes
twilio>=9.0.0

# Tests
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

> **Note sur les modèles ML :** XGBoost, ConvLSTM et tout modèle ML sont des **microservices externes**. Le backend JeryMotro les appelle via HTTP grâce à `httpx`. Aucune lib ML (scikit-learn, torch, xgboost) n'est requise dans ce service.

### 3.2 Variables d'environnement (.env)

```bash
# ─── Base de données ──────────────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///./jerymotro.db   # dev
# DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db  # prod

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET=changeme-secret
JWT_EXPIRE_MINUTES=60

# ─── Vertex AI / GCP ─────────────────────────────────────────
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
VERTEX_AI_MODEL=gemini-1.5-flash

# ─── Service ML Externe ───────────────────────────────────────
ML_SERVICE_URL=http://localhost:9000
ML_SERVICE_API_KEY=
ML_ACTIVE_MODEL=xgboost-v1    # xgboost-v1 | convlstm-v1 | ensemble-v1 | vertex-ai-ep
ML_TIMEOUT_SECONDS=30

# ─── ChromaDB ────────────────────────────────────────────────
CHROMADB_HOST=localhost
CHROMADB_PORT=8001

# ─── NASA FIRMS ──────────────────────────────────────────────
FIRMS_MAP_KEY=your_firms_map_key
NASA_EARTHDATA_TOKEN=your_token
FIRMS_BBOX=43.2,-25.6,50.5,-11.9

# ─── Google Earth Engine ─────────────────────────────────────
GEE_SERVICE_ACCOUNT=sa@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/path/to/gee-credentials.json

# ─── Alertes WhatsApp & SMS ──────────────────────────────────
WHATSAPP_PROVIDER=meta          # 'meta' ou 'twilio'

# Config Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+1234567890

# Config Meta (WhatsApp Cloud API)
META_WHATSAPP_TOKEN=EAAB...
META_WHATSAPP_PHONE_NUMBER_ID=123456789
META_WHATSAPP_VERSION=v19.0

# ─── Email SMTP ───────────────────────────────────────────────
EMAIL_USER=your_gmail_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=alertes@jerymotro.app
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

# ─── Google Maps ──────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=AIzaSy...
```

> 📄 Référence complète : `api/.env.example`

---

## 4. STRUCTURE DU PROJET

```
api/
├── main.py                          # ⭐ Point d'entrée FastAPI
├── database.py                      # Configuration SQLAlchemy async
├── config.py                        # Settings (Pydantic BaseSettings)
│
├── routers/                         # 🔌 Endpoints REST par domaine
│   ├── __init__.py
│   ├── detections.py                # GET /detections
│   ├── predictions.py               # GET /predictions, /risk-map
│   ├── clusters.py                  # GET /clusters
│   ├── alerts.py                    # GET /alerts, POST /alerts/trigger
│   ├── chat.py                      # POST /chat (RAG)
│   └── zones.py                     # GET /zones, POST /zones (Premium)
│
├── models/                          # 🗃️ SQLAlchemy ORM (tables BDD)
│   ├── __init__.py
│   ├── detection.py                 # Table: detections
│   ├── prediction.py                # Table: predictions
│   ├── cluster.py                   # Table: clusters
│   ├── alert.py                     # Table: alerts
│   └── zone.py                      # Table: monitored_zones (Premium)
│
├── schemas/                         # ✅ Pydantic (validation I/O)
│   ├── __init__.py
│   ├── detection.py                 # DetectionResponse, DetectionQuery
│   ├── prediction.py                # PredictionResponse
│   ├── cluster.py                   # ClusterResponse
│   ├── alert.py                     # AlertResponse, AlertCreate
│   ├── chat.py                      # ChatRequest, ChatResponse
│   └── zone.py                      # ZoneResponse, ZoneCreate (Premium)
│
├── services/                        # 🧠 Logique métier
│   ├── jerymotronet_service.py      # Inférence XGBoost + ConvLSTM
│   ├── rag_service.py               # ChromaDB + Vertex AI RAG
│   ├── alert_service.py             # Email + Twilio + ImgBB
│   ├── firms_service.py             # Collecte FIRMS API
│   └── gee_service.py               # Enrichissement Google Earth Engine
│
├── utils/                           # 🛠️ Helpers
│   ├── logger.py                    # Configuration logging
│   ├── exceptions.py                # Exceptions métier custom
│   └── security.py                  # (Futur) JWT si authentification
│
├── alembic/                         # 🔄 Migrations BDD
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
│
├── tests/                           # 🧪 Tests unitaires
│   ├── conftest.py                  # Fixtures pytest
│   ├── test_detections.py
│   ├── test_predictions.py
│   ├── test_chat.py
│   └── test_alerts.py
│
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## 5. FLUX DE DONNÉES

### 5.1 Pipeline de collecte → stockage (Background Tasks / Scheduler 30 min)

```mermaid
sequenceDiagram
    participant N as FastAPI BackgroundTask / Cron
    participant F as FastAPI
    participant G as GEE Service
    participant M as JeryMotroNet
    participant D as PostgreSQL
    participant C as ChromaDB
    participant A as Alert Service

    N->>F: Déclenchement automatique /internal/process-firms
    F->>F: Fetch FIRMS CSV
    F->>F: Clean + Feature Engineering
    F->>G: Enrichir contexte (ERA5, Landcover, NDVI)
    G-->>F: Features complétées
    F->>F: HDBSCAN Clustering
    F->>M: Inférence XGBoost + ConvLSTM
    M-->>F: risk_score, predictions
    F->>D: INSERT detections, predictions, clusters
    F->>C: Embed résultats (pour RAG)
    F->>A: Vérifier seuils alertes
    A-->>F: Alertes envoyées
    F-->>N: Status 200 OK
```

### 5.2 Requête frontend → API → BDD

```mermaid
sequenceDiagram
    participant U as Frontend (React)
    participant R as Router (FastAPI)
    participant S as Service Layer
    participant D as Database (PostgreSQL)

    U->>R: GET /detections?date=2026-03-30&min_risk=0.5
    R->>R: Validation Pydantic (DetectionQuery)
    R->>S: Appel service.get_detections()
    S->>D: SELECT * FROM detections WHERE...
    D-->>S: Résultats SQL
    S-->>R: Liste[Detection]
    R->>R: Sérialisation Pydantic (DetectionResponse)
    R-->>U: JSON Response
```

### 5.3 Chat JeryMotro AI (RAG)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as FastAPI /chat
    participant C as ChromaDB
    participant V as Vertex AI (Gemini)

    U->>F: POST /chat {"message": "Quelle zone est touchée?"}
    F->>C: Query top 5 documents similaires
    C-->>F: Contexte pertinent
    F->>V: Prompt = System + Contexte + Question
    V-->>F: Réponse limitée aux données
    F-->>U: {"response": "...", "sources": [...]}
```

---

## 6. SÉCURITÉ ET CONFIGURATION

### 6.1 CORS (Cross-Origin Resource Sharing)

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Dev React local
        "https://jerymotro.vercel.app"     # Prod Frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.2 Rate Limiting (Futur)

```python
# Pour éviter l'abus de l'API (notamment /chat → Vertex AI coûteux)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/chat")
@limiter.limit("10/minute")  # Max 10 requêtes/min par IP
async def chat_endpoint():
    ...
```

### 6.3 Gestion des secrets

**❌ JAMAIS :**

- Hardcoder les clés API dans le code
- Commiter le fichier `.env` dans Git

**✅ TOUJOURS :**

- Utiliser `pydantic-settings` pour charger depuis `.env`
- Ajouter `.env` dans `.gitignore`
- Fournir `.env.example` sans valeurs sensibles

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    groq_api_key: str
    firms_map_key: str

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### 6.4 Authentification OTP & vérification téléphone (Orange SMS)

Résumé : Pour les utilisateurs qui ne souhaitent pas utiliser OAuth2 Google, le backend propose un flux OTP (code à 6 chiffres) envoyé par SMS ou email. L'envoi SMS utilise l'API Orange OneAPI (optionnel, activable via les variables d'environnement).

Principes :

- `POST /auth/otp/request` : génère un OTP (configurable via `OTP_LENGTH` et `OTP_EXPIRY_SECONDS`) et le stocke haché en base.
- `POST /auth/otp/verify` : vérifie le code, marque `phone_verified = true` si vérification par SMS réussie et retourne un JWT interne.
- SMS : l'appel externe à Orange est encapsulé et contrôlé par `ORANGE_SMS_ENABLED` et `ORANGE_SMS_BASE_URL`.
- Sécurité : les OTP sont stockés hachés (`sha256(otp|email)`) et expirent après `OTP_EXPIRY_SECONDS`. Après `OTP_ALLOWED_ATTEMPTS` échecs, le OTP est invalidé.

Conséquences métiers :

- L'option SMS est _optionnelle_ pour la distribution des OTP. Les fonctionnalités Premium SMS/WhatsApp ne seront autorisées pour un utilisateur que si `phone_verified` est `true`.
- OTP est requis comme méthode d'authentification alternative si l'utilisateur n'utilise pas Google OAuth.

Déploiement / Migration:

- Mettez `DATABASE_URL` dans votre fichier `.env` (voir `.env.example`). Exemple (remplacez `<YOUR_PASSWORD>`):

  `DATABASE_URL=postgresql://jerymotro:<YOUR_PASSWORD>@metal-mammal-27259.j77.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full`

- Pour créer les colonnes OTP en base, deux options :
  1. Si vous utilisez Alembic correctement configuré, appliquez la révision `002_add_otp_fields`.
  2. Sinon, exécutez le script idempotent `scripts/apply_migrations.py` :

```bash
python scripts/apply_migrations.py
```

    Ce script exécute des `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pour ajouter les champs : `phone_verified`, `otp_code_hash`, `otp_expires_at`, `otp_attempts`.

## 📚 DOCUMENTS ASSOCIÉS

| Document                        | Description                                   | Statut      |
| ------------------------------- | --------------------------------------------- | ----------- |
| **FastAPI_Contrats_API.md**     | Spécification détaillée de tous les endpoints | ✅ Existant |
| **FastAPI_Modeles_BDD.md**      | Schémas SQLAlchemy + 3 rôles utilisateurs     | ✅ Créé     |
| **FastAPI_Schemas_Pydantic.md** | Modèles de validation I/O Pydantic            | ✅ Créé     |
| **FastAPI_Services_Metier.md**  | Logique métier (ML/DL, RAG, Alertes, Auth)    | ✅ Créé     |
| **FastAPI_Tests_Unitaires.md**  | Stratégie de tests pytest + couverture        | ✅ Créé     |

### Fichiers Obsidian de référence

| Fichier Obsidian                                     | Lien avec la conception                    |
| ---------------------------------------------------- | ------------------------------------------ |
| `obsidian/09_FastAPI_Backend.md`                     | Architecture FastAPI                       |
| `obsidian/12_Systeme_Alertes.md`                     | Matrice alertes (LOW/MEDIUM/HIGH/CRITICAL) |
| `obsidian/17_Fonctionnalite_Statut_Feu.md`           | Logique ACTIVE/COOLING/LIKELY_OUT/UNKNOWN  |
| `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md` | Politique accès par rôle                   |
| `obsidian/20_UML_JeryMotro_Platform.md`              | Diagrammes UML complets                    |

---

**Date de dernière mise à jour :** Mai 2026  
**Version :** 2.3 — Ajout rôles Visiteur/Standard/Premium + fichiers conception complets  
**Auteur :** Documentation JeryMotro Platform
