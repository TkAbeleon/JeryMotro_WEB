# 🔌 Contrats API — JeryMotro FastAPI

#FastAPI #API #REST #Endpoints

---

## 📋 SOMMAIRE

1. [Vue d'ensemble](#vue-densemble)
2. [Endpoints Auth (Utilisateurs)](#endpoints-auth)
3. [Endpoints Détections](#endpoints-détections)
4. [Endpoints Prédictions](#endpoints-prédictions)
5. [Endpoints Clusters / FireEvent](#endpoints-clusters)
6. [Endpoints Alertes](#endpoints-alertes)
7. [Endpoints Abonnements Alertes](#endpoints-abonnements)
8. [Endpoints Zones Prioritaires (Premium)](#endpoints-zones-prioritaires)
9. [Endpoint Chat IA](#endpoint-chat-ia)
10. [Endpoints Santé](#endpoints-santé)
11. [Codes HTTP](#codes-http)

---

## 1. VUE D'ENSEMBLE

### 1.1 Base URL

- **Production :** `https://api.jerymotro.app`
- **Développement :** `http://localhost:8000`
- **Documentation Swagger :** `http://localhost:8000/docs`
- **Documentation ReDoc :** `http://localhost:8000/redoc`

### 1.2 Format des réponses

Toutes les réponses sont au format JSON avec le Content-Type `application/json`.

### 1.3 Authentification

**3 rôles, 2 protections :**

| Rôle         | Authentification | Endpoints autorisés                                                                                                                                                  |
| ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visiteur** | Aucune           | `GET /detections`, `GET /clusters`, `GET /predictions/*`, `POST /chat` (général)                                                                                     |
| **Standard** | JWT Bearer       | + `POST /alerts/subscribe` (EMAIL uniquement) · `GET /alerts/me`                                                                                                     |
| **Premium**  | JWT Bearer       | + Abonnements WhatsApp/SMS · `POST /alerts/trigger` · **`GET /zones`, `POST /zones`, `DELETE /zones/{id}` (Zones prioritaires) · `POST /chat` (+ Agent IA de zone)** |

---

## 2. ENDPOINTS AUTH

### 2.1 POST /auth/register

**Description :** Crée un compte Standard (rôle par défaut).

#### Body Request

```json
{
  "email": "user@test.mg",
  "password": "motdepasse123",
  "full_name": "Rakoto Andry",
  "organization": null
}
```

#### Réponse Success (201 Created)

```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@test.mg",
    "role": "standard",
    "is_active": true
  }
}
```

---

### 2.2 POST /auth/login

#### Body Request

```json
{ "username": "user@test.mg", "password": "motdepasse123" }
```

#### Réponse Success (200 OK)

```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "bearer",
  "user": { "id": 1, "email": "user@test.mg", "role": "standard" }
}
```

---

### 2.3 PUT /auth/me/contacts

**Description :** Mise à jour des numéros de contact (Premium, pour WhatsApp/SMS).

**Auth :** Bearer Token requis.

#### Body Request

```json
{
  "phone_number": "+261320000000",
  "whatsapp_number": "+261320000000"
}
```

#### Réponse Success (200 OK)

```json
{ "message": "Contacts mis à jour avec succès" }
```

---

### 2.4 GET /auth/me

**Description :** Récupérer les informations du profil de l'utilisateur connecté.

**Auth :** Bearer Token requis.

#### Réponse Success (200 OK)

```json
{
  "id": 1,
  "email": "user@test.mg",
  "full_name": "Rakoto Andry",
  "organization": null,
  "role": "standard",
  "is_active": true
}
```

---

---

### 2.4 GET /auth/me

**Description :** Récupérer les informations du profil de l'utilisateur connecté.

**Auth :** Bearer Token requis.

#### Réponse Success (200 OK)

```json
{
  "id": 1,
  "email": "user@test.mg",
  "full_name": "Rakoto Andry",
  "organization": null,
  "role": "standard",
  "is_active": true
}
```

---

### 2.5 PUT /auth/me/profile

**Description :** Mise à jour des informations de profil (nom, organisation).

**Auth :** Bearer Token requis.

#### Body Request

```json
{
  "full_name": "Nouveau Nom",
  "organization": "Nouvelle ONG"
}
```

#### Réponse Success (200 OK)

```json
{
  "id": 1,
  "email": "user@test.mg",
  "full_name": "Nouveau Nom",
  "organization": "Nouvelle ONG",
  "role": "standard",
  "is_active": true
}
```

---

### 2.6 DELETE /auth/me

**Description :** Supprimer le compte de l'utilisateur connecté.

**Auth :** Bearer Token requis.

#### Réponse Success (204 No Content)

_(Aucun contenu retourné)_

---

## 3. ENDPOINTS DÉTECTIONS

### 3.1 GET /detections/

**Accès :** Public (Visiteur, Standard, Premium)

**Description :** Récupère les détections FIRMS filtrées avec leurs scores de risque JeryMotroNet.

#### Paramètres Query

| Paramètre       | Type    | Requis | Par défaut | Description                                          |
| --------------- | ------- | ------ | ---------- | ---------------------------------------------------- |
| `date_from`     | date    | Non    | -          | Date début (format: YYYY-MM-DD)                      |
| `date_to`       | date    | Non    | -          | Date fin (format: YYYY-MM-DD)                        |
| `min_frp`       | float   | Non    | 0.0        | FRP minimum en MW                                    |
| `max_frp`       | float   | Non    | -          | FRP maximum en MW                                    |
| `min_risk`      | float   | Non    | 0.0        | Score risque minimum (0.0-1.0)                       |
| `max_risk`      | float   | Non    | -          | Score risque maximum (0.0-1.0)                       |
| `source`        | string  | Non    | -          | Source satellite (MODIS / VIIRS_SNPP / VIIRS_NOAA21) |
| `confidence`    | string  | Non    | -          | Confiance NASA (low / nominal / high)                |
| `daynight`      | string  | Non    | -          | Moment acquisition (D / N)                           |
| `region`        | string  | Non    | -          | Région Madagascar (ex: "Menabe", "Boeny")            |
| `is_dry_season` | boolean | Non    | -          | Filtrer saison sèche                                 |
| `cluster_id`    | integer | Non    | -          | ID cluster spécifique                                |
| `exclude_noise` | boolean | Non    | true       | Exclure points isolés (cluster_id=-1)                |
| `limit`         | integer | Non    | 1000       | Nombre max résultats (max: 10000)                    |
| `offset`        | integer | Non    | 0          | Pagination                                           |

#### Réponse Success (200 OK)

````json
{
  "detections": [
    {
      "id": 1,
      "latitude": -18.234,
      "longitude": 44.567,
      "brightness": 342.1,
      "bright_t31": 298.4,
      "diff_brightness": 43.7,
      "frp": 87.3,
      "frp_log": 4.47,
      "confidence": "high",
      "confidence_num": 90,
      "acq_date": "2026-03-30",
      "acq_time": "0845",
      "local_hour": 11,
      "satellite": "NOAA-21",
      "instrument": "VIIRS",
      "daynight": "D",
      "scan": 0.52,
      "track": 0.49,
      "scan_track_ratio": 1.06,
      "source": "VIIRS_NOAA21",
      "risk_score": 0.84,
      "fire_label": 1,
      "cluster_id": 5,
      "cluster_size": 12,
      "cluster_frp_total": 847.2,
      "cluster_frp_max": 134.5,
      "is_noise": 0,
      "is_dry_season": 0,
      "temperature_2m": 28.4,
      "relative_humidity": 45.2,
      "wind_speed": 3.8,
      "landcover": "Grassland",
      "slope_deg": 2.3,
      "ndvi_10m": 0.42,
      "is_recent_loss": 0,
      "created_at": "2026-03-30T09:15:23.123Z"
    }
  ],
  "count": 1,
  "total": 47,
  "limit": 1000,
  "offset": 0,
  "filters_applied": {

  ### 2.7 POST /auth/otp/request

  Description : Demande de code OTP (One-Time Password) pour authentification sans OAuth2 Google.

  Body Request

  ```json
  {
    "email": "user@test.mg",
    "via": "sms"  // "sms" ou "email"
  }
````

Réponse Success (200 OK)

```json
{ "message": "OTP généré et envoyé si méthode configurée" }
```

Notes :

- Si `via` == `sms` l'API tentera d'envoyer le code via l'intégration Orange OneAPI.
- L'envoi SMS est optionnel et ne peut être utilisé pour les fonctionnalités Premium (SMS/WhatsApp) tant que `phone_verified` n'est pas `true`.

### 2.8 POST /auth/otp/verify

Description : Vérification du code OTP. Si valide, l'utilisateur reçoit un JWT et le champ `phone_verified` est mis à jour si la vérification concernait un numéro de téléphone.

Body Request

```json
{
  "email": "user@test.mg",
  "code": "123456"
}
```

Réponse Success (200 OK)

```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```

Réponse Erreur (400/422) si code invalide ou expiré.

    "date_to": null,
    "min_frp": 0.0,
    "min_risk": 0.0,
    "source": null

}
}

````

#### Exemple requête cURL

```bash
curl -X GET "http://localhost:8000/detections/?date_from=2026-03-30&min_risk=0.5&limit=100" \
  -H "accept: application/json"
````

---

### 3.2 GET /detections/{id}

**Description :** Récupère une détection spécifique par son ID.

#### Paramètres Path

| Paramètre | Type    | Description               |
| --------- | ------- | ------------------------- |
| `id`      | integer | ID unique de la détection |

#### Réponse Success (200 OK)

```json
{
  "id": 1,
  "latitude": -18.234,
  "longitude": 44.567,
  "brightness": 342.1,
  "frp": 87.3,
  "risk_score": 0.84,
  "cluster_id": 5,
  "created_at": "2026-03-30T09:15:23.123Z"
}
```

#### Réponse Not Found (404)

```json
{
  "detail": "Detection with id 999 not found"
}
```

---

### 3.3 GET /detections/stats/daily

**Description :** Statistiques agrégées par jour.

#### Paramètres Query

| Paramètre   | Type | Requis | Description |
| ----------- | ---- | ------ | ----------- |
| `date_from` | date | Non    | Date début  |
| `date_to`   | date | Non    | Date fin    |

#### Réponse Success (200 OK)

```json
{
  "stats": [
    {
      "date": "2026-03-30",
      "total_detections": 47,
      "high_risk_count": 12,
      "avg_frp": 42.3,
      "max_frp": 187.4,
      "active_clusters": 4,
      "regions_affected": ["Menabe", "Boeny", "Sofia"]
    }
  ]
}
```

---

## 4. ENDPOINTS PRÉDICTIONS

### 4.1 GET /predictions/

**Accès :** Public (Visiteur, Standard, Premium)

**Description :** Récupère les prédictions de risque J+1 générées par JeryMotroNet ConvLSTM.

#### Paramètres Query

| Paramètre  | Type    | Requis | Description                         |
| ---------- | ------- | ------ | ----------------------------------- |
| `date`     | date    | Non    | Date de prédiction (défaut: demain) |
| `region`   | string  | Non    | Région Madagascar                   |
| `min_risk` | float   | Non    | Score risque minimum                |
| `limit`    | integer | Non    | Nombre max résultats                |

#### Réponse Success (200 OK)

```json
{
  "predictions": [
    {
      "id": 1,
      "prediction_date": "2026-03-31",
      "latitude": -18.25,
      "longitude": 44.58,
      "risk_score_j1": 0.76,
      "confidence": 0.89,
      "model_version": "convlstm_v1.2",
      "input_window_days": 7,
      "created_at": "2026-03-30T10:00:00.000Z"
    }
  ],
  "count": 1,
  "prediction_date": "2026-03-31",
  "model_info": {
    "name": "JeryMotroConvLSTM",
    "version": "1.2",
    "grid_resolution_m": 375,
    "input_sequence_days": 7
  }
}
```

---

### 4.2 GET /predictions/risk-map

**Accès :** Public (Visiteur, Standard, Premium)

**Description :** Retourne la carte de risque complète sous forme de GeoJSON pour affichage Google Maps.

#### Paramètres Query

| Paramètre  | Type   | Requis | Description             |
| ---------- | ------ | ------ | ----------------------- |
| `date`     | date   | Oui    | Date de prédiction      |
| `format`   | string | Non    | Format (geojson / json) |
| `min_risk` | float  | Non    | Filtrer risque minimum  |

#### Réponse Success (200 OK) - GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [44.58, -18.25]
      },
      "properties": {
        "risk_score": 0.76,
        "confidence": 0.89,
        "grid_cell_id": "18250_44580",
        "prediction_date": "2026-03-31"
      }
    }
  ],
  "metadata": {
    "prediction_date": "2026-03-31",
    "total_cells": 1024,
    "high_risk_cells": 87,
    "model_version": "convlstm_v1.2"
  }
}
```

---

## 5. ENDPOINTS CLUSTERS / FIREEVENT

**Accès :** Public (Visiteur, Standard, Premium)

### 5.1 GET /clusters/

**Description :** Récupère les clusters de feux détectés par HDBSCAN avec leur **statut** (`ACTIVE / COOLING / LIKELY_OUT / UNKNOWN`).

#### Paramètres Query

| Paramètre       | Type    | Requis | Description                                             |
| --------------- | ------- | ------ | ------------------------------------------------------- |
| `date_from`     | date    | Non    | Date début                                              |
| `date_to`       | date    | Non    | Date fin                                                |
| `min_size`      | integer | Non    | Taille minimale cluster                                 |
| `min_frp_total` | float   | Non    | FRP total minimum                                       |
| `active_only`   | boolean | Non    | Clusters actifs uniquement                              |
| `status`        | string  | Non    | Filtre statut : ACTIVE / COOLING / LIKELY_OUT / UNKNOWN |

#### Réponse Success (200 OK)

```json
{
  "clusters": [
    {
      "id": 5,
      "cluster_date": "2026-03-30",
      "cluster_size": 12,
      "cluster_frp_total": 847.2,
      "cluster_frp_max": 134.5,
      "cluster_brightness_mean": 352.3,
      "center_latitude": -20.3,
      "center_longitude": 44.1,
      "radius_km": 0.68,
      "duration_hours": 18,
      "first_detection": "2026-03-30T06:30:00Z",
      "last_detection": "2026-03-31T00:45:00Z",
      "hours_since_last_seen": 4.2,
      "region": "Menabe",
      "risk_level": "HIGH",
      "cluster_status": "ACTIVE",
      "status_reason": "RECENT_DETECTION",
      "reactivation_count": 0,
      "detections_count": 12
    }
  ],
  "count": 1,
  "total": 4
}
```

---

### 5.2 GET /clusters/{id}/detections

**Description :** Récupère toutes les détections d'un cluster spécifique.

#### Paramètres Path

| Paramètre | Type    | Description   |
| --------- | ------- | ------------- |
| `id`      | integer | ID du cluster |

#### Réponse Success (200 OK)

```json
{
  "cluster_id": 5,
  "detections": [
    {
      "id": 1,
      "latitude": -20.3,
      "longitude": 44.1,
      "frp": 134.5,
      "acq_date": "2026-03-30",
      "acq_time": "0630"
    }
  ],
  "count": 12
}
```

---

## 6. ENDPOINTS ALERTES

### 6.1 GET /alerts/

**Accès :** Standard + Premium (historique personnel) | Admin (tout voir)

**Description :** Récupère l'historique des alertes émises.

#### Paramètres Query

| Paramètre   | Type   | Requis | Description                             |
| ----------- | ------ | ------ | --------------------------------------- |
| `date_from` | date   | Non    | Date début                              |
| `date_to`   | date   | Non    | Date fin                                |
| `level`     | string | Non    | Niveau (LOW / MEDIUM / HIGH / CRITICAL) |
| `status`    | string | Non    | Statut (PENDING / SENT / FAILED)        |
| `channel`   | string | Non    | Canal (EMAIL / SMS / WHATSAPP)          |

#### Réponse Success (200 OK)

```json
{
  "alerts": [
    {
      "id": 1,
      "created_at": "2026-03-30T14:32:00Z",
      "alert_level": "HIGH",
      "cluster_id": 5,
      "region": "Menabe",
      "latitude": -20.3,
      "longitude": 44.1,
      "risk_score": 0.92,
      "frp": 187.4,
      "message": "🔥 Alerte JeryMotro\nRégion: Menabe\nRisque: 92%",
      "channels_sent": ["EMAIL", "WHATSAPP"],
      "email_status": "SENT",
      "sms_status": "SENT",
      "whatsapp_status": "SENT",
      "images": [
        "https://i.ibb.co/abc123/thermal.png",
        "https://i.ibb.co/def456/visible.png"
      ],
      "recipients_count": 3
    }
  ],
  "count": 1,
  "total": 47
}
```

---

### 6.2 POST /alerts/trigger

**Accès :** Admin / n8n (clé interne)

**Description :** Déclenche manuellement une alerte.

#### Body Request

```json
{
  "cluster_id": 5,
  "risk_score": 0.92,
  "frp": 187.4,
  "region": "Menabe",
  "latitude": -20.3,
  "longitude": 44.1,
  "force_send": false
}
```

#### Réponse Success (201 Created)

```json
{
  "alert_id": 1,
  "status": "SENT",
  "channels": ["EMAIL", "WHATSAPP"],
  "message": "Alert triggered successfully"
}
```

---

## 7. ENDPOINTS ABONNEMENTS ALERTES

### 7.1 POST /alerts/subscribe

**Accès :** Standard (EMAIL seulement) | Premium (EMAIL + WhatsApp + SMS)

**Auth :** Bearer Token requis.

#### Body Request

```json
{
  "channel": "EMAIL",
  "destination": "user@example.mg",
  "min_risk": 0.7,
  "min_frp": 50.0
}
```

#### Réponse Success (201 Created)

```json
{
  "id": 1,
  "channel": "EMAIL",
  "destination": "user@example.mg",
  "enabled": true,
  "min_risk": 0.7,
  "min_frp": 50.0
}
```

#### Réponse Forbidden (403) — Standard tentant WhatsApp/SMS

```json
{ "detail": "Accès Premium requis pour les canaux WhatsApp et SMS" }
```

---

### 7.2 GET /alerts/me

**Accès :** Standard + Premium

**Auth :** Bearer Token requis.

**Description :** Récupère les abonnements et l'historique d'alertes de l'utilisateur connecté.

#### Réponse Success (200 OK)

```json
{
  "subscriptions": [
    { "id": 1, "channel": "EMAIL", "destination": "user@mg", "enabled": true }
  ],
  "alerts_history": [
    {
      "id": 5,
      "alert_level": "HIGH",
      "region": "Menabe",
      "risk_score": 0.84,
      "channel": "EMAIL",
      "status": "SENT",
      "sent_at": "2026-03-30T14:32:00Z"
    }
  ]
}
```

---

### 7.3 DELETE /alerts/subscribe/{id}

**Accès :** Standard + Premium (propriétaire uniquement)

**Auth :** Bearer Token requis.

#### Réponse Success (200 OK)

```json
{ "message": "Abonnement supprimé avec succès" }
```

---

## 8. ENDPOINTS ZONES PRIORITAIRES (Premium)

**Accès :** Premium uniquement (requiert un Token Bearer Premium).

### 8.1 GET /zones/

**Description :** Liste toutes les zones prioritaires de surveillance configurées par l'utilisateur connecté.

#### Réponse Success (200 OK)

```json
[
  {
    "id": 1,
    "user_id": 12,
    "name": "Parc National d'Ankarafantsika",
    "latitude": -16.3,
    "longitude": 46.8,
    "radius_km": 15.0,
    "min_risk": 0.6,
    "min_frp": 30.0,
    "custom_ai_prompt": "Tu es un agent expert du Parc d'Ankarafantsika. Concentre-toi sur la préservation des lémuriens et de la forêt sèche.",
    "created_at": "2026-03-30T10:00:00.000Z"
  }
]
```

---

### 8.2 POST /zones/

**Description :** Crée une nouvelle zone prioritaire de surveillance sur Google Maps.

#### Body Request

```json
{
  "name": "Aire Protégée de Menabe-Antimena",
  "latitude": -20.1,
  "longitude": 44.5,
  "radius_km": 20.0,
  "min_risk": 0.7,
  "min_frp": 50.0,
  "custom_ai_prompt": "Agent dédié au Menabe-Antimena. Surveille en priorité les coupes illégales de forêts de baobabs."
}
```

#### Réponse Success (201 Created)

```json
{
  "id": 2,
  "user_id": 12,
  "name": "Aire Protégée de Menabe-Antimena",
  "latitude": -20.1,
  "longitude": 44.5,
  "radius_km": 20.0,
  "min_risk": 0.7,
  "min_frp": 50.0,
  "custom_ai_prompt": "Agent dédié au Menabe-Antimena. Surveille en priorité les coupes illégales de forêts de baobabs.",
  "created_at": "2026-03-30T10:15:00.000Z"
}
```

---

### 8.3 DELETE /zones/{id}

**Description :** Supprime une zone prioritaire par son ID.

#### Réponse Success (200 OK)

```json
{
  "message": "Zone de surveillance supprimée avec succès"
}
```

---

## 9. ENDPOINT CHAT IA

### 9.1 POST /chat/

**Accès :** Public (Visiteur, Standard, Premium)

**Description :** Interagit avec JeryMotro AI via RAG (Groq + ChromaDB). Si `zone_id` est spécifié (Premium uniquement), la question est traitée par un **Agent IA personnalisé** configuré spécifiquement avec les instructions et le contexte de cette zone.

#### Body Request

```json
{
  "message": "Quels sont les derniers risques détectés dans ma zone ?",
  "conversation_id": "uuid-optional",
  "temperature": 0.1,
  "zone_id": 1
}
```

**Schéma Pydantic :**

```python
class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Question utilisateur"
    )
    conversation_id: Optional[str] = None
    temperature: float = Field(default=0.1, ge=0.0, le=1.0)
    zone_id: Optional[int] = Field(default=None, description="ID de la zone prioritaire (Premium uniquement)")
```

#### Réponse Success (200 OK)

```json
{
  "response": "D'après les données du 23 au 30 mars 2026, la région Menabe est la plus touchée avec 38% des détections (18 feux actifs), suivie de Boeny (19%). Le cluster 5 dans le Menabe présente un risque de 92% avec un FRP total de 847 MW.",
  "sources": [
    "Résumé journalier 30/03/2026",
    "Cluster 5 (Menabe)",
    "Tendances hebdomadaires S13/2026"
  ],
  "data_context": {
    "clusters_referenced": [5],
    "date_range": "2026-03-23 to 2026-03-30",
    "regions_mentioned": ["Menabe", "Boeny"]
  },
  "model_used": "llama3-8b-8192",
  "tokens_used": 342,
  "response_time_ms": 1247
}
```

#### Réponse Hors Contexte (200 OK)

```json
{
  "response": "Je suis limité aux données JeryMotro. Consultez les sources NASA directement.",
  "sources": [],
  "data_context": {},
  "model_used": "llama3-8b-8192"
}
```

---

## 10. ENDPOINTS SANTÉ

### 10.1 GET /

**Description :** Endpoint racine (santé basique).

#### Réponse Success (200 OK)

```json
{
  "status": "ok",
  "service": "JeryMotro Platform API v2.2",
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

---

### 10.2 GET /health

**Description :** Health check détaillé.

#### Réponse Success (200 OK)

```json
{
  "status": "healthy",
  "version": "2.2.0",
  "services": {
    "database": "connected",
    "chromadb": "connected",
    "groq_api": "available"
  },
  "uptime_seconds": 3600,
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

#### Réponse Degraded (503 Service Unavailable)

```json
{
  "status": "degraded",
  "version": "2.2.0",
  "services": {
    "database": "connected",
    "chromadb": "disconnected",
    "groq_api": "available"
  },
  "errors": ["ChromaDB connection failed"]
}
```

---

## 11. CODES HTTP

| Code    | Signification         | Usage                                               |
| ------- | --------------------- | --------------------------------------------------- |
| **200** | OK                    | Requête réussie                                     |
| **201** | Created               | Ressource créée (register, subscribe, trigger)      |
| **400** | Bad Request           | Paramètres invalides                                |
| **401** | Unauthorized          | Token manquant ou invalide                          |
| **403** | Forbidden             | Rôle insuffisant (ex: Standard tentant WhatsApp)    |
| **404** | Not Found             | Ressource inexistante                               |
| **409** | Conflict              | Doublon (email déjà utilisé, abonnement déjà actif) |
| **422** | Unprocessable Entity  | Validation Pydantic échouée                         |
| **500** | Internal Server Error | Erreur serveur                                      |
| **503** | Service Unavailable   | Service dégradé (BDD down, etc.)                    |

---

## 📚 DOCUMENTS ASSOCIÉS

| Document                                             | Description                               |
| ---------------------------------------------------- | ----------------------------------------- |
| **FastAPI_Modeles_BDD.md**                           | Schémas SQLAlchemy + 3 rôles utilisateurs |
| **FastAPI_Schemas_Pydantic.md**                      | Détail des modèles de validation          |
| **FastAPI_Services_Metier.md**                       | Implémentation logique métier             |
| **FastAPI_Tests_Unitaires.md**                       | Tests des endpoints                       |
| `obsidian/19_Acces_Sans_Inscription_Auth_Alertes.md` | Politique accès par rôle                  |

---

**Date de dernière mise à jour :** Mai 2026  
**Version API :** 2.3.0  
**Base URL :** `http://localhost:8000`
