# JeryMotro Platform — Surveillance des Feux de Brousse à Madagascar

Plateforme de surveillance environnementale utilisant l'IA et les données satellitaires NASA FIRMS pour détecter, prédire et alerter sur les feux de brousse à Madagascar.

## Run & Operate

### Backend FastAPI
```bash
cd Backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend React
```bash
# Development server
pnpm --filter @workspace/api-client-react run dev

# Build for production
pnpm run build

# Typecheck
pnpm run typecheck

# Regenerate API client from OpenAPI
pnpm --filter @workspace/api-spec run codegen
```

### API Production
- **URL:** `http://35.192.27.164/jerymotro-api`
- **Swagger UI:** `http://35.192.27.164/jerymotro-api/docs`
- **Health Check:** `GET /healthz`

## Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL + SQLAlchemy async
- **Auth:** JWT + OTP (One-Time Password)
- **ML/DL:** Services externes (XGBoost, ConvLSTM) via HTTP
- **RAG:** Vertex AI (Gemini 1.5 Flash) + ChromaDB
- **Alertes:** SMTP (Email) + Twilio (SMS/WhatsApp)

### Frontend
- **Framework:** React + Vite + TypeScript 5.9
- **Package Manager:** pnpm workspaces
- **API Client:** Orval (auto-generated from OpenAPI)
- **Validation:** Zod schemas
- **Maps:** Leaflet
- **Build:** esbuild

## Where things live

```
├── Conception/                    # Documentation complète
│   ├── FastAPI_Conception_Principale.md
│   ├── FastAPI_Contrats_API.md
│   ├── FastAPI_Modeles_BDD.md
│   ├── FastAPI_Schemas_Pydantic.md
│   ├── FastAPI_Services_Metier.md
│   ├── JeryMotro_Design_System.md
│   └── PLAN_IMPL_STATUS.md
├── lib/
│   ├── api-spec/                  # OpenAPI specification
│   │   └── openapi.yaml
│   ├── api-zod/                   # Zod schemas generated
│   └── api-client-react/          # React API client
└── Backend/                       # FastAPI application
    ├── api/
    │   ├── routers/               # API endpoints
    │   ├── models/                # SQLAlchemy models
    │   ├── schemas/               # Pydantic schemas
    │   └── services/              # Business logic
    └── scripts/                   # Data import scripts
```

## Architecture decisions

- **ML Services External:** Les modèles ML (XGBoost, ConvLSTM) sont déployés comme microservices indépendants, appelés via HTTP. Cela permet de changer de modèle sans modifier le backend.
- **Layered Architecture:** Séparation claire entre Routers → Schemas → Services → Models → Database pour la testabilité et la maintenabilité.
- **RAG with Vertex AI:** Utilisation de Gemini 1.5 Flash avec ChromaDB pour le chat IA, permettant des réponses basées sur les données du projet.
- **3 Rôles Utilisateurs:** Visiteur (lecture seule), Standard (alertes email), Premium (WhatsApp/SMS + zones prioritaires).

## Product

### Fonctionnalités Principales

**Pour tous les utilisateurs (Visiteur, Standard, Premium):**
- 🗺️ Carte interactive des détections de feux en temps réel
- 📊 Clusters de feux avec statuts (ACTIVE, COOLING, LIKELY_OUT)
- 🔮 Prédictions de risque J+1 (ConvLSTM)
- 💬 Chat IA JeryMotro (RAG) pour interroger les données

**Utilisateurs Standard:**
- 📧 Alertes email personnalisables
- 📈 Historique personnel des alertes
- 👤 Gestion du profil

**Utilisateurs Premium (ONG, Parcs Nationaux):**
- 📱 Alertes WhatsApp et SMS
- 🎯 Zones prioritaires de surveillance personnalisées
- 🤖 Agent IA personnalisé par zone
- 📤 Export de données

### Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | randriamanantenatsikynyantsa@gmail.com | password123 |
| Premium | tkabeleon@gmail.com | password123 |
| Premium | rtsikynyantsa@gmail.com | password123 |
| Standard | tsikynyantsa1@outlook.fr | password123 |

## User preferences

- Le mode sombre est le mode par défaut (conçu pour la surveillance nocturne)
- Les scores ML sont toujours affichés avec leur barre de progression visuelle
- L'orange (`--fire`) indique un danger réel, pas une décoration

## Gotchas

- **Ne jamais committer** le fichier `.env` - utiliser `.env.example` à la place
- Le service ML externe peut être en mode dégradé (risk_score = -1) si indisponible
- Les tests pytest doivent atteindre ≥ 60% de couverture (exigence mémoire L3)
- Le clustering HDBSCAN doit être exécuté par lots (limit=50000) sur les données historiques

## Pointers

- **Documentation API:** `http://35.192.27.164/jerymotro-api/docs`
- **Design System:** `Conception/JeryMotro_Design_System.md`
- **Guide Intégration Frontend:** `Conception/frontend_integration_guide.md`
- **État Implémentation:** `Conception/PLAN_IMPL_STATUS.md`
