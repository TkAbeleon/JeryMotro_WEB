# ✅ Schemas Pydantic — JeryMotro FastAPI (Validation I/O)

#FastAPI #Pydantic #Schemas #Validation

---

## 📋 SOMMAIRE

1. [Schémas Auth (Utilisateurs)](#1-schemas-auth)
2. [Schémas Détections](#2-schemas-détections)
3. [Schémas FireEvent (Clusters)](#3-schemas-fireevent)
4. [Schémas Prédictions](#4-schemas-prédictions)
5. [Schémas Alertes](#5-schemas-alertes)
6. [Schémas Abonnements Alertes](#6-schemas-abonnements)
7. [Schémas Zones Prioritaires (Premium)](#7-schemas-zones-prioritaires)
8. [Schémas Chat IA](#8-schemas-chat-ia)
9. [Schémas Santé](#9-schemas-santé)

---

## 1. SCHÉMAS AUTH

> Gère les 3 rôles : **Visiteur** (non authentifié), **Standard**, **Premium**

```python
# api/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    standard = "standard"
    premium  = "premium"   # ONG, aire protégée, parc national
    admin    = "admin"

# ── Inscription ───────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email:         EmailStr
    password:      str = Field(..., min_length=8)
    full_name:     Optional[str] = None
    organization:  Optional[str] = None   # Nom ONG/parc (info pour rôle Premium)

# ── Connexion ─────────────────────────────────────────────────────────────────
class UserLogin(BaseModel):
    email:    EmailStr
    password: str

# ── Réponse utilisateur ───────────────────────────────────────────────────────
class UserResponse(BaseModel):
    id:           int
    email:        str
    full_name:    Optional[str] = None
    organization: Optional[str] = None
    role:         UserRole
    is_active:    bool

    class Config:
        from_attributes = True

# ── Token JWT ─────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token:  str
    token_type:    str = "bearer"
    user:          UserResponse

# ── Mise à jour contacts (alertes) ────────────────────────────────────────────
class UserContactUpdate(BaseModel):
    phone_number:    Optional[str] = Field(None, pattern=r"^\+?\d{7,15}$")
    whatsapp_number: Optional[str] = Field(None, pattern=r"^\+?\d{7,15}$")


# OTP (One-Time Password) — schemas
class OTPRequest(BaseModel):
    email: EmailStr
    via: Optional[str] = Field("sms", description="sms or email")


class OTPVerify(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=8)
```

---

## 2. SCHÉMAS DÉTECTIONS

```python
# api/schemas/detection.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# ── Paramètres de requête (query params) ──────────────────────────────────────
class DetectionQuery(BaseModel):
    date_from:    Optional[date]  = None
    date_to:      Optional[date]  = None
    min_frp:      float           = Field(0.0, ge=0.0)
    max_frp:      Optional[float] = None
    min_risk:     float           = Field(0.0, ge=0.0, le=1.0)
    max_risk:     Optional[float] = Field(None, le=1.0)
    source:       Optional[str]   = None   # MODIS / VIIRS_SNPP / VIIRS_NOAA21
    confidence:   Optional[str]   = None   # low / nominal / high
    daynight:     Optional[str]   = None   # D / N
    region:       Optional[str]   = None
    is_dry_season: Optional[bool] = None
    cluster_id:   Optional[int]   = None
    exclude_noise: bool           = True
    limit:        int             = Field(1000, le=10000)
    offset:       int             = Field(0, ge=0)

# ── Un point de détection (réponse) ───────────────────────────────────────────
class DetectionResponse(BaseModel):
    id:                     int
    latitude:               float
    longitude:              float
    brightness:             Optional[float] = None
    bright_t31:             Optional[float] = None
    diff_brightness:        Optional[float] = None
    frp:                    Optional[float] = None
    frp_log:                Optional[float] = None
    confidence:             Optional[str]   = None
    confidence_num:         Optional[int]   = None
    acq_date:               date
    acq_time:               Optional[str]   = None
    local_hour:             Optional[int]   = None
    satellite:              Optional[str]   = None
    instrument:             Optional[str]   = None
    daynight:               Optional[str]   = None
    scan:                   Optional[float] = None
    track:                  Optional[float] = None
    source:                 str
    risk_score:             Optional[float] = None
    fire_label:             Optional[int]   = None
    cluster_id:             Optional[int]   = None
    cluster_size:           Optional[int]   = None
    cluster_frp_total:      Optional[float] = None
    cluster_frp_max:        Optional[float] = None
    is_noise:               Optional[int]   = None
    is_dry_season:          Optional[bool]  = None
    temperature_2m:         Optional[float] = None
    relative_humidity:      Optional[float] = None
    wind_speed:             Optional[float] = None
    landcover:              Optional[str]   = None
    slope_deg:              Optional[float] = None
    ndvi_10m:               Optional[float] = None
    region:                 Optional[str]   = None
    inserted_at:            Optional[datetime] = None

    class Config:
        from_attributes = True

# ── Réponse liste détections ──────────────────────────────────────────────────
class DetectionListResponse(BaseModel):
    detections:      List[DetectionResponse]
    count:           int
    total:           int
    limit:           int
    offset:          int
    filters_applied: dict

# ── Stats journalières ────────────────────────────────────────────────────────
class DailyStats(BaseModel):
    date:               date
    total_detections:   int
    high_risk_count:    int
    avg_frp:            Optional[float] = None
    max_frp:            Optional[float] = None
    active_clusters:    int
    regions_affected:   List[str]

class DailyStatsResponse(BaseModel):
    stats: List[DailyStats]
```

---

## 3. SCHÉMAS FIREEVENT (Clusters + Statut feu)

```python
# api/schemas/fire_event.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FireStatusEnum(str, Enum):
    ACTIVE     = "ACTIVE"
    COOLING    = "COOLING"
    LIKELY_OUT = "LIKELY_OUT"
    UNKNOWN    = "UNKNOWN"

class FireEventResponse(BaseModel):
    id:                     int
    fire_id:                str
    center_latitude:        float
    center_longitude:       float
    radius_km:              Optional[float] = None
    region:                 Optional[str]   = None

    cluster_size:           Optional[int]   = None
    cluster_frp_total:      Optional[float] = None
    cluster_frp_max:        Optional[float] = None
    risk_score_max:         Optional[float] = None
    risk_level:             Optional[str]   = None   # LOW/MEDIUM/HIGH/CRITICAL

    first_seen:             datetime
    last_seen:              datetime
    duration_hours:         Optional[float] = None
    hours_since_last_seen:  Optional[float] = None

    cluster_status:         FireStatusEnum
    status_reason:          Optional[str]   = None
    reactivation_count:     int = 0

    class Config:
        from_attributes = True

class FireEventListResponse(BaseModel):
    clusters: List[FireEventResponse]
    count:    int
    total:    int
```

---

## 4. SCHÉMAS PRÉDICTIONS

```python
# api/schemas/prediction.py
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime

class PredictionResponse(BaseModel):
    id:                 int
    prediction_date:    date
    latitude:           float
    longitude:          float
    grid_cell_id:       Optional[str]   = None
    risk_score_j1:      float
    confidence:         Optional[float] = None
    model_version:      Optional[str]   = None
    input_window_days:  Optional[int]   = None
    region:             Optional[str]   = None
    created_at:         datetime

    class Config:
        from_attributes = True

class PredictionListResponse(BaseModel):
    predictions:    List[PredictionResponse]
    count:          int
    prediction_date: Optional[date]    = None
    model_info:     Optional[dict]     = None

# ── GeoJSON (carte risque ConvLSTM) ───────────────────────────────────────────
class RiskMapMetadata(BaseModel):
    prediction_date:  date
    total_cells:      int
    high_risk_cells:  int
    model_version:    Optional[str] = None

class RiskMapResponse(BaseModel):
    type:     str = "FeatureCollection"
    features: List[Any]
    metadata: RiskMapMetadata
```

---

## 5. SCHÉMAS ALERTES

```python
# api/schemas/alert.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class AlertLevel(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatusEnum(str, Enum):
    PENDING = "PENDING"
    SENT    = "SENT"
    FAILED  = "FAILED"

class AlertChannelEnum(str, Enum):
    EMAIL    = "EMAIL"
    SMS      = "SMS"
    WHATSAPP = "WHATSAPP"

class AlertResponse(BaseModel):
    id:           int
    alert_level:  str
    region:       Optional[str]   = None
    latitude:     Optional[float] = None
    longitude:    Optional[float] = None
    risk_score:   Optional[float] = None
    frp:          Optional[float] = None
    message:      Optional[str]   = None
    images:       Optional[List[str]] = None
    channel:      str
    destination:  Optional[str]   = None
    status:       str
    sent_at:      Optional[datetime] = None
    created_at:   datetime

    class Config:
        from_attributes = True

class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    count:  int
    total:  int

# ── Déclenchement manuel (n8n / admin) ───────────────────────────────────────
class AlertTriggerRequest(BaseModel):
    fire_event_id: Optional[int]  = None
    risk_score:    float          = Field(..., ge=0.0, le=1.0)
    frp:           float          = Field(..., ge=0.0)
    region:        str
    latitude:      float
    longitude:     float
    force_send:    bool           = False

class AlertTriggerResponse(BaseModel):
    alert_ids: List[int]
    status:    str
    channels:  List[str]
    message:   str
```

---

## 6. SCHÉMAS ABONNEMENTS ALERTES

```python
# api/schemas/alert_subscription.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum

class AlertChannelEnum(str, Enum):
    EMAIL    = "EMAIL"
    SMS      = "SMS"       # Premium uniquement
    WHATSAPP = "WHATSAPP"  # Premium uniquement

class SubscribeRequest(BaseModel):
    channel:     AlertChannelEnum
    destination: str = Field(..., description="Email ou numéro de téléphone")
    min_risk:    float = Field(0.70, ge=0.0, le=1.0)
    min_frp:     float = Field(50.0, ge=0.0)

class SubscriptionResponse(BaseModel):
    id:          int
    channel:     str
    destination: str
    enabled:     bool
    min_risk:    float
    min_frp:     float

    class Config:
        from_attributes = True
```

---

## 7. SCHÉMAS ZONES PRIORITAIRES (Premium)

```python
# api/schemas/zone.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ZoneCreate(BaseModel):
    name:             str = Field(..., min_length=3, max_length=255)
    latitude:         float = Field(..., ge=-90.0, le=90.0)
    longitude:        float = Field(..., ge=-180.0, le=180.0)
    radius_km:        float = Field(default=10.0, ge=1.0, le=100.0)
    min_risk:         float = Field(default=0.70, ge=0.0, le=1.0)
    min_frp:          float = Field(default=50.0, ge=0.0)
    custom_ai_prompt: Optional[str] = Field(default=None, description="Prompt personnalisé de l'agent IA de la zone")

class ZoneUpdate(BaseModel):
    name:             Optional[str] = Field(None, min_length=3, max_length=255)
    latitude:         Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude:        Optional[float] = Field(None, ge=-180.0, le=180.0)
    radius_km:        Optional[float] = Field(None, ge=1.0, le=100.0)
    min_risk:         Optional[float] = Field(None, ge=0.0, le=1.0)
    min_frp:          Optional[float] = Field(None, ge=0.0)
    custom_ai_prompt: Optional[str] = None

class ZoneResponse(BaseModel):
    id:               int
    user_id:          int
    name:             str
    latitude:         float
    longitude:        float
    radius_km:        float
    min_risk:         float
    min_frp:          float
    custom_ai_prompt: Optional[str] = None
    created_at:       datetime

    class Config:
        from_attributes = True
```

---

## 8. SCHÉMAS CHAT IA

```python
# api/schemas/chat.py
from pydantic import BaseModel, Field
from typing import Optional, List

class ChatRequest(BaseModel):
    message:         str  = Field(..., min_length=3, max_length=500,
                                  description="Question sur les données JeryMotro")
    conversation_id: Optional[str] = None
    temperature:     float = Field(0.1, ge=0.0, le=1.0)
    zone_id:         Optional[int] = Field(default=None, description="ID de la zone prioritaire (Premium uniquement)")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Quels sont les derniers risques détectés dans ma zone ?",
                "temperature": 0.1,
                "zone_id": 1
            }
        }

class DataContext(BaseModel):
    clusters_referenced: Optional[List[int]]  = None
    date_range:          Optional[str]         = None
    regions_mentioned:   Optional[List[str]]   = None

class ChatResponse(BaseModel):
    response:         str
    sources:          List[str]
    data_context:     DataContext
    model_used:       str
    tokens_used:      Optional[int] = None
    response_time_ms: Optional[int] = None
```

---

## 9. SCHÉMAS SANTÉ

```python
# api/schemas/health.py
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class ServicesHealth(BaseModel):
    database:  str   # "connected" / "disconnected"
    chromadb:  str
    groq_api:  str

class HealthResponse(BaseModel):
    status:          str   # "healthy" / "degraded"
    version:         str
    services:        ServicesHealth
    uptime_seconds:  Optional[float] = None
    errors:          Optional[list]  = None
    timestamp:       datetime
```

---

## 📚 DOCUMENTS ASSOCIÉS

| Document                                             | Description                 |
| ---------------------------------------------------- | --------------------------- |
| **FastAPI_Modeles_BDD.md**                           | Schémas SQLAlchemy (tables) |
| **FastAPI_Contrats_API.md**                          | Endpoints REST détaillés    |
| **FastAPI_Services_Metier.md**                       | Logique métier              |
| `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md` | Politique d'accès par rôle  |

---

**Date :** Juin 2026 | **Version :** 2.4 | **Projet :** JeryMotro Platform
