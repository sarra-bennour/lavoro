@echo off
echo Installation de l'environnement Python pour la priorisation des tâches...

REM Créer un environnement virtuel
python -m venv .venv

REM Activer l'environnement virtuel
call .venv\Scripts\activate

REM Installer les dépendances
pip install -r requirements.txt

REM Entraîner le modèle
python train_model.py

echo Installation terminée!
echo Pour activer l'environnement, exécutez: .venv\Scripts\activate
pause
