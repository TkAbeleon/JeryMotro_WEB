# JeryMotro Platform — Surveillance des Feux de Brousse à Madagascar

Plateforme de surveillance environnementale utilisant l'IA et les données satellitaires NASA FIRMS pour détecter, prédire et alerter sur les feux de brousse à Madagascar.

## 🚀 Run & Operate

Cette plateforme est structurée en monorepo géré via **pnpm workspaces**. Toutes les commandes de développement doivent être lancées depuis la racine du workspace.

### 🔌 Lancer le Backend FastAPI
Le serveur backend se trouve dans `artifacts/api-server`. Pour le démarrer en mode développement avec rechargement automatique :
```bash
pnpm --filter @workspace/api-server run dev
```

### 💻 Lancer le Frontend React
L'application web principale se trouve dans `artifacts/jerymotro`. Pour démarrer le serveur de développement Vite :
```bash
pnpm --filter @workspace/jerymotro run dev
```

### 🛠️ Autres Commandes Utiles

- **Compiler l'application frontend :**
  ```bash
  pnpm --filter @workspace/jerymotro run build
  ```
- **Vérifier les types TypeScript :**
  ```bash
  pnpm run typecheck
  ```
- **Régénérer le client API à partir de la spécification OpenAPI :**
  ```bash
  pnpm --filter @workspace/api-spec run codegen
  ```

---

## 🌐 Connexion API & Indépendance du Frontend

L'application frontend **JeryMotro** est entièrement autonome et s'affranchit du proxy de développement de Vite pour communiquer directement avec le serveur API (auparavant accessible via la route proxy `/jerymotro-api`).

### 🔗 Résolution Dynamique
L'adresse du serveur d'API est résolue de manière dynamique à l'exécution :
1. **Extraction Automatique du Port** : Durant la compilation ou l'exécution locale de Vite, le script de configuration `vite.config.ts` extrait de manière synchrone la valeur `PORT` (par défaut `8081`) configurée dans `artifacts/api-server/.env`.
2. **Construction de l'URL** : L'adresse de l'API est construite dynamiquement via la formule `${window.location.protocol}//${window.location.hostname}:${apiPort}`, ce qui permet au frontend de toujours s'adresser au bon backend, qu'il tourne sur `localhost`, sur un réseau local ou sur un domaine public.
3. **Configuration Fixe (Optionnelle)** : Pour forcer une adresse de serveur d'API spécifique (en production par exemple), il suffit de définir la variable `VITE_API_URL` à une adresse absolue (ex : `http://35.192.27.164`) dans le fichier `artifacts/jerymotro/.env`.

- **API de production (adresse externe par défaut) :** `http://35.192.27.164`
- **Documentation Swagger de l'API :** `/docs` sur l'hôte et port du backend
- **Health Check :** `GET /healthz`

---

## 🛠️ Stack Technique

### Backend (FastAPI)
- **Framework :** FastAPI (Python)
- **Base de données :** PostgreSQL + SQLAlchemy (asynchrone)
- **Authentification :** JWT + OTP (One-Time Password)
- **Modèles ML/DL :** Services externes (XGBoost, ConvLSTM) appelés via requêtes HTTP sécurisées
- **Moteur RAG :** Vertex AI (Gemini 1.5 Flash) + base vectorielle ChromaDB
- **Système d'Alertes :** SMTP (Email) + Twilio (SMS et WhatsApp)

### Frontend (React & Vite)
- **Langage & Compilateur :** React + Vite + TypeScript 5.9 + esbuild
- **Gestionnaire de Paquets :** pnpm workspaces
- **Client API :** Orval (généré automatiquement à partir de la spécification OpenAPI)
- **Rendu & Contenus :** ReactMarkdown + remark-gfm + rendu client-side Mermaid.js dynamique
- **Cartographie :** Leaflet (React Leaflet)
- **Style :** TailwindCSS v4 + Framer Motion (animations fluides & premium)

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
├── artifacts/                     # Applications exécutables
│   ├── api-server/                # Code source du backend FastAPI
│   ├── jerymotro/                 # Application web frontend React (Vite)
│   └── mockup-sandbox/            # Maquettes et bac à sable de prototypage
└── scripts/                       # Scripts utilitaires de traitement de données
```

---

## 🛡️ Décisions Architecturales Clés

- **Modularité ML :** Les modèles ML (XGBoost, ConvLSTM) sont déployés sur des conteneurs isolés et interrogeables via des contrats d'API stricts. Cela garantit l'évolution indépendante des modèles et du backend central.
- **RAG & Rendu Avancé :** Intégration de RAG (Retrieval-Augmented Generation) pour le chat de la plateforme. La réponse de l'IA supporte pleinement le **Markdown standard**, les **tableaux**, ainsi que la génération à la volée de **diagrammes structurels Mermaid** grâce à une intégration native dynamique de la bibliothèque client Mermaid.
- **Robustesse & Robustesse CSS Grid :** Utilisation systématique de `minmax(0, 1fr)` pour les colonnes de tableaux sous CSS Grid afin d'éviter les bugs classiques de chevauchement d'identifiants et de noms de régions lors du redimensionnement de l'écran.

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

- **Priorité Nocturne :** Le thème sombre est configuré par défaut, offrant un contraste optimal reposant pour l'œil lors d'une veille de surveillance prolongée.
- **Signification des Couleurs :** La couleur orange vif (`--fire`) est sémantiquement réservée aux indicateurs de feux réels pour éviter la fatigue cognitive.
- **Défense Supply-Chain :** Sécurité de déploiement via pnpm imposant un âge de publication minimal de 24h pour toutes les dépendances npm de production.
