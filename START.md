# 🚀 Guide de Démarrage - Pulsar Audio

## Prérequis

### Frontend
- **Node.js** : Version 18+ recommandée
- **npm** : Inclus avec Node.js

### Backend
- **Python** : Version 3.9+ recommandée
- **pip** : Gestionnaire de paquets Python

---

## 📦 Installation

### 1. Installation des dépendances Frontend

```bash
cd brainwave
npm install
```

### 2. Installation des dépendances Backend

```bash
cd brainwave/backend
pip install -r requirements.txt
```

**Note :** Sur Windows, vous pouvez utiliser :
```powershell
python -m pip install -r requirements.txt
```

---

## ▶️ Démarrage du Projet

### Option 1 : Démarrage Manuel (Recommandé)

#### Terminal 1 - Backend (FastAPI)
```bash
cd brainwave/backend
python -m uvicorn main:app --reload
```

Le backend sera accessible sur : **http://localhost:8000**

#### Terminal 2 - Frontend (Vite + React)
```bash
cd brainwave
npm run dev
```

Le frontend sera accessible sur : **http://localhost:5173**

---

### Option 2 : Scripts Automatiques (Windows)

#### Backend avec PowerShell
```powershell
cd brainwave/backend
.\start_server.ps1
```

#### Backend avec Batch
```cmd
cd brainwave\backend
start_server.bat
```

#### Frontend (dans un autre terminal)
```bash
cd brainwave
npm run dev
```

---

## 🔧 Configuration

### Variables d'environnement Backend

Créez un fichier `.env` dans `brainwave/backend/` :

```env
# API Gemini (pour l'analyse IA)
GEMINI_API_KEY=votre_cle_api_gemini

# Configuration serveur (optionnel)
HOST=0.0.0.0
PORT=8000
```

**Note :** Pour obtenir une clé API Gemini, consultez `brainwave/backend/GEMINI_SETUP.md`

---

## ✅ Vérification

### Backend
Ouvrez votre navigateur et allez sur :
- **http://localhost:8000** → Devrait afficher `{"message": "Brainwave Audio API is running"}`
- **http://localhost:8000/docs** → Documentation interactive Swagger

### Frontend
Ouvrez votre navigateur et allez sur :
- **http://localhost:5173** → Interface de l'application

---

## 🛠️ Commandes Utiles

### Frontend
```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Linter
npm run lint
```

### Backend
```bash
# Démarrage avec rechargement automatique
python -m uvicorn main:app --reload

# Démarrage sur un port spécifique
python -m uvicorn main:app --reload --port 8001

# Démarrage avec host spécifique
python -m uvicorn main:app --reload --host 0.0.0.0
```

---

## 🐛 Dépannage

### Erreur : Port déjà utilisé

**Backend (port 8000) :**
```bash
# Windows - Trouver le processus
netstat -ano | findstr :8000
# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Frontend (port 5173) :**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Erreur : Module Python non trouvé

```bash
# Vérifier l'installation
pip list | grep fastapi

# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall
```

### Erreur : Node modules manquants

```bash
# Supprimer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Structure du Projet

```
brainwave/
├── src/                    # Code source React
│   ├── pages/             # Pages de l'application
│   ├── components/        # Composants réutilisables
│   └── assets/            # Images, SVG, etc.
├── backend/                # API FastAPI
│   ├── app/
│   │   ├── api/           # Endpoints API
│   │   ├── services/      # Services métier
│   │   ├── models/        # Modèles de données
│   │   └── core/          # Configuration
│   ├── uploads/           # Fichiers uploadés
│   ├── processed/         # Fichiers traités
│   └── main.py            # Point d'entrée
├── package.json           # Dépendances frontend
└── README.md
```

---

## 🔗 URLs Importantes

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **API Docs (Swagger)** : http://localhost:8000/docs
- **API Docs (ReDoc)** : http://localhost:8000/redoc

---

## 💡 Astuces

1. **Hot Reload** : Les deux serveurs supportent le rechargement automatique
2. **CORS** : Le backend est configuré pour accepter les requêtes depuis `localhost:5173`
3. **Logs** : Les logs du backend s'affichent dans le terminal
4. **Console DevTools** : Ouvrez la console du navigateur (F12) pour voir les logs frontend

---

## 🚨 Important

- Gardez les deux terminaux ouverts pendant le développement
- Le backend doit être démarré avant d'utiliser l'application frontend
- Les fichiers uploadés sont stockés dans `backend/uploads/`
- Les fichiers traités sont stockés dans `backend/processed/`

