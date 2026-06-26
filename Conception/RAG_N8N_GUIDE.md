# RAG et intégration n8n — exigences et guide

Ce document récapitule les exigences à jour pour le RAG JeryMotro, en tenant
compte du fait que le backend relaye désormais les requêtes de chat vers n8n.

---

## 1. Exigences RAG

### 1.1 Pré-requis techniques

- Un webhook n8n configuré pour le chat RAG.
- Un moteur de recherche vectorielle géré par n8n ou accessible depuis n8n
  (ChromaDB, Elasticsearch, OpenSearch, etc.).
- Un service de génération de texte compatible : Vertex AI / Gemini ou un
  mécanisme de fallback.
- Le backend FastAPI expose `POST /chat` qui relaie les requêtes vers n8n.

### 1.2 Exigences sur les documents

- Chaque document indexé doit contenir :
  - `title` : titre du document
  - `source` : origine / fichier / URL
  - `region` ou `zone` si applicable
  - `date` ou `version` si utile
- Les chunks doivent rester courts et cohérents (idéalement 400 à 800 tokens).
- Les métadonnées doivent être normalisées pour permettre un filtrage par zone,
  type de contenu ou source.

### 1.3 Exigences fonctionnelles

- Le système doit renvoyer :
  - une réponse en français
  - les sources utilisées
  - un objet `data_context`
  - un fallback clair si n8n ou le modèle ne répond pas
- Le prompt doit rester orienté « JeryMotro », limité aux données internes,
  et éviter les hallucinations.

### 1.4 Exigences de qualité

- Limiter les réponses aux documents disponibles.
- Logger les requêtes et les réponses pour audit et debug.
- Prévoir une mise à jour régulière des embeddings / index de la base
  documentaire.
- Gérer proprement l’indisponibilité du webhook n8n.

---

## 2. Exigences pour l’intégration n8n

### 2.1 Entrées nécessaires

- URL backend JeryMotro : `POST /chat`
- URL du webhook n8n si le frontend est autorisé à appeler n8n directement
- Variables d’environnement backend :
  - `N8N_CHAT_WEBHOOK_URL`
  - `N8N_CHAT_TIMEOUT_SECONDS`
- Payload JSON attendu :
  - `message` : question utilisateur
  - `zone_id` : identifiant de zone Premium (optionnel)
  - `temperature` : réglage de génération (optionnel)
  - `conversation_id` : identifiant de conversation (optionnel)
  - `zone_name` : envoyé par le backend si `zone_id` existe
  - `zone_prompt` : prompt de zone personnalisé envoyé par le backend
  - `user_id` / `user_role` : contexte utilisateur optionnel
  - `source` : valeur fixe `jerymotro-backend`

### 2.2 Sorties attendues

- `response` : texte final généré
- `sources` : liste des sources/document citations
- `data_context` : méta-données structurées
- `model_used` : modèle ou mode fallback
- `tokens_used` : nombre de tokens consommés (optionnel)
- `response_time_ms` : durée de traitement

### 2.3 Règles de workflow n8n

- Utiliser un nœud **HTTP Request** pour appeler le backend ou le webhook direct.
- Gérer les erreurs HTTP avec un nœud **IF**.
- Normaliser la sortie avec un nœud **Set** avant de redispatcher vers email,
  WhatsApp, SMS ou autre canal.
- Enregistrer les interactions pour audit et améliorations.

---

## 3. Guide d’intégration n8n

### Étape 1 — Préparer le backend

1. Configurer `N8N_CHAT_WEBHOOK_URL` dans l’environnement du backend.
2. Configurer `N8N_CHAT_TIMEOUT_SECONDS` pour éviter les blocages.
3. Vérifier que `POST /chat` répond bien et renvoie un JSON valide.

### Étape 2 — Créer le workflow n8n

1. Ajouter un nœud **Webhook** pour recevoir la question utilisateur.
2. Ajouter un nœud **HTTP Request** vers le backend JeryMotro ou vers le
   webhook direct n8n.
3. Envoyer un payload similaire à :

```json
{
  "message": "{{$json.message}}",
  "zone_id": {{$json.zone_id || null}},
  "temperature": 0.1,
  "conversation_id": "{{$json.conversation_id || ''}}"
}
```

4. Si le backend est utilisé comme proxy, n8n recevra déjà les champs
   `zone_name`, `zone_prompt`, `user_id`, `user_role`, et `source`.
5. Ajouter un nœud **Set** pour extraire / normaliser :
   - `response`
   - `sources`
   - `data_context`
   - `model_used`
   - `response_time_ms`
6. Ajouter un nœud **Respond to Webhook** pour retourner la réponse au client.

### Étape 3 — Envoyer la réponse vers d’autres canaux

- Email : envoyer la réponse finale par SMTP via n8n.
- WhatsApp : transmettre la réponse via WAHA ou un autre service.
- SMS : utiliser HTTPSMS ou un SMS provider disponible.
- Logs : stocker la question et la réponse pour suivi.

### Étape 4 — Validation

- Tester une question avec contexte connu.
- Vérifier que les `sources` sont bien retournées.
- Vérifier le mode de fallback si le webhook n8n est indisponible.

---

## 4. Exemple de payload attendu

Requête backend :

```json
{
  "message": "Quels sont les zones à risque aujourd’hui ?",
  "zone_id": 1,
  "temperature": 0.1,
  "conversation_id": "conv-123"
}
```

Réponse attendue :

```json
{
  "response": "...texte généré...",
  "sources": ["Rapport incendie 2026", "Carte zones prioritaires"],
  "data_context": {
    "regions_mentioned": ["Menabe"]
  },
  "model_used": "gemini-1.5-flash",
  "tokens_used": 342,
  "response_time_ms": 842
}
```

---

## 5. Checklist de mise en production

- [ ] `N8N_CHAT_WEBHOOK_URL` configuré
- [ ] `POST /chat` testable
- [ ] Workflow n8n déployé et accessible
- [ ] Sources/documentation indexés et à jour
- [ ] Logs et erreurs visibles
- [ ] Fallback n8n actif si le webhook est indisponible

---

## 6. Recommandation pratique

Pour un démarrage simple, conserver ce flux :

1. le frontend envoie la question,
2. le backend relaie vers n8n via `POST /chat`,
3. n8n réalise le RAG et génère la réponse,
4. n8n renvoie le JSON final au backend ou directement au client.
