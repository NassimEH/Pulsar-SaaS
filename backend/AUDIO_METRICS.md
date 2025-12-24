# Métriques Audio Extraites

Ce document décrit toutes les métriques audio extraites par le système pour l'analyse IA.

## Métriques de Base (existantes)

### Rythmiques & Harmoniques
- **BPM** : Tempo en battements par minute
- **Key** : Tonalité détectée (C, C#, D, etc.)
- **Tempo Stability** : Stabilité du tempo (0-1, 1.0 = parfaitement stable)

### Niveaux
- **RMS Level** : Niveau RMS moyen (linéaire et en dB)
- **Peak Level** : Niveau de crête maximum (dB)

### Spectrales
- **Spectral Centroid** : Fréquence moyenne (Hz) - indicateur de brillance
- **Spectral Bandwidth** : Largeur de la distribution fréquentielle (Hz)
- **Zero Crossing Rate** : Taux de passages par zéro - indicateur de contenu percussif

---

## Nouvelles Métriques Ajoutées

### Niveaux & Dynamique

#### Crest Factor
- **Description** : Ratio entre le niveau de crête (peak) et le niveau RMS
- **Valeur** : Ratio linéaire et en dB
- **Interprétation** :
  - **8-12 dB** : Musique dynamique (bonne dynamique préservée)
  - **4-6 dB** : Musique compressée (typique du mastering moderne)
  - **< 4 dB** : Très compressé, peut manquer de dynamique
- **Utilité** : Évalue si le mixage/mastering a préservé la dynamique naturelle

#### Dynamic Range
- **Description** : Différence entre le niveau de crête et le niveau RMS (en dB)
- **Interprétation** :
  - **> 14 dB** : Très dynamique (peut être trop pour le streaming)
  - **10-14 dB** : Bonne dynamique
  - **6-10 dB** : Dynamique modérée (standard streaming)
  - **< 6 dB** : Faible dynamique (très compressé)
- **Utilité** : Indique la plage dynamique disponible dans le mix

### Métriques Spectrales Avancées

#### Spectral Rolloff
- **Description** : Fréquence en dessous de laquelle 85% de l'énergie spectrale est concentrée
- **Interprétation** :
  - **> 8000 Hz** : Beaucoup d'aigus, production brillante
  - **4000-8000 Hz** : Équilibre normal
  - **< 4000 Hz** : Manque d'aigus, production sombre
- **Utilité** : Identifie rapidement si le mix manque de hautes fréquences

#### Spectral Contrast
- **Description** : Contraste entre les pics et les vallées dans le spectre fréquentiel
- **Interprétation** :
  - **Valeur élevée** : Contraste fréquentiel marqué (séparation claire des instruments)
  - **Valeur faible** : Spectre plus uniforme (peut indiquer du masquage)
- **Utilité** : Évalue la clarté et la séparation fréquentielle

#### Spectral Flatness
- **Description** : Mesure de la "pureté tonale" vs "bruit"
- **Interprétation** :
  - **0.0** : Signal purement tonal (sinusoïde)
  - **1.0** : Signal purement bruité (bruit blanc)
  - **0.1-0.3** : Musique normale
- **Utilité** : Détecte les problèmes de bruit ou de distorsion

### Analyse par Bandes Fréquentielles

Le système analyse la distribution d'énergie dans 5 bandes fréquentielles :

1. **Basses (20-250 Hz)** : Fondations, kick, basse
2. **Bas-médiums (250-500 Hz)** : Zone "muddy", peut masquer la clarté
3. **Médiums (500-2000 Hz)** : Voix, instruments principaux
4. **Hauts-médiums (2000-4000 Hz)** : Présence, clarté
5. **Aigus (4000-20000 Hz)** : Brillance, air, détails

**Interprétation** :
- Distribution équilibrée : ~20% par bande (idéal)
- Déséquilibre : Une bande > 40% ou < 10% indique un problème
- **Exemples de problèmes** :
  - Basses > 35% : Mix "lourd", manque de clarté
  - Bas-médiums > 30% : Mix "muddy", étouffé
  - Aigus < 15% : Mix sombre, manque d'air

### Analyse Harmonique/Percussive

#### Harmonic Ratio
- **Description** : Proportion de contenu harmonique (tonal) vs percussif
- **Interprétation** :
  - **> 0.7** : Principalement harmonique (musique mélodique)
  - **0.3-0.7** : Équilibre harmonique/percussif
  - **< 0.3** : Principalement percussif (batterie, rythme)
- **Utilité** : Comprend la nature du contenu audio

#### Percussive Ratio
- **Description** : Complément du ratio harmonique (1 - harmonic_ratio)
- **Utilité** : Évalue la présence d'éléments rythmiques

### Stéréo

#### Stereo Width
- **Description** : Corrélation entre les canaux gauche et droit
- **Interprétation** :
  - **> 0.8** : Stéréo étroit (proche du mono)
  - **0.3-0.8** : Stéréo normal
  - **< 0.3** : Stéréo large (séparation importante)
  - **< 0** : Phase inversée (problème)
- **Utilité** : Évalue l'utilisation de l'espace stéréo

---

## Standards de l'Industrie

### Niveaux de Mastering
- **RMS cible** : -9 à -6 dBFS pour streaming moderne
- **Peak** : < -0.3 dBFS (éviter le clipping)
- **LUFS** : -14 à -8 LUFS (selon la plateforme)

### Dynamique
- **Crest Factor idéal** : 6-10 dB pour streaming
- **Dynamic Range minimum** : 6 dB
- **Dynamic Range idéal** : 10-14 dB

### Équilibre Fréquentiel
- Distribution équilibrée entre toutes les bandes
- Éviter les pics ou creux importants dans une bande

---

## Utilisation dans l'Analyse IA

Toutes ces métriques sont automatiquement transmises à l'IA Gemini qui :
1. Analyse chaque métrique individuellement
2. Identifie les corrélations entre métriques
3. Compare aux standards de l'industrie
4. Génère des recommandations précises et techniques
5. Fournit des valeurs cibles spécifiques pour l'amélioration



