# 🌋 

# eryMotro Backend — Plateforme de Détection des Feux de Brousse

**Plan d’avancement :** [conception/PLAN_IMPL_STATUS.md](conception/PLAN_IMPL_STATUS.md)

Le backend de **JeryMotro** est une API REST asynchrone construite avec **FastAPI**. Il orchestre la collecte de données satellite (NASA FIRMS), l'enrichissement via Google Earth Engine, l'inférence par des **microservices ML externes** (XGBoost / ConvLSTM), le chat IA via **Vertex AI (Gemini)**, et la diffusion d'alertes multi-canal (Email / WhatsApp / SMS).

---

## 🛠️ Stack Technologique

| Composant               | Technologie                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **API**                 | FastAPI (Python 3.10+)                                             |
| **Base de données**     | PostgreSQL (prod) · SQLite (dev)                                   |
| **ORM & Migrations**    | SQLAlchemy 2.0 async + Alembic                                     |
| **IA Générative / RAG** | Vertex AI (Gemini 1.5 Flash) + ChromaDB                            |
| **ML externe**          | Microservice HTTP configurable (XGBoost / ConvLSTM / Vertex AI EP) |
| **Carte**               | Google Maps (frontend)                                             |
| **Alertes**             | Twilio (WhatsApp / SMS) + SMTP (Email)                             |

---

## 📂 Structure du Projet

```bash
api/
├── main.py              # Point d'entrée FastAPI
├── database.py          # Configuration SQLAlchemy asynchrone
├── config.py            # Variables d'environnement (Pydantic Settings)
├── dependencies.py      # Sécurité (JWT, rôles Premium/Admin)
├── .env.example         # ← Modèle de configuration complet
├── models/              # Tables SQLAlchemy (User, MonitoredZone, Alert...)
├── schemas/             # Validation Pydantic (request/response)
├── routers/             # Endpoints REST (auth, zones, detections, chat...)
└── services/            # Logique métier (ML, RAG, Alertes, FIRMS...)
```

---

## ⚙️ Installation

### 1. Installation via le script local

```bash
cd /home/tsiky-ny-antsa/Project/JeryMotro/Backend
chmod +x install.sh
./install.sh
```

Le script crée un virtualenv dans `.venv`, installe les dépendances depuis `api/requirements.txt`, et copie `.env.example` vers `.env` si nécessaire.

### 2. Configurer l'environnement

```bash
cp .env.example .env
# Éditez .env avec vos valeurs
```

### 3. Lancer l'API (Développement)

```bash
source .venv/bin/activate
python run_server.py
# Ou avec reload en mode dev:
uvicorn api.main:app --reload --host 0.0.0.0 --port 8200
```

### 4. Lancer avec PM2 (Production)

```bash
pm2 start ecosystem.config.js
pm2 logs jerymotro-backend
pm2 save  # Persister au redémarrage
```

---

## 🌍 Déploiement Production

### Accès à l'API

| Environnement            | URL                                           | Documentation                             |
| ------------------------ | --------------------------------------------- | ----------------------------------------- |
| **Local Dev**            | `http://localhost:8200`                       | `http://localhost:8200/docs`              |
| **Production (IP)**      | `http://35.192.27.164/jerymotro-api`          | `http://35.192.27.164/jerymotro-api/docs` |
| **Production (Domaine)** | `https://jerymotro-api.duckdns.org` (à venir) | `/docs`                                   |

### Configuration Nginx sur serveur distant

JeryMotro Backend expose l'API via Nginx reverse proxy sur port 80 (partagé avec StreamMG).

**Fichiers de configuration :**

- `nginx_streammg_modified.conf` - Config serveur principal (inclut JeryMotro)
- `nginx_jerymotro_location.conf` - Location block JeryMotro (documenté)

**Déploiement sur serveur :**

```bash
# Sur le serveur de production
cd ~/Tsiky_Project/JeryMotroBackend/Backend

# 1. Pull le code
git pull origin develop

# 2. Copier config Nginx (incluse dans le repo)
sudo cp nginx_streammg_modified.conf /etc/nginx/sites-available/streammg

# 3. Recharger Nginx
sudo nginx -t && sudo systemctl reload nginx

# 4. Vérifier PM2 est lancé
pm2 list
# Doit montrer 'jerymotro-backend' online
```

### Vérification du déploiement

```bash
# Test API health
curl http://35.192.27.164/jerymotro-api/health
# Réponse attendue: {"status":"ok","message":"JeryMotro API is running"}

# Test Swagger UI
curl http://35.192.27.164/jerymotro-api/docs
# Retourne la page HTML du Swagger UI

# Test OpenAPI JSON
curl http://35.192.27.164/jerymotro-api/openapi.json
```

### Architecture asyncpg PostgreSQL

⚠️ **Important** : Le Backend utilise **asyncpg** avec PostgreSQL. La conversion URL PostgreSQL est automatique:

- `postgresql://` → `postgresql+asyncpg://`
- `sslmode` PostgreSQL → `ssl` asyncpg (conversion automatique)
- Variables d'env `PGSSLMODE` supprimées pour éviter conflits

Voir [api/database.py](api/database.py) pour les détails.

---

## 🔑 Variables d'environnement (`.env`)

```bash
# ─── Base de données ──────────────────────────────────────────
# Développement (SQLite)
DATABASE_URL=sqlite+aiosqlite:///./jerymotro.db
# Production (PostgreSQL)
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/jerymotro_db

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET=changeme-secret
JWT_EXPIRE_MINUTES=60

# ─── Google Cloud / Vertex AI (RAG + Gemini) ─────────────────
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
VERTEX_AI_MODEL=gemini-1.5-flash

# ─── Service ML Externe (XGBoost / ConvLSTM / Vertex AI EP) ──
# ⚡ Changer seulement cette URL pour changer de modèle !
ML_SERVICE_URL=http://localhost:9000
ML_SERVICE_API_KEY=
ML_ACTIVE_MODEL=xgboost-v1     # xgboost-v1 | convlstm-v1 | ensemble-v1 | vertex-ai-ep
ML_TIMEOUT_SECONDS=30

# ─── ChromaDB ────────────────────────────────────────────────
CHROMADB_HOST=localhost
CHROMADB_PORT=8001

# ─── NASA FIRMS ──────────────────────────────────────────────
FIRMS_MAP_KEY=your_nasa_firms_map_key
NASA_EARTHDATA_TOKEN=your_earthdata_token
FIRMS_BBOX=43.2,-25.6,50.5,-11.9

# ─── Google Earth Engine ─────────────────────────────────────
GEE_SERVICE_ACCOUNT=your-sa@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/path/to/gee-credentials.json

# ─── Twilio (WhatsApp / SMS) ──────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+1234567890

# ─── Email (SMTP) ─────────────────────────────────────────────
ALERT_EMAIL_FROM=alertes@jerymotro.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_PASSWORD=your_app_password

# ─── Google Maps (frontend) ────────────────────────────────────
GOOGLE_MAPS_API_KEY=AIzaSy...

# ─── Config générale ──────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
APP_ENV=development
SQL_ECHO=False
```

> 💡 **Flexibilité ML :** Pour changer de modèle, modifiez simplement `ML_SERVICE_URL` et `ML_ACTIVE_MODEL` — aucune modification de code nécessaire.

---

## 🚀 Lancement

```bash
# Depuis le dossier Backend
uvicorn api.main:app --reload
```

| URL                            | Description                            |
| ------------------------------ | -------------------------------------- |
| `http://localhost:8000`        | API REST                               |
| `http://localhost:8000/docs`   | Swagger UI (documentation interactive) |
| `http://localhost:8000/redoc`  | ReDoc                                  |
| `http://localhost:8000/health` | Health check                           |

---

## 🧪 Tests

```bash
pytest api/tests/ -v
```

---

## 👥 Rôles utilisateurs

| Rôle         | Accès                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Visiteur** | Lecture carte (Google Maps), clusters, prédictions, chat IA          |
| **Standard** | + Alertes email                                                      |
| **Premium**  | + WhatsApp/SMS · Zones prioritaires · Agent IA personnalisé par zone |
