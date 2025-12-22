# Guide de configuration du backend

## Solution rapide : Démarrer le serveur

### Option 1 : Commande directe (PowerShell)
```powershell
cd brainwave/backend
python -m uvicorn main:app --reload
```

### Option 2 : Script de démarrage
Double-cliquez sur `start_server.bat` ou exécutez :
```powershell
.\start_server.ps1
```

---

## Solution recommandée : Environnement virtuel

Pour éviter les conflits de dépendances avec d'autres projets Python, créez un environnement virtuel :

### 1. Créer l'environnement virtuel
```powershell
cd brainwave/backend
python -m venv venv
```

### 2. Activer l'environnement virtuel

**PowerShell :**
```powershell
.\venv\Scripts\Activate.ps1
```

Si vous obtenez une erreur d'exécution de script, exécutez d'abord :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**CMD :**
```cmd
venv\Scripts\activate.bat
```

### 3. Installer les dépendances
```powershell
pip install -r requirements.txt
```

### 4. Démarrer le serveur
```powershell
python -m uvicorn main:app --reload
```

---

## Configuration de l'API Gemini (optionnel)

Créez un fichier `.env` dans `brainwave/backend/` :
```
GEMINI_API_KEY=votre_cle_api_ici
```

Obtenez votre clé gratuite sur : https://aistudio.google.com/

---

## Notes sur les conflits de dépendances

Les warnings concernant `opencv-python` et `readmeai` ne sont **pas bloquants** pour ce projet car ces packages ne sont pas utilisés. 

Si vous voulez les éviter complètement, utilisez un environnement virtuel (voir ci-dessus).

