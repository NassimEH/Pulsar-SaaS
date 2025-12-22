# Migration vers google.genai

## Problème

Le package `google.generativeai` est déprécié et affiche un warning :
```
FutureWarning: All support for the `google.generativeai` package has ended.
```

## Solution

Le code a été mis à jour pour supporter automatiquement les deux packages :
1. **Nouveau package** : `google.genai` (recommandé, pas de warning)
2. **Ancien package** : `google.generativeai` (fallback si le nouveau n'est pas disponible)

## Installation du nouveau package

### Option 1 : Installer le nouveau package (Recommandé)

```bash
cd brainwave/backend
pip install google-genai>=1.0.0
```

Le code utilisera automatiquement le nouveau package et le warning disparaîtra.

### Option 2 : Garder l'ancien package

Si vous préférez garder l'ancien package qui fonctionne déjà :
```bash
pip install google-generativeai>=0.8.0
```

Le warning sera automatiquement supprimé par le code, mais il est recommandé de migrer vers le nouveau package.

## Vérification

Après l'installation, redémarrez le serveur backend. Le code détectera automatiquement quel package utiliser.

Dans les logs, vous verrez :
- Si le nouveau package est utilisé : pas de warning
- Si l'ancien package est utilisé : le warning est automatiquement supprimé

## Notes

- Le code fonctionne avec les deux packages
- Le nouveau package `google.genai` est recommandé pour éviter les warnings
- La fonctionnalité reste identique dans les deux cas

