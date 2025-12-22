# Configuration de Gemini AI

## Étapes pour obtenir votre clé API Gemini (gratuite)

1. **Aller sur Google AI Studio**
   - Visitez : https://aistudio.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer une clé API**
   - Cliquez sur "Get API Key" ou "Obtenir une clé API"
   - Créez un nouveau projet Google Cloud (ou utilisez un existant)
   - Copiez votre clé API

3. **Configurer la clé API dans le projet**

### Option 1 : Variable d'environnement (Recommandé)

**Windows (PowerShell) :**
```powershell
$env:GEMINI_API_KEY="votre_cle_api_ici"
```

**Windows (CMD) :**
```cmd
set GEMINI_API_KEY=votre_cle_api_ici
```

**Linux/Mac :**
```bash
export GEMINI_API_KEY="votre_cle_api_ici"
```

### Option 2 : Fichier .env (Alternative)

Créez un fichier `.env` dans le dossier `backend/` :
```
GEMINI_API_KEY=votre_cle_api_ici
```

Puis installez python-dotenv et modifiez le code pour charger le fichier .env.

## Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

## Vérification

Une fois la clé API configurée, redémarrez le serveur backend. L'analyse IA utilisera automatiquement Gemini AI avec le modèle **gemini-1.5-flash** (gratuit et rapide).

**Note importante :** Le projet utilise maintenant `gemini-1.5-flash` au lieu de l'ancien `gemini-pro` qui n'est plus disponible.

## Limites du plan gratuit

- **60 requêtes par minute** (généralement suffisant)
- **1500 requêtes par jour** (gratuit)
- Pas de limite de durée pour le plan gratuit

## Support

Si vous rencontrez des problèmes :
- Vérifiez que la clé API est correctement définie
- Vérifiez que vous avez installé `google-generativeai`
- Consultez la documentation : https://ai.google.dev/docs




