# Guide Frontend — Alertes & Historique JeryMotro

Ce guide décrit l'intégration frontend de la partie alertes: abonnement aux canaux, vérification OTP, affichage de l'historique et déclenchement de test admin.

## Etat DB Verifie

Verification effectuee le 2026-06-29:

| Indicateur | Valeur |
|---|---:|
| Alertes en base | 85 |
| Premiere alerte | 2026-06-15 |
| Derniere alerte | 2026-06-29 |
| EMAIL envoyes | 24 |
| SMS envoyes | 26 |
| WHATSAPP envoyes | 35 |
| Statuts observes | SENT uniquement |

Pour l'utilisateur `randriamanantenatsikynyantsa@gmail.com`, les alertes recentes sont bien presentes en base sur les trois canaux: `EMAIL`, `SMS`, `WHATSAPP`.

## Base API

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8200";
```

Toutes les routes ci-dessous necessitent le header JWT:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

| Fonction | Methode | Route | Auth |
|---|---:|---|---|
| Historique personnel | GET | `/alerts/me?limit=50&offset=0` | User |
| Liste abonnements | GET | `/alerts/subscriptions` | User |
| Creer/mettre a jour abonnement | POST | `/alerts/subscribe` | User |
| Verifier abonnement OTP | POST | `/alerts/subscriptions/{id}/verify` | User |
| Renvoyer OTP | POST | `/alerts/subscriptions/{id}/resend` | User |
| Supprimer abonnement | DELETE | `/alerts/subscribe/{id}` | User |
| Declencher alerte test | POST | `/alerts/trigger` | Admin |

## Historique Des Alertes

### Requete

```http
GET /alerts/me?limit=50&offset=0
```

### Reponse

```json
{
  "alerts": [
    {
      "id": 91,
      "alert_level": "CRITICAL",
      "region": "Inconnue",
      "latitude": -18.8792,
      "longitude": 47.5079,
      "risk_score": 0.38823,
      "frp": 90.41,
      "message": "Alerte JeryMotro...",
      "images": null,
      "channel": "SMS",
      "destination": "+261348604617",
      "status": "SENT",
      "sent_at": "2026-06-29T12:13:39.043290Z",
      "created_at": "2026-06-29T12:11:41.986620Z"
    }
  ],
  "count": 50,
  "total": 50
}
```

### Affichage Recommande

Afficher une table ou liste avec:

| Champ UI | Source API |
|---|---|
| Date | `sent_at ?? created_at` |
| Canal | `channel` |
| Statut | `status` |
| Niveau | `alert_level` |
| Region | `region` |
| Risque | `risk_score` en pourcentage |
| FRP | `frp` en MW |
| Message | `message` |

Badges:

| Statut | Couleur |
|---|---|
| `SENT` | vert |
| `FAILED` | rouge |
| `PENDING` | amber |

Niveaux:

| Niveau | Couleur |
|---|---|
| `CRITICAL` | rouge |
| `HIGH` | orange |
| `MEDIUM` | amber |
| `LOW` | vert |
| `UNKNOWN` | gris |

## Abonnements

### Lister

```http
GET /alerts/subscriptions
```

```json
[
  {
    "id": 55,
    "channel": "EMAIL",
    "destination": "user@gmail.com",
    "enabled": true,
    "is_verified": true,
    "min_risk": 0.5,
    "min_frp": 50.0
  }
]
```

### Creer Ou Mettre A Jour

```http
POST /alerts/subscribe
```

```json
{
  "channel": "EMAIL",
  "destination": "user@gmail.com",
  "min_risk": 0.7,
  "min_frp": 50
}
```

Canaux autorises:

| Role | EMAIL | SMS | WHATSAPP |
|---|---:|---:|---:|
| standard | oui | non | non |
| premium | oui | oui | oui |
| admin | oui | oui | oui |

Apres creation ou changement de destination, `is_verified` devient `false` et un OTP est envoye.

### Verifier OTP

```http
POST /alerts/subscriptions/55/verify
```

```json
{
  "code": "123456"
}
```

### Renvoyer OTP

```http
POST /alerts/subscriptions/55/resend
```

### Supprimer

```http
DELETE /alerts/subscribe/55
```

## Regle Metier D'Envoi

Une alerte automatique est envoyee si:

```txt
risk_score >= min_risk OU frp >= min_frp
```

Les alertes automatiques sont creees par le pipeline backend:

```txt
collecte NASA FIRMS -> scoring -> clustering FireEvent -> route_alert -> table alerts
```

Le frontend ne declenche pas l'automatique. Il affiche l'historique depuis `/alerts/me`.

## Exemple TypeScript

```ts
type AlertItem = {
  id: number;
  alert_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  risk_score: number | null;
  frp: number | null;
  message: string | null;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  destination: string | null;
  status: "SENT" | "FAILED" | "PENDING";
  sent_at: string | null;
  created_at: string;
};

type AlertListResponse = {
  alerts: AlertItem[];
  count: number;
  total: number;
};

export async function fetchMyAlerts(token: string, limit = 50, offset = 0) {
  const response = await fetch(
    `${API_BASE_URL}/alerts/me?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur historique alertes: ${response.status}`);
  }

  return (await response.json()) as AlertListResponse;
}
```

## Exemple React Hook

```tsx
import { useEffect, useState } from "react";

export function useAlertHistory(token: string | null) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);

    fetchMyAlerts(token)
      .then((data) => {
        if (!cancelled) setAlerts(data.alerts);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { alerts, loading, error };
}
```

## Refresh Temps Reel

Pour la V1 frontend, utiliser un polling simple:

```ts
setInterval(() => {
  fetchMyAlerts(token, 50, 0);
}, 30000);
```

Recommandation UI:

- Rafraichir toutes les 30 secondes sur l'onglet alertes.
- Afficher un indicateur `Derniere mise a jour`.
- Ne pas faire de polling si l'utilisateur n'est pas authentifie.

## Page Frontend Recommandee

Route proposee:

```txt
/dashboard/alerts
```

Sections:

1. Cartes resume:
   - Total alertes
   - Envoyees
   - Echecs
   - Derniere alerte
2. Filtres:
   - Canal: Tous / Email / SMS / WhatsApp
   - Statut: Tous / Sent / Failed
   - Niveau: Tous / Critical / High / Medium / Low
3. Table historique:
   - Date
   - Niveau
   - Canal
   - Region
   - Risque
   - FRP
   - Statut
4. Panneau abonnements:
   - Liste des canaux
   - Etat `is_verified`
   - Bouton renvoyer OTP
   - Bouton supprimer

## Tests Frontend

Cas a verifier:

| Cas | Attendu |
|---|---|
| User non connecte | Redirection login |
| User sans alerte | Etat vide clair |
| Alertes `SENT` | Badge vert |
| Canal SMS/WHATSAPP | Visible seulement Premium/Admin pour creation |
| Abonnement non verifie | Afficher champ OTP |
| Erreur API 401 | Deconnexion ou refresh token |

## Notes Backend Importantes

- L'historique est stocke dans la table `alerts`.
- Les abonnements sont stockes dans `alert_subscriptions`.
- L'envoi automatique est gere cote backend, pas cote frontend.
- Les alertes automatiques sont limitees par `AUTOMATIC_ALERT_EVENT_LIMIT` dans `.env`.
- Le test reel du 2026-06-29 a confirme des alertes `SENT` sur EMAIL, SMS et WHATSAPP.
