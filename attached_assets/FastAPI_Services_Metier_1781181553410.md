# 🧠 Services Métier — JeryMotro FastAPI
#FastAPI #Services #ML #RAG #Alertes #Python

---

## 📋 SOMMAIRE

1. [jerymotronet_service.py — Client HTTP vers services ML externes](#1-jerymotronet-service)
2. [rag_service.py — Chat IA (Vertex AI + ChromaDB)](#2-rag-service)
3. [alert_service.py — Email + WhatsApp + SMS](#3-alert-service)
4. [firms_service.py — Collecte FIRMS API](#4-firms-service)
5. [fire_status_service.py — Statut feu ACTIVE/COOLING/...](#5-fire-status-service)
6. [auth_service.py — JWT + rôles utilisateurs](#6-auth-service)

---

## 1. JERYMOTRONET SERVICE — Client HTTP vers services ML externes

> **Principe :** Les modèles ML (XGBoost, ConvLSTM, etc.) sont déployés en tant que **microservices indépendants** (ex : FastAPI/Flask séparé, Vertex AI Endpoint, Triton Server, etc.). Le backend JeryMotro les appelle via HTTP. Cette architecture permet de **changer de modèle sans toucher au code du backend** — seules les variables d'environnement changent.

### Architecture externe ML

```
┌─────────────────────┐         ┌────────────────────────────────────┐
│  JeryMotro Backend  │──HTTP──▶│  ML Service externe (configurable) │
│  (FastAPI)          │◀────────│  XGBoost / ConvLSTM / Vertex AI EP │
└─────────────────────┘         └────────────────────────────────────┘
```

### Variables d'environnement de configuration

```bash
# URL de base du service ML (peut pointer vers XGBoost local, ConvLSTM Docker, Vertex AI Endpoint, etc.)
ML_SERVICE_URL=http://localhost:9000      # ex local dev
# ML_SERVICE_URL=http://ml-service:9000  # ex Docker
# ML_SERVICE_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/XXX/...  # Vertex AI Endpoint

# Clé d'API du service ML si requis (ex: service tierce ou Vertex AI)
ML_SERVICE_API_KEY=

# Modèle actif à utiliser (documentatif, utilisé dans les logs et réponses API)
ML_ACTIVE_MODEL=xgboost-v1   # ou convlstm-v2, ensemble-v1, etc.

# Timeout HTTP pour les appels ML (secondes)
ML_TIMEOUT_SECONDS=30
```

### Implémentation du service client

```python
# api/services/jerymotronet_service.py
import os
import httpx
from typing import Optional

ML_SERVICE_URL  = os.getenv("ML_SERVICE_URL", "http://localhost:9000")
ML_SERVICE_KEY  = os.getenv("ML_SERVICE_API_KEY", "")
ML_ACTIVE_MODEL = os.getenv("ML_ACTIVE_MODEL", "xgboost-v1")
ML_TIMEOUT      = int(os.getenv("ML_TIMEOUT_SECONDS", 30))

def _build_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if ML_SERVICE_KEY:
        headers["Authorization"] = f"Bearer {ML_SERVICE_KEY}"
    return headers

async def predict_risk_scores(detections: list[dict]) -> list[dict]:
    """
    Appelle le microservice ML externe pour calculer les risk_scores.
    
    Contrat d'interface attendu du service ML :
      POST {ML_SERVICE_URL}/predict
      Body : {"instances": [ {feature_dict}, ... ], "model": "xgboost-v1"}
      Response: {"predictions": [{"risk_score": 0.87, "fire_label": 1}, ...]}
    
    Si le service est indisponible, renvoie risk_score = -1 (dégradé).
    """
    url = f"{ML_SERVICE_URL}/predict"
    payload = {
        "instances": detections,
        "model": ML_ACTIVE_MODEL,
    }
    try:
        async with httpx.AsyncClient(timeout=ML_TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=_build_headers())
            response.raise_for_status()
            predictions = response.json()["predictions"]
        
        for det, pred in zip(detections, predictions):
            det["risk_score"]  = float(pred.get("risk_score", -1))
            det["fire_label"]  = int(pred.get("fire_label", 0))
            det["model_used"]  = ML_ACTIVE_MODEL
        return detections

    except (httpx.RequestError, httpx.HTTPStatusError, KeyError) as e:
        # Mode dégradé : on marque les détections comme non scorées
        for det in detections:
            det["risk_score"] = -1.0
            det["fire_label"] = 0
            det["model_used"] = f"ERROR:{ML_ACTIVE_MODEL}"
        return detections

async def predict_convlstm_grid(grid_input: dict) -> dict:
    """
    Appelle le microservice ML externe pour la prédiction spatiale J+1 (ConvLSTM).
    
    Contrat d'interface attendu :
      POST {ML_SERVICE_URL}/predict-grid
      Body : {"sequence": [...], "model": "convlstm-v1"}
      Response: {"grid": {"cells": [...], "date": "2026-03-31"}}
    """
    url = f"{ML_SERVICE_URL}/predict-grid"
    payload = {**grid_input, "model": ML_ACTIVE_MODEL}
    try:
        async with httpx.AsyncClient(timeout=ML_TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=_build_headers())
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        return {"error": str(e), "model_used": ML_ACTIVE_MODEL}

def compute_risk_level(risk_score: float, frp: float) -> str:
    """Calcule le niveau d'alerte selon la matrice officielle."""
    if risk_score < 0:
        return "UNKNOWN"   # service ML indisponible
    if risk_score > 0.80 or frp > 50:
        return "CRITICAL"
    elif risk_score > 0.60:
        return "HIGH"
    elif risk_score > 0.40:
        return "MEDIUM"
    return "LOW"
```

### Notes sur l'évolution des modèles

| Variable `ML_ACTIVE_MODEL` | Service cible | Quand l'utiliser |
|---|---|---|
| `xgboost-v1` | Microservice XGBoost local / Docker | Dev, baseline prod |
| `convlstm-v1` | Microservice ConvLSTM local / Docker | Prédictions spatiales J+1 |
| `ensemble-v1` | Microservice combinant les deux | Production optimisée |
| `vertex-ai-ep` | Vertex AI Endpoint GCP | Production scalable |

---

## 2. RAG SERVICE — Chat IA (Vertex AI + ChromaDB)

```python
# api/services/rag_service.py
import os
import time
import chromadb
import vertexai
from vertexai.generative_models import GenerativeModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from api.models.zone import MonitoredZone
from typing import Optional

CHROMADB_HOST = os.getenv("CHROMADB_HOST", "madfire-chromadb")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", 8001))
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcp-project")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

# Initialisation Vertex AI
vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)

SYSTEM_PROMPT = """
Tu es JeryMotro AI, un assistant spécialisé dans la détection des feux de brousse à Madagascar.
Tu réponds UNIQUEMENT en te basant sur les données du projet JeryMotro.
Si la question dépasse les données disponibles, réponds :
"Je suis limité aux données JeryMotro. Consultez les sources NASA directement."
Réponds toujours en français. Sois précis et cite les données (régions, dates, scores).
"""

chroma_client = chromadb.HttpClient(host=CHROMADB_HOST, port=CHROMADB_PORT)
collection    = chroma_client.get_or_create_collection("jerymotro_results")

async def rag_query(
    message: str, 
    temperature: float = 0.1, 
    zone_id: Optional[int] = None, 
    db: Optional[AsyncSession] = None
) -> dict:
    """
    Pipeline RAG Vertex AI :
    1. Rechercher le contexte pertinent dans ChromaDB
    2. Charger le custom prompt de l'Agent de la zone si zone_id est fourni (Premium)
    3. Appeler le modèle Gemini 1.5 Flash via Vertex AI SDK
    4. Retourner réponse + sources
    """
    t0 = time.time()

    # 1. Adapter le system prompt si c'est un agent personnalisé pour une zone
    system_prompt = SYSTEM_PROMPT
    if zone_id and db:
        result = await db.execute(select(MonitoredZone).filter(MonitoredZone.id == zone_id))
        zone = result.scalars().first()
        if zone and zone.custom_ai_prompt:
            system_prompt += f"\n\n[CONSIGNE SPÉCIFIQUE ZONE - {zone.name.upper()}] : {zone.custom_ai_prompt}"

    # 2. Récupérer contexte ChromaDB
    results = collection.query(query_texts=[message], n_results=5)
    documents = results["documents"][0] if results["documents"] else []
    sources   = results["metadatas"][0] if results["metadatas"] else []
    context   = "\n\n".join(documents) if documents else ""

    if not context:
        return {
            "response":   "Je suis limité aux données JeryMotro. Aucun contexte disponible.",
            "sources":    [],
            "data_context": {},
            "model_used": "gemini-1.5-flash",
            "tokens_used": 0,
            "response_time_ms": int((time.time() - t0) * 1000),
        }

    # 3. Appel Vertex AI (Gemini)
    model = GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt
    )
    
    response = model.generate_content(
        f"Contexte :\n{context}\n\nQuestion : {message}",
        generation_config={"temperature": temperature}
    )

    return {
        "response":         response.text,
        "sources":          [s.get("title", "Document") for s in sources],
        "data_context":     {},
        "model_used":       "gemini-1.5-flash",
        "tokens_used":      None,
        "response_time_ms": int((time.time() - t0) * 1000),
    }
```

---

## 3. ALERT SERVICE — Email + WhatsApp + SMS

> Matrice de déclenchement (doc `obsidian/12_Systeme_Alertes.md`) :
> - `risk_score > 0.80` ou `FRP > 50` → 🔴 CRITIQUE : Email + SMS + WhatsApp
> - `risk_score > 0.60` → 🟠 HAUTE : Email + SMS + WhatsApp
> - `risk_score > 0.40` → 🟡 BASSE : Email uniquement

```python
# api/services/alert_service.py
import os
import requests
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from twilio.rest import Client

IMGBB_API_KEY       = os.getenv("IMGBB_API_KEY")
TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM         = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
SMTP_HOST           = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT           = int(os.getenv("SMTP_PORT", 587))
SMTP_USER           = os.getenv("ALERT_EMAIL")
SMTP_PASSWORD       = os.getenv("SMTP_PASSWORD")


def upload_to_imgbb(image_path: str) -> str | None:
    """Upload une image locale vers ImgBB et retourne l'URL publique."""
    try:
        with open(image_path, "rb") as f:
            res = requests.post(
                "https://api.imgbb.com/1/upload",
                data={"key": IMGBB_API_KEY},
                files={"image": f},
                timeout=30,
            )
        return res.json()["data"]["url"]
    except Exception as e:
        print(f"[ImgBB] Erreur upload : {e}")
        return None


def send_email(subject: str, body: str, recipient: str, img_urls: list[str] = []) -> bool:
    """Envoi email SMTP avec images en pièce jointe (liens)."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
        msg["To"]      = recipient

        html = f"<p>{body}</p>"
        for url in img_urls:
            html += f'<br><img src="{url}" style="max-width:600px"/>'
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipient, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email] Erreur : {e}")
        return False


def send_whatsapp(message: str, to_number: str) -> bool:
    """Envoi WhatsApp via Twilio Sandbox (Premium uniquement)."""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(
            from_=TWILIO_FROM,
            to=f"whatsapp:{to_number}",
            body=message,
        )
        return True
    except Exception as e:
        print(f"[WhatsApp] Erreur : {e}")
        return False


def send_sms(message: str, to_number: str) -> bool:
    """Envoi SMS via Twilio (Premium uniquement)."""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(
            from_=os.getenv("TWILIO_SMS_FROM"),
            to=to_number,
            body=message,
        )
        return True
    except Exception as e:
        print(f"[SMS] Erreur : {e}")
        return False


def route_alert(
    risk_score: float,
    frp: float,
    cluster_info: dict,
    subscriptions: list[dict],
) -> list[dict]:
    """
    Logique de routage selon la matrice officielle.
    subscriptions = liste des abonnements actifs pour ce cluster.
    Chaque abonnement contient : channel, destination, user_role.
    Retourne la liste des alertes envoyées avec leur statut.
    """
    img_urls = []
    sent_alerts = []

    # Génération images (si disponible)
    if risk_score > 0.40:
        thermal_path = _generate_thermal_png(cluster_info.get("bbox"))
        if thermal_path:
            url = upload_to_imgbb(thermal_path)
            if url:
                img_urls.append(url)

    if risk_score > 0.60 or frp > 50:
        visible_path = _generate_visible_png(cluster_info.get("bbox"))
        if visible_path:
            url = upload_to_imgbb(visible_path)
            if url:
                img_urls.append(url)

    # Message template
    region    = cluster_info.get("region", "Inconnue")
    images_str = " | ".join(img_urls) if img_urls else "Non disponible"
    message   = (
        f"🔥 Alerte JeryMotro\n"
        f"📍 Région : {region}\n"
        f"⚠️ Risque : {risk_score:.0%} | FRP : {frp:.1f} MW\n"
        f"📸 Images : {images_str}\n"
        f"👉 Dashboard : https://jerymotro.vercel.app"
    )

    for sub in subscriptions:
        channel     = sub["channel"]
        destination = sub["destination"]
        user_role   = sub.get("user_role", "standard")
        ok = False

        # Visiteurs : aucune alerte
        # Standard : email uniquement
        # Premium : tous canaux
        if channel == "EMAIL":
            level = "🚨 CRITIQUE" if (risk_score > 0.80 or frp > 50) else "🟠 Alerte Haute" if risk_score > 0.60 else "🟡 Détection Mineure"
            ok = send_email(level, message, destination, img_urls)

        elif channel in ("WHATSAPP", "SMS") and user_role == "premium":
            if channel == "WHATSAPP":
                ok = send_whatsapp(message, destination)
            else:
                ok = send_sms(message, destination)

        sent_alerts.append({
            "channel":     channel,
            "destination": destination,
            "status":      "SENT" if ok else "FAILED",
            "images":      img_urls,
        })

    return sent_alerts


def _generate_thermal_png(bbox: dict | None) -> str | None:
    """Placeholder — génération image thermique via GEE/Landsat."""
    return None


def _generate_visible_png(bbox: dict | None) -> str | None:
    """Placeholder — génération image visible via Sentinel-2."""
    return None
```

---

## 4. FIRMS SERVICE — Collecte FIRMS API

```python
# api/services/firms_service.py
import os
import io
import uuid
import requests
import pandas as pd
from datetime import datetime, timezone

FIRMS_MAP_KEY = os.getenv("FIRMS_MAP_KEY")
BBOX          = "-25.5,43,-11.5,50"   # Madagascar
DAY_RANGE     = 3                      # Fenêtre glissante 72h

SOURCES = {
    "MODIS_NRT":       "MODIS_NRT",
    "VIIRS_SNPP_NRT":  "VIIRS_SNPP_NRT",
    "VIIRS_NOAA21_NRT": "VIIRS_NOAA21_NRT",
}

def fetch_firms_source(source_key: str) -> pd.DataFrame | None:
    """Télécharge le CSV FIRMS pour une source donnée (fenêtre glissante 72h)."""
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv"
        f"/{FIRMS_MAP_KEY}/{source_key}/{BBOX}/{DAY_RANGE}"
    )
    try:
        res = requests.get(url, timeout=60)
        res.raise_for_status()
        df = pd.read_csv(io.StringIO(res.text))
        df["source"] = source_key
        return df
    except Exception as e:
        print(f"[FIRMS] Erreur source {source_key} : {e}")
        return None


def collect_all_sources() -> dict:
    """
    Collecte les 3 sources FIRMS, retourne un résumé par source.
    Utilisé par le planificateur de tâches de fond FastAPI ou POST /internal/process-firms.
    """
    run_id = str(uuid.uuid4())
    summary = {}

    for key in SOURCES:
        df = fetch_firms_source(key)
        if df is not None:
            summary[key] = {"ok": True, "rows": len(df), "df": df}
        else:
            summary[key] = {"ok": False, "rows": 0, "df": None}

    return {"run_id": run_id, "sources": summary, "started_at": datetime.now(timezone.utc)}


def build_dedupe_key(row: pd.Series) -> str:
    """Clé de déduplication FIRMS."""
    return f"{row['latitude']}_{row['longitude']}_{row['acq_date']}_{row['acq_time']}_{row.get('satellite','')}_{row.get('instrument','')}"
```

---

## 5. FIRE STATUS SERVICE — Statut feu

> Référence : `obsidian/17_Fonctionnalite_Statut_Feu.md`
> Seuils pour CRON 3h : ACTIVE ≤9h | COOLING ≤24h | LIKELY_OUT >72h | UNKNOWN si pipeline KO

```python
# api/services/fire_status_service.py
from datetime import datetime, timezone
from enum import Enum

class FireStatus(str, Enum):
    ACTIVE     = "ACTIVE"
    COOLING    = "COOLING"
    LIKELY_OUT = "LIKELY_OUT"
    UNKNOWN    = "UNKNOWN"

def compute_fire_status(
    last_seen: datetime,
    now: datetime | None = None,
    pipeline_healthy: bool = True,
) -> tuple[FireStatus, str]:
    """
    Calcule le statut d'un feu selon les règles officielles.
    Retourne (status, reason).

    Seuils (CRON 3h) :
    - ACTIVE     : delta <= 9h
    - COOLING    : 9h < delta <= 24h
    - LIKELY_OUT : delta > 72h
    - UNKNOWN    : pipeline KO ou observation dégradée
    """
    if not pipeline_healthy:
        return FireStatus.UNKNOWN, "DATA_GAP"

    if now is None:
        now = datetime.now(timezone.utc)

    # Normaliser les timezones
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    delta_hours = (now - last_seen).total_seconds() / 3600

    if delta_hours <= 9:
        return FireStatus.ACTIVE, "RECENT_DETECTION"
    elif delta_hours <= 24:
        return FireStatus.COOLING, "NO_DETECTION_9H"
    elif delta_hours <= 72:
        return FireStatus.COOLING, "NO_DETECTION_24H"
    else:
        return FireStatus.LIKELY_OUT, "NO_DETECTION_72H"


def check_reactivation(current_status: str, new_detection: bool) -> bool:
    """
    Retourne True si une réactivation est détectée
    (nouveau signal après LIKELY_OUT).
    """
    return current_status == FireStatus.LIKELY_OUT and new_detection
```

---

## 6. AUTH SERVICE — JWT + Rôles utilisateurs

```python
# api/services/auth_service.py
import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

JWT_SECRET    = os.getenv("JWT_SECRET", "changeme-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE    = int(os.getenv("JWT_EXPIRE_MINUTES", 60))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: int, role: str) -> str:
    payload = {
        "sub":  str(user_id),
        "role": role,
        "exp":  datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_premium(role: str) -> bool:
    """Vérifie que l'utilisateur est Premium ou Admin."""
    return role in ("premium", "admin")
```

### Dépendances FastAPI (middlewares auth)

```python
# api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from services.auth_service import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> dict | None:
    """Retourne l'utilisateur si authentifié, None sinon (Visiteur)."""
    if not token:
        return None
    return decode_token(token)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Requis — lève 401 si non authentifié."""
    user = decode_token(token) if token else None
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    return user

async def require_premium_user(user: dict = Depends(get_current_user)) -> dict:
    """Requis — lève 403 si non Premium."""
    if user.get("role") not in ("premium", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès Premium requis")
    return user
```

---

## 📚 DOCUMENTS ASSOCIÉS

| Document | Description |
|----------|-------------|
| **FastAPI_Modeles_BDD.md** | Schémas SQLAlchemy |
| **FastAPI_Schemas_Pydantic.md** | Validation I/O |
| **FastAPI_Contrats_API.md** | Endpoints REST |
| `obsidian/12_Systeme_Alertes.md` | Matrice alertes |
| `obsidian/17_Fonctionnalite_Statut_Feu.md` | Logique statut feu |
| `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md` | Politique accès |

---

**Date :** Juin 2026 | **Version :** 2.4 | **Projet :** JeryMotro Platform
