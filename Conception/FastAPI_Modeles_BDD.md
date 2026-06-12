# 🗃️ Modèles BDD — JeryMotro FastAPI (SQLAlchemy)
#FastAPI #SQLAlchemy #BDD #PostgreSQL #Modèles

---

## 📋 SOMMAIRE

1. [Vue d'ensemble des tables](#1-vue-densemble)
2. [Modèle User — 3 rôles](#2-modèle-user)
3. [Modèle MonitoredZone — Zones prioritaires](#3-modèle-monitoredzone)
4. [Modèle FirmsFireDetection](#4-modèle-firmsfiredetection)
5. [Modèle FireEvent (Statut feu)](#5-modèle-fireevent)
6. [Modèle Prediction](#6-modèle-prediction)
7. [Modèle Alert](#7-modèle-alert)
8. [Modèle AlertSubscription](#8-modèle-alertsubscription)
9. [Modèle CollectionRun](#9-modèle-collectionrun)
10. [database.py — Moteur async](#10-databasepy)

---

## 1. VUE D'ENSEMBLE

```
PostgreSQL — JeryMotro DB
├── users                   ← Standard / Premium (Visiteur = non authentifié)
├── monitored_zones         ← Zones prioritaires suivies (Premium uniquement)
├── firms_fire_detections   ← Points FIRMS enrichis (MODIS + VIIRS)
├── fire_events             ← Clusters = événements feu (ACTIVE/COOLING/LIKELY_OUT/UNKNOWN)
├── predictions             ← Sorties ConvLSTM J+1 (grille 375m)
├── alerts                  ← Historique alertes envoyées
├── alert_subscriptions     ← Préférences alertes par utilisateur
└── collection_runs         ← Audit des runs de collecte FIRMS
```

### Relations

```mermaid
erDiagram
    users ||--o{ alert_subscriptions : "possède"
    users ||--o{ monitored_zones : "surveille"
    users ||--o{ alerts : "reçoit"
    firms_fire_detections }o--|| fire_events : "appartient_à"
    alerts }o--o| fire_events : "référence"
    collection_runs ||--o{ firms_fire_detections : "ingère"
```


---

## 2. MODÈLE USER

> **3 types d'acteurs :**
> - **Visiteur** : non authentifié — accès lecture seule (carte, clusters, chat IA)
> - **Standard** : compte gratuit — + alertes email uniquement
> - **Premium** : ONG, aire protégée, parc national — + WhatsApp + SMS + exports

```python
# api/models/user.py
import enum
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from database import Base

class UserRole(str, enum.Enum):
    standard = "standard"
    premium  = "premium"   # ONG, aires protégées, parcs nationaux
    admin    = "admin"

class User(Base):
    __tablename__ = "users"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=True)
    full_name        = Column(String(255), nullable=True)
    organization     = Column(String(255), nullable=True)  # ONG, parc, etc.

    role = Column(
        Enum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.standard,
        index=True,
    )

    # Contacts pour alertes
    phone_number     = Column(String(30), nullable=True)    # SMS (Premium uniquement)
    whatsapp_number  = Column(String(30), nullable=True)    # WhatsApp (Premium uniquement)

    is_active        = Column(Boolean, default=True, nullable=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
```

### Matrice d'accès par rôle

| Fonctionnalité | Visiteur | Standard | Premium |
|----------------|----------|----------|---------|
| Carte détections (Google Maps) | ✅ | ✅ | ✅ |
| Clusters + statut feu | ✅ | ✅ | ✅ |
| Carte risque J+1 | ✅ | ✅ | ✅ |
| Chat IA (RAG) | ✅ (Général) | ✅ (Général) | ✅ (+ Agent IA personnalisé) |
| Alertes email | ❌ | ✅ | ✅ |
| Alertes WhatsApp / SMS | ❌ | ❌ | ✅ |
| Zones prioritaires | ❌ | ❌ | ✅ |
| Alertes de zone personnalisées | ❌ | ❌ | ✅ |
| Export données | ❌ | ❌ | ✅ |

---

## 3. MODÈLE MONITOREDZONE (Premium)

```python
# api/models/zone.py
from sqlalchemy import Column, BigInteger, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

class MonitoredZone(Base):
    __tablename__ = "monitored_zones"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id          = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    name             = Column(String(255), nullable=False)
    
    # Zone géographique simplifiée (Centre + Rayon)
    latitude         = Column(Float, nullable=False)
    longitude        = Column(Float, nullable=False)
    radius_km        = Column(Float, nullable=False, default=10.0)

    # Seuils personnalisés d'alertes pour cette zone
    min_risk         = Column(Float, default=0.70)
    min_frp          = Column(Float, default=50.0)
    
    # Prompt de l'Agent IA personnalisé pour cette zone
    custom_ai_prompt = Column(Text, nullable=True)

    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## 4. MODÈLE FIRMSFILEDETECTION

```python
# api/models/detection.py
from sqlalchemy import (
    Column, BigInteger, Integer, Float, String,
    Date, DateTime, Boolean, ForeignKey, UniqueConstraint
)
from sqlalchemy.sql import func
from database import Base

class FirmsFireDetection(Base):
    __tablename__ = "firms_fire_detections"

    id                      = Column(BigInteger, primary_key=True, autoincrement=True)

    # Source satellite
    source                  = Column(String(20), nullable=False)   # MODIS / VIIRS_SNPP / VIIRS_NOAA21
    satellite               = Column(String(30), nullable=True)
    instrument              = Column(String(20), nullable=True)

    # Localisation
    latitude                = Column(Float, nullable=False)
    longitude               = Column(Float, nullable=False)

    # Temps
    acq_date                = Column(Date, nullable=False, index=True)
    acq_time                = Column(String(4), nullable=True)
    acq_datetime            = Column(DateTime(timezone=True), nullable=True, index=True)
    local_hour              = Column(Integer, nullable=True)

    # Thermique
    brightness              = Column(Float, nullable=True)
    bright_t31              = Column(Float, nullable=True)
    diff_brightness         = Column(Float, nullable=True)   # feature ML
    frp                     = Column(Float, nullable=True)
    frp_log                 = Column(Float, nullable=True)   # log1p(frp) — feature ML

    # Qualité
    confidence              = Column(String(20), nullable=True)
    confidence_num          = Column(Integer, nullable=True)
    daynight                = Column(String(1), nullable=True)
    scan                    = Column(Float, nullable=True)
    track                   = Column(Float, nullable=True)
    scan_track_ratio        = Column(Float, nullable=True)   # feature ML

    # Saisonnier
    is_dry_season           = Column(Boolean, nullable=True)  # Juin–Octobre (Madagascar)

    # ERA5 / GEE enrichissement
    temperature_2m          = Column(Float, nullable=True)
    relative_humidity       = Column(Float, nullable=True)
    wind_speed              = Column(Float, nullable=True)
    precipitation           = Column(Float, nullable=True)
    landcover               = Column(String(50), nullable=True)
    slope_deg               = Column(Float, nullable=True)
    ndvi_10m                = Column(Float, nullable=True)
    is_recent_loss          = Column(Integer, nullable=True)  # Hansen GFC 0/1

    # Sorties JeryMotroNet XGBoost
    risk_score              = Column(Float, nullable=True)    # 0.0–1.0
    fire_label              = Column(Integer, nullable=True)  # 0/1 (seuil 0.70)

    # Cluster HDBSCAN
    cluster_id              = Column(Integer, nullable=True, index=True)
    fire_event_id           = Column(BigInteger, ForeignKey("fire_events.id"), nullable=True, index=True)
    cluster_size            = Column(Integer, nullable=True)
    cluster_frp_total       = Column(Float, nullable=True)
    cluster_frp_max         = Column(Float, nullable=True)
    is_noise                = Column(Integer, nullable=True)  # 1 si cluster_id == -1

    # Région
    region                  = Column(String(100), nullable=True)

    # Audit
    collection_run_id       = Column(String(50), nullable=True)
    inserted_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at              = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "latitude", "longitude", "acq_date", "acq_time", "satellite", "instrument",
            name="uq_firms_detection"
        ),
    )
```

---

## 4. MODÈLE FIREEVENT (Cluster + Statut feu)

```python
# api/models/fire_event.py
import enum
from sqlalchemy import Column, BigInteger, Integer, Float, String, DateTime, Enum
from sqlalchemy.sql import func
from database import Base

class FireStatus(str, enum.Enum):
    ACTIVE     = "ACTIVE"      # delta <= 9h
    COOLING    = "COOLING"     # 9h < delta <= 24h
    LIKELY_OUT = "LIKELY_OUT"  # delta > 72h
    UNKNOWN    = "UNKNOWN"     # pipeline KO / nuages

class FireEvent(Base):
    __tablename__ = "fire_events"

    id                    = Column(BigInteger, primary_key=True, autoincrement=True)
    fire_id               = Column(String(50), unique=True, nullable=False, index=True)

    center_latitude       = Column(Float, nullable=False)
    center_longitude      = Column(Float, nullable=False)
    radius_km             = Column(Float, nullable=True)
    region                = Column(String(100), nullable=True)

    cluster_size          = Column(Integer, nullable=True)
    cluster_frp_total     = Column(Float, nullable=True)
    cluster_frp_max       = Column(Float, nullable=True)
    risk_score_max        = Column(Float, nullable=True)
    risk_level            = Column(String(10), nullable=True)  # LOW/MEDIUM/HIGH/CRITICAL

    first_seen            = Column(DateTime(timezone=True), nullable=False)
    last_seen             = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_hours        = Column(Float, nullable=True)
    hours_since_last_seen = Column(Float, nullable=True)

    cluster_status        = Column(
        Enum(FireStatus, name="fire_status_enum"),
        nullable=False,
        default=FireStatus.UNKNOWN,
        index=True,
    )
    status_reason         = Column(String(30), nullable=True)
    reactivation_count    = Column(Integer, default=0)

    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), onupdate=func.now())
```

### Machine d'état

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Première détection
    ACTIVE --> COOLING : delta > 9h
    COOLING --> LIKELY_OUT : delta > 72h
    LIKELY_OUT --> ACTIVE : Nouvelle détection (REACTIVATED)
    ACTIVE --> UNKNOWN : Pipeline KO / nuages
    COOLING --> UNKNOWN : Pipeline KO / nuages
```

---

## 5. MODÈLE PREDICTION

```python
# api/models/prediction.py
from sqlalchemy import Column, BigInteger, Float, String, Date, DateTime, Integer
from sqlalchemy.sql import func
from database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id                = Column(BigInteger, primary_key=True, autoincrement=True)
    prediction_date   = Column(Date, nullable=False, index=True)
    latitude          = Column(Float, nullable=False)
    longitude         = Column(Float, nullable=False)
    grid_cell_id      = Column(String(30), nullable=True)
    risk_score_j1     = Column(Float, nullable=False)
    confidence        = Column(Float, nullable=True)
    model_version     = Column(String(30), nullable=True)   # "convlstm_v1.2"
    input_window_days = Column(Integer, nullable=True)
    region            = Column(String(100), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
```

---

## 6. MODÈLE ALERT

```python
# api/models/alert.py
import enum
from sqlalchemy import (
    Column, BigInteger, Float, String, Text,
    DateTime, ForeignKey, ARRAY, Enum
)
from sqlalchemy.sql import func
from database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id             = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id        = Column(BigInteger, ForeignKey("users.id"), nullable=True, index=True)
    fire_event_id  = Column(BigInteger, ForeignKey("fire_events.id"), nullable=True)
    detection_id   = Column(BigInteger, ForeignKey("firms_fire_detections.id"), nullable=True)

    alert_level    = Column(String(10), nullable=False)   # LOW/MEDIUM/HIGH/CRITICAL
    region         = Column(String(100), nullable=True)
    latitude       = Column(Float, nullable=True)
    longitude      = Column(Float, nullable=True)
    risk_score     = Column(Float, nullable=True)
    frp            = Column(Float, nullable=True)
    message        = Column(Text, nullable=True)
    images         = Column(ARRAY(String), nullable=True) # [url_thermique, url_visible]

    # Un enregistrement par canal
    channel        = Column(String(20), nullable=False)   # EMAIL / SMS / WHATSAPP
    destination    = Column(String(255), nullable=True)
    status         = Column(String(10), default="PENDING") # PENDING / SENT / FAILED
    error_message  = Column(Text, nullable=True)

    sent_at        = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
```

---

## 7. MODÈLE ALERTSUBSCRIPTION

```python
# api/models/alert_subscription.py
import enum
from sqlalchemy import (
    Column, BigInteger, Float, String, Boolean,
    DateTime, ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.sql import func
from database import Base

class AlertChannel(str, enum.Enum):
    EMAIL    = "EMAIL"
    SMS      = "SMS"       # Premium uniquement
    WHATSAPP = "WHATSAPP"  # Premium uniquement

class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id          = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id     = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    channel     = Column(Enum(AlertChannel, name="alert_channel_enum"), nullable=False)
    destination = Column(String(255), nullable=False)
    enabled     = Column(Boolean, default=True)

    # Seuils (Premium peut personnaliser)
    min_risk    = Column(Float, default=0.70)
    min_frp     = Column(Float, default=50.0)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "channel", name="uq_user_channel"),
    )
```

---

## 8. MODÈLE COLLECTIONRUN

```python
# api/models/collection_run.py
from sqlalchemy import Column, BigInteger, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)
    run_id          = Column(String(50), unique=True, nullable=False)

    source          = Column(String(20), nullable=False)   # MODIS / VIIRS_SNPP / VIIRS_NOAA21 / ALL
    started_at      = Column(DateTime(timezone=True), nullable=False)
    finished_at     = Column(DateTime(timezone=True), nullable=True)

    ok              = Column(Boolean, nullable=True)
    row_count_raw   = Column(Integer, default=0)
    row_count_valid = Column(Integer, default=0)
    row_count_dedup = Column(Integer, default=0)
    error           = Column(Text, nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
```

---

## 9. DATABASE.PY — Moteur Async

```python
# api/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://jerymotro:password@localhost:5432/jerymotro"
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## 📚 DOCUMENTS ASSOCIÉS

| Document | Description |
|----------|-------------|
| **FastAPI_Conception_Principale.md** | Vue d'ensemble architecture |
| **FastAPI_Schemas_Pydantic.md** | Modèles de validation I/O |
| **FastAPI_Services_Metier.md** | Logique métier (ML/DL, RAG, Alertes) |
| `obsidian/17_Fonctionnalite_Statut_Feu.md` | Logique statut feu |
| `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md` | Politique d'accès |

---

**Date :** Mai 2026 | **Version :** 2.3 | **Projet :** JeryMotro Platform
