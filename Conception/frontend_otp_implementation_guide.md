# Guide d'Implémentation Frontend : Authentification par OTP (One-Time Password)

Ce guide détaille pas à pas l'implémentation de la fonctionnalité OTP côté Frontend pour l'application **JeryMotro**, en se basant sur le Backend FastAPI actuel.

---

## 1. Vue d'ensemble du Flux (Workflow)

L'authentification ou la validation par OTP (Code à usage unique) se déroule en deux grandes étapes :
1. **Demande d'OTP** : L'utilisateur renseigne son adresse email et le canal souhaité (SMS ou Email). Le backend génère et envoie le code.
2. **Vérification d'OTP** : L'utilisateur saisit le code reçu. Le backend le valide et renvoie un token d'accès JWT (exactement comme un login classique).

> [!NOTE]
> Si l'utilisateur demande un OTP et qu'il **n'existe pas encore** dans la base de données, le backend le **créera automatiquement** avec le rôle `standard`.

---

## 2. Les Endpoints de l'API

### A. Demander un code OTP
- **URL** : `POST /auth/otp/request`
- **Authentification** : Non requise.
- **Body (JSON)** :
  ```json
  {
    "email": "user@example.com",
    "via": "sms"  // ou "email"
  }
  ```
- **Réponses** :
  - `200 OK` : "OTP généré et tentative d'envoi effectuée" (ou inclut l'OTP en mode test).
  - `400 Bad Request` : "Numéro de téléphone non défini pour envoi SMS". (Arrive si on demande via `sms` pour un compte sans numéro enregistré).

### B. Vérifier le code OTP
- **URL** : `POST /auth/otp/verify`
- **Authentification** : Non requise.
- **Body (JSON)** :
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```
- **Réponses** :
  - `200 OK` : Renvoie le token JWT.
    ```json
    {
      "access_token": "eyJhbG...",
      "token_type": "bearer",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "standard",
        // ... autres champs
      }
    }
    ```
  - `400 Bad Request` : "Code OTP invalide ou expiré".
  - `404 Not Found` : "Utilisateur non trouvé".

---

## 3. Interfaces Utilisateur (UI) recommandées

Il est conseillé de créer un composant ou une vue en **deux étapes** (Stepper).

### Étape 1 : Saisie de l'email
1. **Champ de texte** pour l'Email.
2. **Sélecteur (Radio ou Bouton)** pour le canal : "Recevoir par SMS" ou "Recevoir par Email".
3. **Bouton d'action** : "Envoyer le code".

> [!WARNING]
> Si l'utilisateur est nouveau, il n'a pas encore de numéro de téléphone. Il est donc recommandé, pour la création de compte via OTP, de forcer l'envoi par **email** dans un premier temps. Ou de lui faire remplir un formulaire d'inscription complet s'il souhaite utiliser le SMS.

### Étape 2 : Saisie du Code
1. **Affichage du message** : "Un code a été envoyé à *[email/numéro]*".
2. **Champ de saisie OTP** : Utiliser idéalement un composant à 6 cases séparées pour une meilleure UX (ex: `react-otp-input` ou similaire).
3. **Bouton de validation** : "Vérifier".
4. **Bouton de renvoi** : "Renvoyer le code", désactivé par défaut avec un compte à rebours (ex: 60 secondes).

---

## 4. Exemple d'Implémentation (Logique Frontend)

Voici un exemple conceptuel de la gestion d'état (ex: React / Vue) pour ce flux :

```javascript
// État global du composant
const [step, setStep] = useState(1); // 1 = Demande, 2 = Vérification
const [email, setEmail] = useState('');
const [via, setVia] = useState('email'); // 'email' ou 'sms'
const [otpCode, setOtpCode] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

// ----------------------------------------------------
// Action : Demander l'OTP
// ----------------------------------------------------
const handleRequestOTP = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('http://VOTRE_API/jerymotro-api/auth/otp/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, via })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Ex: 400 si pas de téléphone enregistré pour le SMS
            throw new Error(data.detail || "Erreur lors de la demande OTP");
        }
        
        // Succès : passer à l'étape de saisie du code
        setStep(2);
        // Optionnel : démarrer le minuteur de renvoi ici
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

// ----------------------------------------------------
// Action : Vérifier l'OTP
// ----------------------------------------------------
const handleVerifyOTP = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('http://VOTRE_API/jerymotro-api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otpCode })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Ex: 400 "Code OTP invalide ou expiré"
            throw new Error(data.detail || "Code invalide");
        }
        
        // SUCCÈS ! L'utilisateur est authentifié.
        // 1. Sauvegarder le token (ex: localStorage ou Cookies)
        localStorage.setItem('access_token', data.access_token);
        
        // 2. Sauvegarder les infos utilisateur
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 3. Rediriger l'utilisateur vers le Dashboard
        window.location.href = "/dashboard";
        
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};
```

---

## 5. Gestion des cas d'erreur et bonnes pratiques UX

> [!TIP]
> **Expérience Utilisateur (UX)**
> - **Autofocus** : Mettez le focus automatiquement sur le premier champ du code OTP quand l'étape 2 s'affiche.
> - **Format** : Les codes OTP font entre 4 et 8 caractères (généralement 6 numériques). Forcez le clavier numérique sur mobile (`inputMode="numeric"` ou `type="number"`).
> - **Copier-Coller** : Assurez-vous que votre champ OTP supporte le "coller" (si l'utilisateur copie le code depuis ses SMS).

### Cas spécifiques à gérer dans l'UI :

1. **Erreur 400 lors du Request ("Numéro non défini")** :
   - Si l'utilisateur choisit SMS mais n'a jamais configuré de numéro (ou vient de créer le compte par cette route), l'API renverra `400`.
   - **Solution Frontend** : Affichez un message clair "Vous n'avez pas de numéro de téléphone associé à ce compte. Veuillez choisir l'envoi par Email".
2. **Trop de tentatives / Expiration** :
   - L'OTP a une durée de vie (définie côté backend par `OTP_EXPIRY_SECONDS`, généralement 5 minutes).
   - L'utilisateur a un nombre max de tentatives (souvent 3).
   - **Solution Frontend** : Si le backend renvoie `Code invalide ou expiré`, permettez à l'utilisateur de cliquer sur "Renvoyer le code" après la 3ème erreur ou si le temps imparti est écoulé.

## 6. L'utilisation du compte à rebours (Resend Timer)

Pour éviter le spam API, il est vital de bloquer le bouton de renvoi d'OTP.

```javascript
import { useState, useEffect } from 'react';

// Dans le composant de l'étape 2
const [timer, setTimer] = useState(60);

useEffect(() => {
    let interval = null;
    if (timer > 0) {
        interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
}, [timer]);

// Dans le render :
<button 
    disabled={timer > 0} 
    onClick={() => {
        handleRequestOTP(); // Rappelle l'API
        setTimer(60);       // Relance le compteur
    }}
>
    {timer > 0 ? `Renvoyer dans ${timer}s` : "Renvoyer le code"}
</button>
```
