# Mise à jour de Google Generative AI

## Problème

Si vous rencontrez l'erreur `404 models/gemini-1.5-flash is not found`, c'est probablement parce que votre version de `google-generativeai` est trop ancienne.

## Solution : Mettre à jour la bibliothèque

### Étape 1 : Mettre à jour la bibliothèque

Dans le terminal, depuis le dossier `backend/` :

```bash
pip install --upgrade google-generativeai
```

Ou pour installer la version spécifique :

```bash
pip install google-generativeai>=0.8.0
```

### Étape 2 : Redémarrer le serveur backend

Après la mise à jour, **redémarrez obligatoirement** le serveur backend :

```bash
python -m uvicorn main:app --reload
```

## Vérification

Le code essaie automatiquement plusieurs modèles dans cet ordre :
1. `gemini-pro` (ancien modèle, compatible avec les anciennes versions)
2. `gemini-1.5-flash` (nouveau modèle rapide)
3. `gemini-1.5-pro` (nouveau modèle puissant)

Si un modèle fonctionne, vous verrez dans les logs du backend :
```
Modèle utilisé avec succès: gemini-pro
```

## Si le problème persiste

1. Vérifiez que votre clé API est valide sur https://aistudio.google.com/
2. Vérifiez que le fichier `.env` est bien dans `backend/.env`
3. Vérifiez les logs du backend pour voir quels modèles ont été testés

