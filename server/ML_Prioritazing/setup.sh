#!/bin/bash
echo "Installation de l'environnement Python pour la priorisation des tâches..."

# Créer un environnement virtuel
python3 -m venv .venv

# Activer l'environnement virtuel
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Entraîner le modèle
python train_model.py

echo "Installation terminée!"
echo "Pour activer l'environnement, exécutez: source .venv/bin/activate"
