# JeryMotro Frontend

## 🌐 Résolution API & Configuration

L'adresse de l'API backend est configurée dynamiquement :

- **En développement :** la configuration locale peut utiliser le proxy Vite via `VITE_API_URL`.
- **En production :** `VITE_API_URL` est fournie au moment du build et pointe vers l'API publique.
- **État initial du backend :** `VITE_BACKEND_DEFAULT_OFFLINE` contrôle uniquement l'état de secours affiché au chargement. Si la variable est absente, l'application utilise `true` par défaut. Il n'est donc pas nécessaire d'ajouter cette variable dans l'environnement de l'hébergeur.
- **Vérification réelle :** le frontend interroge `GET /health` du backend. Une réponse HTTP réussie contenant `{"status":"ok"}` considère le backend comme disponible et masque le message d'indisponibilité.
- **Backend inaccessible :** en cas d'erreur, de timeout ou d'absence de réponse, le message d'indisponibilité est affiché.
- **Surveillance continue :** l'état est revérifié toutes les 30 secondes afin de faire disparaître automatiquement le message lorsque le backend revient en ligne.

### Indisponibilité globale du backend

Le composant `BackendUnavailableBanner` fournit un message multilingue (français, malgache et anglais) lorsque le backend n'est pas disponible. Le statut réel du backend est déterminé par l'endpoint `/health`, et non uniquement par la valeur du fichier `.env`.

`VITE_BACKEND_DEFAULT_OFFLINE=true` est donc un **fallback initial**, pas une déclaration permanente indiquant que le backend est hors ligne.

### Exemple

```env
VITE_API_URL=https://rtsikynyantsa-jerymotro-pipeline.hf.space/
VITE_BACKEND_DEFAULT_OFFLINE=true
```

Avec cette configuration :

1. le bandeau est visible immédiatement au chargement ;
2. si `https://rtsikynyantsa-jerymotro-pipeline.hf.space/health` répond `{"status":"ok"}`, le bandeau disparaît ;
3. si le backend devient ensuite inaccessible, le bandeau réapparaît lors de la prochaine vérification ;
4. lorsqu'il revient en ligne, le bandeau disparaît automatiquement.

> **Important :** les variables `VITE_*` sont intégrées au build Vite. La valeur par défaut `true` est directement gérée dans le code, donc l'absence de `VITE_BACKEND_DEFAULT_OFFLINE` dans l'environnement de production ne bloque pas le fonctionnement.
