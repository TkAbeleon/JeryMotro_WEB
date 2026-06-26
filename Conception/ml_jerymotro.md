---

# JeryMotro ML Microservice

Service de scoring XGBoost pour la plateforme JeryMotro — calcule un score de dangerosité (0–100) pour chaque détection de feu satellite FIRMS Madagascar.

## Endpoints

| Méthode | Route             | Description                        |
| ------- | ----------------- | ---------------------------------- |
| `GET`   | `/`               | Infos modèle + métriques           |
| `GET`   | `/health`         | Keepalive anti-veille              |
| `POST`  | `/predict`        | Scoring batch (≤ 5 000 détections) |
| `GET`   | `/predict/single` | Scoring unitaire via query params  |
| `GET`   | `/docs`           | Swagger UI                         |

## Exemple d'appel batch

```bash
curl -X POST https://<your-space>.hf.space/predict \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [
      {
        "frp": 180,
        "brightness": 350,
        "confidence_score": 90,
        "wind_speed": 12,
        "ndvi_10m": 0.25,
        "slope_deg": 8,
        "relative_humidity": 15,
        "temperature_2m": 40,
        "elevation": 200,
        "detection_id": "det_001",
        "latitude": -19.782,
        "longitude": 46.998
      }
    ],
    "model": "xgboost-v1"
  }'
```

## Anti-veille (cron job)

Configurer un appel `GET /health` toutes les **5 minutes** via n8n ou GitHub Actions pour éviter la mise en veille du Space.

```bash
# Test rapide keepalive
curl https://<your-space>.hf.space/health
```

## Statut actuel du service ML externe

Le service ML externe est actuellement disponible à :

```text
http://35.192.27.164:7860/
```

- `GET /` répond avec un statut `200 OK` et indique que le service est bien actif.
- `GET /health` répond avec `{"status":"ok","model":"loaded"...}`.
- `POST /predict` accepte un objet `{"instances": [...], "model": "xgboost-v1"}` et renvoie une prédiction au format attendu par le backend.

Exemple de réponse de test :

```json
{
  "predictions": [
    {
      "risk_score": 55.2400016784668,
      "fire_label": 1,
      "risk_level": "ÉLEVÉ",
      "model_used": "xgboost-v1",
      "detection_id": "det_001",
      "latitude": -19.782,
      "longitude": 46.998
    }
  ],
  "count": 1,
  "model_used": "xgboost-v1",
  "inference_ms": 1332.12
}
```

Cela confirme que le service externe fonctionne bien et colle avec le backend principal.

## Intégration backend JeryMotro

Dans `.env` du backend FastAPI :

```bash
ML_SERVICE_URL=https://<your-space>.hf.space
ML_SERVICE_API_KEY=
ML_ACTIVE_MODEL=xgboost-v1
```
