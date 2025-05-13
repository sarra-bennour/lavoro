import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
import joblib
import os

# Créer le dossier models s'il n'existe pas
os.makedirs('models', exist_ok=True)

# Charger les données
df = pd.read_csv('Priorisation-des-tâches_final.csv')

# Renommer les colonnes pour correspondre à notre modèle
df = df.rename(columns={
    'Task_ID': 'task_id',
    'Task_Name': 'title',
    'Duration': 'duration',
    'Deadline': 'deadline',
    'Resource_ID': 'importance',
    'Priority': 'priority',
    'Status': 'status'
})

# Convertir la date en format datetime
df['deadline'] = pd.to_datetime(df['deadline'])

# Calculer le nombre de jours jusqu'à la deadline (à partir d'aujourd'hui)
today = datetime.now()
df['days_until_deadline'] = (df['deadline'] - pd.Timestamp(today)).dt.days

# Encoder les variables catégorielles
le_title = LabelEncoder()
df['title_encoded'] = le_title.fit_transform(df['title'])

le_priority = LabelEncoder()
df['priority_encoded'] = le_priority.fit_transform(df['priority'])

le_status = LabelEncoder()
df['status_encoded'] = le_status.fit_transform(df['status'])

# Créer des caractéristiques pour le modèle
X = df[['duration', 'days_until_deadline', 'importance', 'title_encoded', 'priority_encoded']]

# Créer un score de priorité combiné (notre cible)
# Plus le score est élevé, plus la tâche est prioritaire
df['priority_score'] = (
    (10 - df['days_until_deadline'].clip(0, 10)) * 0.5 +  # Moins de jours = plus prioritaire
    df['importance'] * 0.3 +                              # Plus d'importance = plus prioritaire
    df['duration'] * 0.2                                  # Plus longue durée = plus prioritaire
)

# Normaliser le score entre 0 et 100
df['priority_score'] = (df['priority_score'] - df['priority_score'].min()) / (df['priority_score'].max() - df['priority_score'].min()) * 100

y = df['priority_score']

# Diviser les données en ensembles d'entraînement et de test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entraîner le modèle XGBoost
model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

# Évaluer le modèle
train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)

print(f"Score R² sur l'ensemble d'entraînement: {train_score:.4f}")
print(f"Score R² sur l'ensemble de test: {test_score:.4f}")

# Sauvegarder le modèle et les encodeurs
joblib.dump(model, 'models/xgboost_model.joblib')
joblib.dump(le_title, 'models/title_encoder.joblib')
joblib.dump(le_priority, 'models/priority_encoder.joblib')
joblib.dump(le_status, 'models/status_encoder.joblib')

print("Modèle et encodeurs sauvegardés avec succès!")
