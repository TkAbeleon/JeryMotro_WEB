# JeryMotro Platform — Surveillance des Feux de Brousse à Madagascar

Plateforme de surveillance environnementale utilisant l'IA et les données satellitaires NASA FIRMS pour détecter, prédire et alerter sur les feux de brousse à Madagascar.

---

## 🚀 Déploiement Production (tout-en-un)

Un seul script fait **tout** : install des dépendances, build Vite (qui déclenche automatiquement le prerendering des routes publiques), lancement avec PM2 (Vite preview pour servir la SPA et les fichiers statiques prerendus), et push Git.

```bash
chmod +x deploy_prod.sh
./deploy_prod.sh
```

Le trafic public pointe directement vers Vite preview sur le **port 4173** (ou le port configuré).

| Service | Port | Description |
|---|---|---|
| Vite preview | `4173` | Point d'entrée principal — sert les fichiers statiques prerendus et la SPA |

Variables d'environnement disponibles : voir [`artifacts/jerymotro/README-prerender.md`](artifacts/jerymotro/README-prerender.md).

---

## 💻 Développement local

Cette plateforme est structurée en monorepo géré via **pnpm workspaces**. Toutes les commandes de développement doivent être lancées depuis la racine du workspace.

### Lancer le Frontend React (dev)

```bash
pnpm --filter @workspace/jerymotro run dev
```

### Commandes utiles

```bash
# Builder le frontend (lance le prerender automatiquement à la fin)
pnpm --filter @workspace/jerymotro run build

# Lancer manuellement le prerender (sans build complet)
pnpm --filter @workspace/jerymotro run prerender

# Vérifier les types TypeScript
pnpm run typecheck
```

---

## 🌐 Connexion API & Configuration

L'URL de l'API backend est résolue dynamiquement :

- **En développement** : `${window.location.protocol}//${window.location.hostname}:${apiPort}` (port lu depuis `artifacts/api-server/.env`)
- **En production** : Variable `VITE_API_URL` dans `artifacts/jerymotro/.env` (ex: `http://35.192.27.164`)

- **API de production :** `http://35.192.27.164`
- **Documentation Swagger :** `/docs` sur l'hôte API
- **Health Check :** `GET /healthz`

---

## 🛠️ Stack Technique

### Frontend (React & Vite)
- **Langage & Compilateur :** React + Vite + TypeScript 5.9 + esbuild
- **Gestionnaire de Paquets :** pnpm workspaces
- **Client API :** Orval (généré automatiquement à partir de la spécification OpenAPI)
- **Rendu & Contenus :** ReactMarkdown + remark-gfm + rendu client-side Mermaid.js dynamique
- **Cartographie :** Leaflet (React Leaflet) + MarkerCluster
- **Style :** TailwindCSS v4 + Framer Motion (animations fluides & premium)
- **SEO / Bots :** Prerendering statique au build avec Puppeteer (Chrome headless)

### Infra Production
- **Process Manager :** PM2
- **Serveur web :** Vite preview (ou Nginx configuré selon le README-prerender)

---

## 📁 Structure du Projet

```
├── Conception/                    # Spécifications de conception et d'architecture
│   ├── FastAPI_Conception_Principale.md
│   ├── FastAPI_Contrats_API.md
│   ├── FastAPI_Modeles_BDD.md
│   ├── FastAPI_Schemas_Pydantic.md
│   ├── FastAPI_Services_Metier.md
│   ├── JeryMotro_Design_System.md
│   └── PLAN_IMPL_STATUS.md
├── lib/                           # Bibliothèques et générateurs partagés
│   ├── api-spec/                  # Spécification OpenAPI (openapi.yaml)
│   ├── api-zod/                   # Schémas de validation Zod générés automatiquement
│   └── api-client-react/          # Hooks React Query générés pour le client API
├── artifacts/
│   └── jerymotro/                 # Application web frontend React (Vite)
│       ├── src/                   # Code source React
│       └── README-prerender.md    # Guide du prerendering statique
├── scripts/                       # Scripts utilitaires de traitement de données
└── deploy_prod.sh                 # Script de déploiement production tout-en-un
```

---

## 🛡️ Décisions Architecturales Clés

- **Prerendering Statique (SEO) :** Un script postbuild lance Puppeteer pour générer du HTML statique complet pour les pages publiques, sans modifier le code React. Les pages privées restent en CSR classique.
- **Modularité ML :** Les modèles ML (XGBoost, ConvLSTM) sont déployés sur des conteneurs isolés et interrogeables via des contrats d'API stricts.
- **RAG & Rendu Avancé :** Intégration de RAG (Retrieval-Augmented Generation) pour le chat de la plateforme. La réponse de l'IA supporte le Markdown, les tableaux et les diagrammes Mermaid.
- **Robustesse CSS Grid :** Utilisation systématique de `minmax(0, 1fr)` pour les colonnes sous CSS Grid.

---

## 👤 Rôles & Expérience Utilisateur

### Niveaux de Droits
1. **Visiteur :** Accès à la carte en temps réel et aux prédictions globales de risques.
2. **Standard :** Abonnement aux alertes EMAIL personnalisées et consultation de l'historique personnel.
3. **Premium (ONG, Ministères, Parcs Nationaux) :** Alertes multicanales (Email, SMS, WhatsApp), création de Zones Prioritaires, agent d'analyse IA dédié, et export de données.

### Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Admin** | `randriamanantenatsikynyantsa@gmail.com` | `password123` |
| **Premium** | `tkabeleon@gmail.com` | `password123` |
| **Premium** | `rtsikynyantsa@gmail.com` | `password123` |
| **Standard** | `tsikynyantsa1@outlook.fr` | `password123` |

---

## 💡 Notes de Conception

- **Priorité Nocturne :** Le thème sombre est configuré par défaut, offrant un contraste optimal pour une veille prolongée.
- **Signification des Couleurs :** La couleur orange vif (`--fire`) est sémantiquement réservée aux indicateurs de feux réels.
- **Défense Supply-Chain :** Sécurité de déploiement via pnpm imposant un âge de publication minimal de 24h pour toutes les dépendances npm de production.
