# Prerendering Statique — JeryMotro

## Vue d'ensemble

**Principe : build-time, pas de serveur runtime.**

Après chaque `pnpm run build`, le script `scripts/prerender.mjs` :
1. Lance `vite preview` en local sur un port temporaire (4174)
2. Ouvre chaque page publique dans Chrome headless (Puppeteer) — en injectant la langue via `localStorage`
3. Attend `networkidle0` (réseau calme = React + data chargés)
4. Capture le HTML final et l'écrit dans `dist/public/<lang>/<route>/index.html`
5. Génère `dist/public/sitemap.xml` avec balises `hreflang`

Les pages **authentifiées** (`/map`, `/dashboard`, etc.) ne sont **jamais touchées** — `dist/public/index.html` reste le SPA shell classique.

---

## Structure de sortie

```
dist/public/
├── index.html              ← SPA shell INCHANGÉ (routes authentifiées)
├── assets/                 ← INCHANGÉS
├── sitemap.xml             ← Généré par le prerender
├── fr/
│   ├── index.html          ← Landing prerendue en Français
│   ├── login/
│   │   └── index.html
│   └── register/
│       └── index.html
├── mg/
│   ├── index.html          ← Landing prerendue en Malgache
│   └── ...
└── en/
    ├── index.html          ← Landing prerendue en Anglais
    └── ...
```

---

## Usage

### Build complet avec prerendering automatique

```bash
# Depuis artifacts/jerymotro/
pnpm run build
# → le "postbuild" lance automatiquement le prerender après Vite
```

### Prerendering seul (après un build existant)

```bash
pnpm run prerender

# Ou depuis la racine du workspace :
pnpm --filter @workspace/jerymotro run prerender
```

### Variables d'environnement disponibles

| Variable | Défaut | Description |
|---|---|---|
| `PRERENDER_BASE_URL` | `https://jerymotro.mg` | URL de base pour le sitemap |
| `PRERENDER_PORT` | `4174` | Port Vite preview temporaire |
| `PRERENDER_TIMEOUT` | `20000` | Timeout Puppeteer par page (ms) |

```bash
PRERENDER_BASE_URL=https://staging.jerymotro.mg pnpm run prerender
```

---

## Vérifier le HTML généré

```bash
# Vérifier la landing en français
cat dist/public/fr/index.html | head -n 30

# Vérifier que le titre est bien présent
grep -o '<title>[^<]*' dist/public/fr/index.html
grep -o '<title>[^<]*' dist/public/mg/index.html
grep -o '<title>[^<]*' dist/public/en/index.html

# Vérifier la page login en malgache
cat dist/public/mg/login/index.html | grep "<h1"

# Vérifier que le contenu est bien rendu (pas juste le SPA shell vide)
# Une page correctement rendue doit contenir du texte visible, par ex :
grep "Feux de brousse\|JeryMotro\|surveillance" dist/public/fr/index.html

# Voir le sitemap
cat dist/public/sitemap.xml
```

---

## Ajouter une nouvelle route publique

Ouvrez [`scripts/prerender.mjs`](../../scripts/prerender.mjs) et ajoutez un objet dans le tableau `PUBLIC_ROUTES` :

```js
const PUBLIC_ROUTES = [
  { path: '/',           slug: '',          title: 'Landing page' },
  { path: '/login',      slug: 'login',     title: 'Login'        },
  { path: '/register',   slug: 'register',  title: 'Register'     },
  // ↓ Ajoutez votre route ici :
  { path: '/a-propos',   slug: 'a-propos',  title: 'À propos'     },
];
```

- `path` : chemin exact de la route wouter
- `slug` : sous-dossier de sortie (sans slashes), `''` pour la racine
- `title` : description pour les logs

Relancez ensuite `pnpm run prerender`.

---

## ⚠️ Configuration du serveur web (nginx) requise

> **Cette configuration est documentée ici pour votre validation — aucune modification de config existante n'a été faite.**

Pour que les bots reçoivent le bon fichier prerendu en fonction de leur langue préférée (`Accept-Language`), nginx doit router vers le bon sous-dossier. Voici la config à appliquer :

```nginx
# /etc/nginx/sites-available/jerymotro

map $http_accept_language $prerender_lang {
    default                 fr;    # langue de fallback
    ~*(^|,\s*)(mg)          mg;
    ~*(^|,\s*)(en)          en;
    ~*(^|,\s*)(fr)          fr;
}

server {
    listen 80;
    server_name jerymotro.mg www.jerymotro.mg;
    root /var/www/jerymotro/dist/public;

    # ── Routes publiques : servir le prerendu en fonction d'Accept-Language ──
    location = / {
        try_files /$prerender_lang/index.html /index.html;
    }

    location = /login {
        try_files /$prerender_lang/login/index.html /index.html;
    }

    location = /register {
        try_files /$prerender_lang/register/index.html /index.html;
    }

    # Servir directement les versions par langue (pour les liens hreflang)
    location ~ ^/(fr|mg|en)(/.*)?$ {
        try_files $uri $uri/ /$1/index.html /index.html;
    }

    # ── Sitemap ──
    location = /sitemap.xml {
        try_files /sitemap.xml =404;
    }

    # ── Routes authentifiées : toujours servir le SPA shell ──
    location ~ ^/(map|dashboard|detections|clusters|predictions|stats|chat|zones|alerts|subscriptions|profile|export) {
        try_files /index.html =200;
    }

    # ── Assets statiques (cache long terme) ──
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ── Fallback SPA ──
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Pour l'activer :**
```bash
sudo ln -s /etc/nginx/sites-available/jerymotro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚠️ Note sur les balises SEO

Le script audite les balises SEO dans chaque HTML rendu et émet des warnings si `<title>`, `meta description`, `og:title`, `og:description`, `hreflang`, ou `<h1>` sont absents.

Si des warnings apparaissent, c'est que votre app React n'injecte pas ces balises dynamiquement. Pour les ajouter **sans modifier les composants existants**, vous pouvez :

1. Les mettre statiquement dans `index.html` (pour les valeurs communes)
2. Utiliser un hook `useHead` ou la lib `react-helmet-async` dans les pages publiques

Signalez-le et je pourrai vous guider.

---

## Désactiver le postbuild automatique

Si vous souhaitez désactiver le prerender automatique après `pnpm run build` (ex: en CI pour accélérer), retirez temporairement le script `postbuild` du `package.json` ou sautez-le avec :

```bash
# Lancer uniquement le build Vite, sans prerender
pnpm run build --ignore-scripts
```
