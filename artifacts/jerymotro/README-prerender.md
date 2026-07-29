# Pipeline de Pré-rendu Statique (SSG/SSR) — JeryMotro

Ce document détaille l'architecture et le fonctionnement du pipeline de pré-rendu hybride (Static Site Generation / Server-Side Rendering) conçu pour assurer l'accessibilité SEO des pages publiques de la plateforme JeryMotro.

---

## ⚙️ Principes de Fonctionnement

Contrairement à un SPA classique où le navigateur reçoit un fichier HTML vide et construit l'interface en JavaScript, JeryMotro compile statiquement ses pages au moment du build.

### Caractéristiques majeures :
1. **Zéro dépendance d'exécution de navigateur :** Le pré-rendu utilise `react-dom/server` (Node.js) pour générer les chaînes HTML. Il n'a plus recours à des solutions lourdes ou instables comme Puppeteer (Chrome Headless).
2. **Gestion sécurisée des modules tiers (Leaflet) :** Les composants complexes dépendants de l'objet global `window` (comme la cartographie Leaflet ou les graphes interactifs du tableau de bord) sont isolés via chargement paresseux (`lazy`). Ils ne s'exécutent pas lors du pré-rendu côté serveur, ce qui évite les erreurs critiques de compilation dans Node.
3. **Optimisation SEO :** Pour ces pages cartographiques complexes, le script écrit une structure HTML sémantique riche et légère à destination des robots d'indexation (`curl`, Googlebot). Au chargement dans le navigateur d'un utilisateur, le bundle React prend le relais pour hydrater l'application et charger la carte dynamique.

---

## 📁 Structure Générée en Production

Le livrable final est structuré sous `dist/public/` :

```
dist/public/
├── index.html              # Fichier de base de la SPA (utilisé pour les sessions connectées)
├── assets/                 # Fiches CSS, JS et images minifiés
├── sitemap.xml             # Sitemap multilingue complet généré dynamiquement
├── fr/
│   ├── index.html          # Page d'accueil (Français)
│   ├── login/index.html    # Connexion (Français)
│   ├── register/index.html # Inscription (Français)
│   ├── cv/index.html       # CV Développeur (Français)
│   └── ...
├── mg/
│   └── ...                 # Arborescence identique pour le Malagasy (mg)
└── en/
    └── ...                 # Arborescence identique pour l'English (en)
```

---

## 🚀 Utilisation

### Compilation et Pré-rendu automatiques
Le pré-rendu fait partie intégrante du processus de build standard de l'application :
```bash
# Lance le build de production puis le pré-rendu statique
pnpm run build
```

### Exécution du pré-rendu uniquement
Si le projet a déjà été compilé, le pré-rendu peut être relancé manuellement :
```bash
# Depuis la racine du monorepo
pnpm --filter @workspace/jerymotro run prerender
```

### Paramètres de configuration
Les variables d'environnement suivantes permettent d'ajuster le comportement du générateur :

| Variable | Valeur par défaut | Description |
|---|---|---|
| `PRERENDER_BASE_URL` | `https://jerymotro.duckdns.org` | URL absolue servant de base aux balises canoniques et au sitemap. |

Exemple d'utilisation :
```bash
PRERENDER_BASE_URL=https://staging.jerymotro.duckdns.org pnpm run prerender
```

---

## 🛡️ Configuration du Serveur Web (Nginx)

Pour router correctement les requêtes vers les fichiers HTML pré-rendus sans perturber le routage applicatif client (SPA), la configuration Nginx doit implémenter une logique de détection de langue et des directives de fichiers alternatives (`try_files`) :

```nginx
# Configuration de détection de langue par défaut ou demandée par le client
map $http_accept_language $prerender_lang {
    default                 fr;
    ~*(^|,\s*)(mg)          mg;
    ~*(^|,\s*)(en)          en;
    ~*(^|,\s*)(fr)          fr;
}

server {
    server_name jerymotro.duckdns.org;
    root /mnt/jerymotro/JeryMotro_WEB/artifacts/jerymotro/dist/public;
    index index.html;

    # ── Redirection des routes publiques vers les versions pré-rendues par langue ──
    location = / {
        try_files /$prerender_lang/index.html /index.html;
    }

    location = /login {
        try_files /$prerender_lang/login/index.html /index.html;
    }

    location = /register {
        try_files /$prerender_lang/register/index.html /index.html;
    }

    location = /map {
        try_files /$prerender_lang/map/index.html /index.html;
    }

    location = /dashboard {
        try_files /$prerender_lang/dashboard/index.html /index.html;
    }

    location = /about {
        try_files /$prerender_lang/about/index.html /index.html;
    }

    location = /cv {
        try_files /$prerender_lang/cv/index.html /index.html;
    }

    location = /legal {
        try_files /$prerender_lang/legal/index.html /index.html;
    }

    location = /privacy {
        try_files /$prerender_lang/privacy/index.html /index.html;
    }

    # Accès direct multilingue (ex: /mg/cv/)
    location ~ ^/(fr|mg|en)(/.*)?$ {
        try_files $uri $uri/ /$1/index.html /index.html;
    }

    # Sitemap
    location = /sitemap.xml {
        try_files /sitemap.xml =404;
    }

    # Mise en cache agressive des éléments statiques compilés
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Toutes les autres routes (sessions utilisateur connectées)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔎 Audit SEO et Validation

À la fin de la compilation, le pipeline effectue un audit automatique des balises méta indispensables au référencement. Il s'assure de la présence de :
- Balises `<title>` et `<meta name="description">`
- Métadonnées Open Graph (`og:title`, `og:description`)
- Attributs multilingues alternatifs (`hreflang` et `x-default`)
- Structuration sémantique de base (`<h1>`)
