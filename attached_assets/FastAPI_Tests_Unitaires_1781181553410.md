# 🧪 Tests Unitaires — JeryMotro FastAPI
#FastAPI #Tests #Pytest #Unitaires #CI

---

## 📋 SOMMAIRE

1. [Stratégie de tests](#1-stratégie)
2. [Configuration (conftest.py)](#2-conftest)
3. [Tests Santé / Health](#3-tests-santé)
4. [Tests Détections](#4-tests-détections)
5. [Tests Clusters / FireEvent](#5-tests-clusters)
6. [Tests Prédictions](#6-tests-prédictions)
7. [Tests Chat IA](#7-tests-chat-ia)
8. [Tests Alertes](#8-tests-alertes)
9. [Tests Auth + Rôles](#9-tests-auth)
10. [Commandes d'exécution](#10-commandes)

---

## 1. STRATÉGIE

| Couche | Outil | Objectif |
|--------|-------|----------|
| **Endpoints** | `httpx.AsyncClient` + `pytest-asyncio` | Tester les routes HTTP |
| **Services** | `pytest` + mocks | Tester la logique métier isolée |
| **BDD** | Base SQLite en mémoire | Pas de dépendance PostgreSQL |
| **Groq/Twilio** | `unittest.mock` | Pas d'appels réels aux APIs payantes |

**Cible couverture :** ≥ 60% (exigence cahier des charges `01_Cahier_des_Charges.md`)

---

## 2. CONFTEST.PY — Fixtures partagées

```python
# api/tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

# ── Base de test en mémoire ───────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncTestSession = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncTestSession() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

# ── Client HTTP de test ───────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def client(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()

# ── Fixture utilisateur Standard ─────────────────────────────────────────────
@pytest_asyncio.fixture
async def standard_user_token(client):
    await client.post("/auth/register", json={
        "email": "standard@test.mg",
        "password": "test1234!",
        "full_name": "Utilisateur Standard",
    })
    res = await client.post("/auth/login", json={
        "username": "standard@test.mg",
        "password": "test1234!",
    })
    return res.json()["access_token"]

# ── Fixture utilisateur Premium ───────────────────────────────────────────────
@pytest_asyncio.fixture
async def premium_user_token(client):
    """Token simulé Premium pour tester les routes protégées."""
    from services.auth_service import create_access_token
    return create_access_token(user_id=99, role="premium")
```

---

## 3. TESTS SANTÉ

```python
# api/tests/test_health.py
import pytest

@pytest.mark.asyncio
async def test_root(client):
    res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "JeryMotro" in data["service"]

@pytest.mark.asyncio
async def test_health_ok(client):
    res = await client.get("/health")
    assert res.status_code in (200, 503)
    data = res.json()
    assert "status" in data
    assert data["status"] in ("healthy", "degraded")
    assert "version" in data
```

---

## 4. TESTS DÉTECTIONS

```python
# api/tests/test_detections.py
import pytest
from datetime import date

@pytest.mark.asyncio
async def test_get_detections_empty(client):
    """BDD vide → retourne liste vide."""
    res = await client.get("/detections/")
    assert res.status_code == 200
    data = res.json()
    assert "detections" in data
    assert data["count"] == 0

@pytest.mark.asyncio
async def test_get_detections_filter_frp(client):
    """Filtre min_frp — tous les résultats doivent respecter le seuil."""
    res = await client.get("/detections/?min_frp=50.0")
    assert res.status_code == 200
    data = res.json()
    for det in data["detections"]:
        assert det["frp"] is None or det["frp"] >= 50.0

@pytest.mark.asyncio
async def test_get_detections_filter_risk(client):
    res = await client.get("/detections/?min_risk=0.7")
    assert res.status_code == 200
    data = res.json()
    for det in data["detections"]:
        assert det["risk_score"] is None or det["risk_score"] >= 0.7

@pytest.mark.asyncio
async def test_get_detections_filter_source(client):
    res = await client.get("/detections/?source=VIIRS_NOAA21")
    assert res.status_code == 200
    for det in res.json()["detections"]:
        assert det["source"] == "VIIRS_NOAA21"

@pytest.mark.asyncio
async def test_get_detection_by_id_not_found(client):
    res = await client.get("/detections/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_detection_invalid_id(client):
    res = await client.get("/detections/abc")
    assert res.status_code == 422   # Validation Pydantic

@pytest.mark.asyncio
async def test_get_detections_pagination(client):
    res = await client.get("/detections/?limit=10&offset=0")
    assert res.status_code == 200
    assert res.json()["limit"] == 10

@pytest.mark.asyncio
async def test_get_detections_daily_stats(client):
    res = await client.get("/detections/stats/daily")
    assert res.status_code == 200
    assert "stats" in res.json()
```

---

## 5. TESTS CLUSTERS / FIREEVENT

```python
# api/tests/test_clusters.py
import pytest

@pytest.mark.asyncio
async def test_get_clusters_empty(client):
    res = await client.get("/clusters/")
    assert res.status_code == 200
    data = res.json()
    assert "clusters" in data
    assert data["count"] == 0

@pytest.mark.asyncio
async def test_get_clusters_filter_status(client):
    res = await client.get("/clusters/?status=ACTIVE")
    assert res.status_code == 200
    for cluster in res.json()["clusters"]:
        assert cluster["cluster_status"] == "ACTIVE"

@pytest.mark.asyncio
async def test_get_cluster_detections_not_found(client):
    res = await client.get("/clusters/99999/detections")
    assert res.status_code == 404

# ── Tests unitaires service statut feu ───────────────────────────────────────
from datetime import datetime, timezone, timedelta
from services.fire_status_service import compute_fire_status, FireStatus

def test_status_active():
    now       = datetime.now(timezone.utc)
    last_seen = now - timedelta(hours=5)
    status, reason = compute_fire_status(last_seen, now, pipeline_healthy=True)
    assert status == FireStatus.ACTIVE

def test_status_cooling():
    now       = datetime.now(timezone.utc)
    last_seen = now - timedelta(hours=15)
    status, reason = compute_fire_status(last_seen, now, pipeline_healthy=True)
    assert status == FireStatus.COOLING

def test_status_likely_out():
    now       = datetime.now(timezone.utc)
    last_seen = now - timedelta(hours=80)
    status, reason = compute_fire_status(last_seen, now, pipeline_healthy=True)
    assert status == FireStatus.LIKELY_OUT

def test_status_unknown_pipeline_ko():
    now       = datetime.now(timezone.utc)
    last_seen = now - timedelta(hours=5)
    status, reason = compute_fire_status(last_seen, now, pipeline_healthy=False)
    assert status == FireStatus.UNKNOWN
    assert reason == "DATA_GAP"
```

---

## 6. TESTS PRÉDICTIONS

```python
# api/tests/test_predictions.py
import pytest
from datetime import date

@pytest.mark.asyncio
async def test_get_predictions_empty(client):
    res = await client.get("/predictions/")
    assert res.status_code == 200
    assert "predictions" in res.json()

@pytest.mark.asyncio
async def test_get_risk_map_missing_date(client):
    """date est requis pour /risk-map."""
    res = await client.get("/predictions/risk-map")
    assert res.status_code == 422

@pytest.mark.asyncio
async def test_get_risk_map_valid_date(client):
    res = await client.get("/predictions/risk-map?date=2026-05-15")
    assert res.status_code in (200, 404)
    if res.status_code == 200:
        data = res.json()
        assert data["type"] == "FeatureCollection"
```

---

## 7. TESTS CHAT IA

```python
# api/tests/test_chat.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_chat_valid_message(client):
    """Test avec mock du service RAG — pas d'appel Groq réel."""
    mock_response = {
        "response":         "D'après les données JeryMotro, la région Menabe...",
        "sources":          ["Cluster 5 (Menabe)"],
        "data_context":     {},
        "model_used":       "llama3-8b-8192",
        "tokens_used":      150,
        "response_time_ms": 500,
    }
    with patch("routers.chat.rag_query", new_callable=AsyncMock, return_value=mock_response):
        res = await client.post("/chat/", json={"message": "Quelle région est la plus touchée ?"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "sources"  in data

@pytest.mark.asyncio
async def test_chat_message_too_short(client):
    res = await client.post("/chat/", json={"message": "ab"})
    assert res.status_code == 422   # Validation : min_length=3

@pytest.mark.asyncio
async def test_chat_message_too_long(client):
    res = await client.post("/chat/", json={"message": "x" * 501})
    assert res.status_code == 422   # Validation : max_length=500

@pytest.mark.asyncio
async def test_chat_missing_message(client):
    res = await client.post("/chat/", json={})
    assert res.status_code == 422
```

---

## 8. TESTS ALERTES

```python
# api/tests/test_alerts.py
import pytest
from unittest.mock import patch

@pytest.mark.asyncio
async def test_get_alerts_empty(client):
    res = await client.get("/alerts/")
    assert res.status_code == 200
    assert "alerts" in res.json()

@pytest.mark.asyncio
async def test_trigger_alert_unauthorized(client):
    """Déclenchement manuel → doit être protégé."""
    res = await client.post("/alerts/trigger", json={
        "risk_score": 0.92,
        "frp":        200.0,
        "region":     "Menabe",
        "latitude":   -20.3,
        "longitude":  44.1,
    })
    # Doit être 401 (non authentifié) ou 403 (non admin)
    assert res.status_code in (401, 403)

@pytest.mark.asyncio
async def test_subscribe_alert_unauthenticated(client):
    """Visiteur ne peut pas s'abonner aux alertes."""
    res = await client.post("/alerts/subscribe", json={
        "channel":     "EMAIL",
        "destination": "test@test.mg",
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_subscribe_whatsapp_requires_premium(client, standard_user_token):
    """Standard ne peut pas s'abonner WhatsApp."""
    res = await client.post(
        "/alerts/subscribe",
        json={"channel": "WHATSAPP", "destination": "+261320000000"},
        headers={"Authorization": f"Bearer {standard_user_token}"},
    )
    assert res.status_code == 403
```

---

## 9. TESTS AUTH + RÔLES

```python
# api/tests/test_auth.py
import pytest

@pytest.mark.asyncio
async def test_register_standard_user(client):
    res = await client.post("/auth/register", json={
        "email":    "user@test.mg",
        "password": "password123!",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "standard"

@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@test.mg", "password": "password123!"}
    await client.post("/auth/register", json=payload)
    res = await client.post("/auth/register", json=payload)
    assert res.status_code == 409

@pytest.mark.asyncio
async def test_login_valid(client):
    await client.post("/auth/register", json={
        "email": "login@test.mg", "password": "test1234!"
    })
    res = await client.post("/auth/login", json={
        "username": "login@test.mg", "password": "test1234!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "email": "wrong@test.mg", "password": "correct_pass!"
    })
    res = await client.post("/auth/login", json={
        "username": "wrong@test.mg", "password": "bad_pass"
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_visitor_can_access_detections(client):
    """Visiteur (non authentifié) peut lire les détections."""
    res = await client.get("/detections/")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_visitor_cannot_subscribe_alerts(client):
    """Visiteur ne peut pas s'abonner aux alertes."""
    res = await client.post("/alerts/subscribe", json={
        "channel": "EMAIL", "destination": "x@x.mg"
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_standard_cannot_use_whatsapp(client, standard_user_token):
    """Standard ne peut pas activer WhatsApp."""
    res = await client.post(
        "/alerts/subscribe",
        json={"channel": "WHATSAPP", "destination": "+261320000000"},
        headers={"Authorization": f"Bearer {standard_user_token}"},
    )
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_premium_can_use_all_channels(client, premium_user_token):
    """Premium peut s'abonner à tous les canaux."""
    for channel, dest in [
        ("EMAIL",    "premium@test.mg"),
        ("WHATSAPP", "+261320000001"),
        ("SMS",      "+261320000002"),
    ]:
        res = await client.post(
            "/alerts/subscribe",
            json={"channel": channel, "destination": dest},
            headers={"Authorization": f"Bearer {premium_user_token}"},
        )
        assert res.status_code in (200, 201)
```

---

## 10. COMMANDES D'EXÉCUTION

```bash
# Installation des dépendances de test
pip install pytest pytest-asyncio httpx aiosqlite

# Lancer tous les tests
cd api
pytest tests/ -v

# Avec couverture
pytest tests/ -v --cov=. --cov-report=term-missing --cov-report=html

# Un fichier spécifique
pytest tests/test_detections.py -v

# Tests marqués asyncio uniquement
pytest tests/ -v -m asyncio

# Rapport HTML de couverture
open htmlcov/index.html
```

### Configuration pytest.ini

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

---

## 📚 DOCUMENTS ASSOCIÉS

| Document | Description |
|----------|-------------|
| **FastAPI_Services_Metier.md** | Logique testée |
| **FastAPI_Contrats_API.md** | Endpoints testés |
| **FastAPI_Schemas_Pydantic.md** | Schémas de validation |
| `obsidian/01_Cahier_des_Charges.md` | Exigence ≥ 60% couverture |

---

**Date :** Mai 2026 | **Version :** 2.3 | **Projet :** JeryMotro Platform
