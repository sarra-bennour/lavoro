import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import warnings

# Supprimer les avertissements
warnings.filterwarnings("ignore")

# Charger les modèles et encodeurs
model_path = Path(__file__).parent / 'models' / 'xgboost_model.joblib'
title_encoder_path = Path(__file__).parent / 'models' / 'title_encoder.joblib'
priority_encoder_path = Path(__file__).parent / 'models' / 'priority_encoder.joblib'
status_encoder_path = Path(__file__).parent / 'models' / 'status_encoder.joblib'

try:
    model = joblib.load(model_path)
    title_encoder = joblib.load(title_encoder_path)
    priority_encoder = joblib.load(priority_encoder_path)
    status_encoder = joblib.load(status_encoder_path)
except Exception as e:
    print(json.dumps({"error": f"Erreur lors du chargement des modèles: {str(e)}"}))
    sys.exit(1)

def predict_priority(tasks):
    try:
        # Créer un DataFrame à partir des tâches
        df = pd.DataFrame(tasks)

        # Convertir la date en format datetime et s'assurer qu'elle est "naive" (sans timezone)
        df['deadline'] = pd.to_datetime(df['deadline'], errors='coerce').dt.tz_localize(None)

        # Vérifier si la colonne start_date existe avant de la traiter
        if 'start_date' in df.columns:
            df['start_date'] = pd.to_datetime(df['start_date'], errors='coerce').dt.tz_localize(None)
        else:
            # Si la colonne n'existe pas, créer une colonne vide
            df['start_date'] = pd.NaT

        # Calculer le nombre de jours jusqu'à la deadline
        today = datetime.now()

        # Calculer le nombre de jours jusqu'à la deadline (peut être négatif pour les deadlines passées)
        df['days_until_deadline_raw'] = (df['deadline'] - pd.Timestamp(today)).dt.days

        # NOUVELLE LOGIQUE: Vérifier les incohérences de dates
        # Si la date de début est après la date limite, c'est une incohérence
        df['date_inconsistency'] = False
        # Vérifier uniquement si les deux dates existent et ne sont pas NaT
        mask = ~df['start_date'].isna() & ~df['deadline'].isna() & (df['start_date'] > df['deadline'])
        df.loc[mask, 'date_inconsistency'] = True

        # CORRECTION IMPORTANTE: Traiter différemment les deadlines passées
        # Pour les deadlines passées, on attribue une valeur négative pour réduire leur priorité
        df['days_until_deadline'] = df['days_until_deadline_raw'].copy()

        # Pour les deadlines très lointaines (> 180 jours), on limite à 180 pour éviter des priorités trop basses
        df['days_until_deadline'] = df['days_until_deadline'].clip(upper=180)

        # Remplacer les valeurs NaN par 30 (par défaut, un mois)
        df['days_until_deadline'] = df['days_until_deadline'].fillna(30)

        # Créer un facteur d'ajustement pour les deadlines (priorité ajustée)
        df['deadline_adjustment'] = 1.0  # Valeur par défaut (pas d'ajustement)

        # Réduire fortement la priorité des tâches dont la deadline est dépassée
        df.loc[df['days_until_deadline_raw'] < 0, 'deadline_adjustment'] = 0.4  # 60% de réduction

        # Réduire légèrement la priorité des tâches dont la deadline est très lointaine (> 180 jours)
        df.loc[df['days_until_deadline_raw'] > 180, 'deadline_adjustment'] = 0.6  # 40% de réduction

        # Réduire très légèrement la priorité des tâches dont la deadline est lointaine (90-180 jours)
        df.loc[(df['days_until_deadline_raw'] > 90) & (df['days_until_deadline_raw'] <= 180), 'deadline_adjustment'] = 0.8  # 20% de réduction

        # Augmenter la priorité des tâches dont la deadline est très proche (moins de 7 jours)
        df.loc[(df['days_until_deadline_raw'] >= 0) & (df['days_until_deadline_raw'] <= 7), 'deadline_adjustment'] = 1.8  # 80% d'augmentation

        # Augmenter légèrement la priorité des tâches dont la deadline est proche (7-14 jours)
        df.loc[(df['days_until_deadline_raw'] > 7) & (df['days_until_deadline_raw'] <= 14), 'deadline_adjustment'] = 1.4  # 40% d'augmentation

        # Ajuster pour les incohérences de dates
        df.loc[df['date_inconsistency'], 'deadline_adjustment'] = 0.5  # 50% de réduction pour les dates incohérentes

        # Ajuster l'importance en fonction de la priorité (directement dans la colonne 'importance')
        df['importance'] = df.apply(lambda row: {
            'High': 10,
            'Medium': 5,
            'Low': 1
        }.get(row['priority'], 5), axis=1)

        # Ajuster la durée pour qu'elle ait plus d'impact (directement dans la colonne 'duration')
        # Mais conserver une copie de la valeur originale
        df['original_duration'] = df['duration'].copy()
        df['duration'] = df['duration'].fillna(1) * 1.5

        # Encoder les variables catégorielles
        # Gérer les titres inconnus
        df['title_encoded'] = df['title'].apply(
            lambda x: title_encoder.transform([x])[0] if x in title_encoder.classes_ else -1
        )

        # Encoder la priorité
        df['priority_encoded'] = df['priority'].apply(
            lambda x: priority_encoder.transform([x])[0] if x in priority_encoder.classes_ else -1
        )

        # Créer les caractéristiques pour le modèle avec les noms de colonnes originaux
        X = df[['duration', 'days_until_deadline', 'importance', 'title_encoded', 'priority_encoded']]

        # Prédire les scores de priorité avec le modèle ML
        priority_scores = model.predict(X)

        # Appliquer le facteur d'ajustement aux scores de priorité
        adjusted_scores = priority_scores * df['deadline_adjustment'].values

        # Ajouter les scores aux tâches
        result = []
        for i, task in enumerate(tasks):
            task_copy = task.copy()
            raw_score = float(priority_scores[i])
            adjusted_score = float(adjusted_scores[i])

            # Ajouter les deux scores pour le débogage
            task_copy['raw_priority_score'] = raw_score
            task_copy['priority_score'] = adjusted_score

            # Ajouter des informations sur la deadline pour le débogage
            task_copy['days_until_deadline'] = int(df['days_until_deadline'].iloc[i]) if i < len(df) else None
            task_copy['deadline_adjustment'] = float(df['deadline_adjustment'].iloc[i]) if i < len(df) else None
            task_copy['date_inconsistency'] = bool(df['date_inconsistency'].iloc[i]) if i < len(df) else False

            result.append(task_copy)

        # Trier les tâches par score de priorité (décroissant)
        result.sort(key=lambda x: x['priority_score'], reverse=True)

        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Processus persistant pour plusieurs prédictions
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break

            data = json.loads(line)
            result = predict_priority(data['tasks'])
            print(json.dumps(result))
            sys.stdout.flush()

        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()
