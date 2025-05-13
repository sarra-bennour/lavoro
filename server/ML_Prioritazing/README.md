# Système de Priorisation des Tâches avec XGBoost

Ce module utilise le machine learning (XGBoost) pour prioriser automatiquement les tâches en fonction de leur deadline, priorité et autres facteurs.

## Installation

1. Assurez-vous que Python 3.8+ est installé sur votre système
2. Exécutez le script d'installation:
   - Sur Windows: `setup.bat`
   - Sur Linux/Mac: `bash setup.sh`

## Fonctionnement

Le système utilise un modèle XGBoost pour prédire un score de priorité pour chaque tâche en fonction de:
- La deadline (plus la deadline est proche, plus la priorité est élevée)
- La priorité définie manuellement (Low, Medium, High)
- La durée estimée de la tâche
- Le type de tâche (basé sur le titre)

## Utilisation via l'API

Le système est accessible via les endpoints suivants:

1. **GET /ai-prioritization/my-tasks**
   - Retourne les tâches de l'utilisateur connecté, triées par priorité

2. **GET /ai-prioritization/project/:projectId**
   - Retourne les tâches d'un projet spécifique, triées par priorité

3. **POST /ai-prioritization/prioritize**
   - Priorise une liste de tâches fournie dans la requête
   - Corps de la requête: `{ "tasks": [...] }`

## Réentraînement du modèle

Pour réentraîner le modèle avec de nouvelles données:

1. Mettez à jour le fichier CSV avec les nouvelles données
2. Exécutez `python train_model.py`

## Structure des fichiers

- `train_model.py`: Script pour entraîner le modèle XGBoost
- `predict.py`: Script pour faire des prédictions avec le modèle entraîné
- `models/`: Dossier contenant les modèles entraînés et les encodeurs
- `requirements.txt`: Liste des dépendances Python
- `setup.bat`/`setup.sh`: Scripts d'installation
