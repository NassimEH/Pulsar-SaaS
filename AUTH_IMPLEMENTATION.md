# 🔐 Implémentation de l'Authentification

## ✅ Fonctionnalités Implémentées

### Backend
- ✅ Modèle de base de données `User` avec SQLAlchemy
- ✅ Système de hachage de mot de passe (bcrypt)
- ✅ Génération et vérification de tokens JWT
- ✅ Endpoints d'authentification :
  - `POST /api/auth/register` - Inscription
  - `POST /api/auth/login` - Connexion (OAuth2)
  - `POST /api/auth/login-json` - Connexion (JSON)
  - `GET /api/auth/me` - Informations utilisateur
  - `GET /api/auth/verify-token` - Vérification de token
- ✅ Protection des routes avec dépendances FastAPI
- ✅ Base de données SQLite initialisée automatiquement

### Frontend
- ✅ Contexte d'authentification (`AuthContext`)
- ✅ Pages Login et Register avec style cohérent
- ✅ Intégration dans le Header (boutons connexion/déconnexion)
- ✅ Gestion du token dans localStorage
- ✅ Routes `/login` et `/register` ajoutées

## 📦 Installation des Dépendances

### Backend
```bash
cd brainwave/backend
pip install -r requirements.txt
```

Nouvelles dépendances ajoutées :
- `sqlalchemy==2.0.23` - ORM pour la base de données
- `passlib[bcrypt]==1.7.4` - Hachage de mots de passe
- `python-jose[cryptography]==3.3.0` - JWT
- `email-validator==2.1.0` - Validation d'email

### Frontend
Aucune nouvelle dépendance nécessaire (utilise React Context natif)

## 🚀 Démarrage

1. **Backend** (dans un terminal) :
```bash
cd brainwave/backend
python -m uvicorn main:app --reload
```

2. **Frontend** (dans un autre terminal) :
```bash
cd brainwave
npm run dev
```

3. **Accéder à l'application** :
- Page d'accueil : http://localhost:5173
- Page de connexion : http://localhost:5173/login
- Page d'inscription : http://localhost:5173/register

## 📁 Fichiers Créés/Modifiés

### Backend
- `backend/app/models/user.py` - Modèle User
- `backend/app/core/database.py` - Configuration SQLite
- `backend/app/services/auth.py` - Services d'authentification
- `backend/app/api/auth.py` - Endpoints d'authentification
- `backend/app/models/schemas.py` - Schémas Pydantic (ajout)
- `backend/main.py` - Initialisation DB (modifié)
- `backend/requirements.txt` - Dépendances (modifié)

### Frontend
- `src/contexts/AuthContext.jsx` - Contexte d'authentification
- `src/pages/Login.jsx` - Page de connexion
- `src/pages/Register.jsx` - Page d'inscription
- `src/main.jsx` - AuthProvider ajouté (modifié)
- `src/App.jsx` - Routes login/register (modifié)
- `src/components/Header.jsx` - Intégration auth (modifié)

## 🎨 Style UI/UX

Les pages Login et Register reprennent le style existant :
- Utilisation des composants `Button`, `Section`, `Heading`
- Couleurs du thème (`n-1`, `n-8`, `color-1`, etc.)
- Effets de gradient et backdrop blur
- Typographie cohérente (`font-code`, `font-sans`)
- Responsive design

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration (7 jours)
- Validation d'email côté backend
- Protection CSRF via CORS configuré
- Tokens stockés dans localStorage (à améliorer avec httpOnly cookies en production)

## ⏭️ Prochaines Étapes

- [ ] Page Dashboard utilisateur
- [ ] Gestion de profil
- [ ] Mot de passe oublié / Réinitialisation
- [ ] OAuth (Google, GitHub)
- [ ] Vérification d'email
- [ ] Système de quotas par plan

## 🐛 Notes

- La base de données SQLite est créée automatiquement au démarrage dans `backend/database.db`
- Le SECRET_KEY JWT est généré aléatoirement à chaque démarrage (à fixer en production)
- Les tokens sont valides 7 jours
- Le plan par défaut est "FREE" pour tous les nouveaux utilisateurs

