# JeryMotro — Plateforme Intelligente de Surveillance Environnementale

JeryMotro est une plateforme web d'analyse et d'alerte précoce pour la surveillance des feux de brousse à Madagascar. Elle combine l'intelligence artificielle (XGBoost) et les données satellitaires NASA FIRMS en temps réel pour offrir des outils décisionnels avancés aux acteurs de la conservation et de la sécurité environnementale.

---

## 🛠️ Stack Technique

### Frontend (React & Vite)
- **Framework & Langage :** React 18, TypeScript 5.9, Vite
- **Architecture de Build :** Monorepo géré avec `pnpm` workspaces
- **Client API :** Génération automatique de hooks React Query via Orval d'après la spécification OpenAPI
- **Cartographie :** Leaflet (React Leaflet) avec gestion performante de clusters (`MarkerCluster`)
- **Design System :** TailwindCSS v4, animations de transition fluides avec Framer Motion
- **Optimisation SEO & Performance :** SSG/SSR Hybride (pré-rendu statique au build via Node.js et `react-dom/server` pour les pages publiques)

### Infrastructure & Production
- **Serveur Web :** Nginx servant les pages pré-rendues statiquement avec routage dynamique basé sur la langue
- **SSL / Sécurité :** Let's Encrypt (Certbot) avec configuration TLS renforcée
- **Backend & Modèles :** API REST en FastAPI, base de données PostgreSQL, intégration n8n pour les pipelines d'alerte, base vectorielle Qdrant pour le module RAG

---

## 🚀 Déploiement en Production

La plateforme utilise un pipeline de déploiement automatisé :

```bash
# Rendre le script exécutable (si nécessaire)
chmod +x deploy_prod.sh

# Lancer le déploiement
./deploy_prod.sh
```

Le script de déploiement exécute les étapes suivantes :
1. Restauration des dépendances via `pnpm`
2. Compilation des bundles de production (client et serveur)
3. Exécution du pipeline de pré-rendu statique (SSG/SSR) générant l'arborescence multilingue dans `dist/public/`
4. Validation de la configuration Nginx et rechargement à chaud

---

## 💻 Développement Local

### Prérequis
- Node.js (LTS recommandé)
- `pnpm` (installé globalement)

### Démarrer le serveur de développement frontend

```bash
pnpm --filter @workspace/jerymotro run dev
```

### Commandes de Build et de Validation

```bash
# Compiler le projet et lancer le script de pré-rendu (SSG)
pnpm --filter @workspace/jerymotro run build

# Valider l'intégrité des types TypeScript
pnpm run typecheck
```

---

## 🌐 Résolution API & Configuration

L'adresse de l'API backend est configurée dynamiquement :
- **Environnement de développement :** Détection automatique de l'hôte et du port d'API.
- **Environnement de production :** Spécifiée via la variable `VITE_API_URL` (définie dans le fichier d'environnement de production).

---

## 📁 Structure du Projet

```
├── Conception/                    # Spécifications fonctionnelles, d'architecture et de base de données
├── lib/                           # Composants partagés et clients d'API générés
│   ├── api-spec/                  # Contrat OpenAPI (openapi.yaml)
│   ├── api-zod/                   # Schémas de validation Zod issus du contrat d'API
│   └── api-client-react/          # SDK et hooks de communication client générés
├── artifacts/
│   └── jerymotro/                 # Application web frontend (React / Vite)
│       ├── src/                   # Code source de l'application
│       └── README-prerender.md    # Documentation technique du pipeline SSG
├── scripts/                       # Scripts système et de pré-rendu statique
└── deploy_prod.sh                 # Automatisation du déploiement
```

---

## 🛡️ Choix d'Architecture Majeurs

- **SSG Hybride & SSR React :** Afin d'assurer un excellent référencement naturel (SEO) et un temps de chargement immédiat tout en contournant l'incompatibilité de Leaflet (dépendant de l'objet global `window`) côté serveur, les routes dynamiques et cartographiques complexes font l'objet d'un rendu HTML sémantique léger optimisé pour les robots d'indexation et les requêtes curl, tandis que les pages statiques textuelles sont intégralement compilées en SSR React. Le client web prend ensuite le relais (hydratation) pour les fonctionnalités interactives.
- **Modélisation ML Découplée :** Les modèles prédictifs (XGBoost v2.1) sont isolés du serveur applicatif principal, communiquant via des APIs à contrats d'interface stricts.
- **Intégration RAG & Analyse Assistée :** Le module d'assistance JeryMotro AI utilise une base vectorielle (Qdrant) pour répondre aux requêtes complexes des utilisateurs en y intégrant un moteur de rendu de graphes (Mermaid.js) et de tableaux interactifs directement au sein de l'interface de messagerie.

---

## 👤 Rôles et Niveaux d'Accès

La plateforme segmente ses fonctionnalités selon trois profils d'utilisateurs :

1. **Visiteur :** Consultation de la cartographie en temps réel et des indices de risques actuels.
2. **Utilisateur standard :** Abonnement aux alertes e-mail configurées pour des périmètres précis et accès aux statistiques globales.
3. **Premium (ONG, Ministères, Parcs Nationaux) :** Réception d'alertes instantanées multi-canaux (Email, SMS, WhatsApp), personnalisation de zones prioritaires dédiées, agent d'analyse IA conversationnel avancé et export structuré des données historiques.

---

## 💡 Principes de Design System

- **Mode Sombre par Défaut :** L'interface privilégie une palette sombre afin de réduire la fatigue visuelle des opérateurs en veille de nuit ou en conditions opérationnelles prolongées.
- **Code Couleur Sémantique :** La teinte orange vif (`#FF5A1F` / `--fire`) est strictement réservée pour la représentation visuelle et graphique des foyers d'incendie actifs.
- **Sécurité et Résilience :** Intégration systématique de plans de secours (`<noscript>`) pour préserver l'accès à l'information essentielle même en cas de dysfonctionnement du JavaScript client.
