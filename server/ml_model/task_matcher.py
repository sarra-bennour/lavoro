import sys
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
import joblib
import os

# Fonction de tokenizer explicite (remplace le lambda)
def custom_tokenizer(text):
    return text.split()

def train_new_model(tasks, members):
    tasks_df = pd.DataFrame(tasks)
    members_df = pd.DataFrame(members)
    
    tasks_df['skills_str'] = tasks_df['required_skills_list'].apply(' '.join)
    members_df['skills_str'] = members_df['employer_skills_list'].apply(' '.join)
    
    # Configuration corrigée du Vectorizer
    vectorizer = TfidfVectorizer(
        tokenizer=custom_tokenizer,
        lowercase=True,
        token_pattern=None  # Explicitement désactivé
    )
    
    # Entraînement
    all_skills = pd.concat([tasks_df['skills_str'], members_df['skills_str']])
    vectorizer.fit(all_skills)
    
    # Modèle KNN
    knn = NearestNeighbors(n_neighbors=5, metric='cosine')
    member_features = vectorizer.transform(members_df['skills_str'])
    knn.fit(member_features)
    
    # Préparation du modèle pour la sérialisation
    model = {
        'vectorizer': vectorizer,
        'knn': knn,
        'member_ids': members_df['employer_id'].values.tolist(),
        'member_data': members_df.to_dict(orient='records')
    }
    
    # Sauvegarde avec chemin absolu
    model_path = os.path.abspath('task_member_matcher.joblib')
    joblib.dump(model, model_path)
    
    return model

def load_or_train_model(tasks, members):
    model_path = os.path.abspath('task_member_matcher.joblib')
    
    if os.path.exists(model_path):
        try:
            return joblib.load(model_path)
        except:
            os.remove(model_path)
            return train_new_model(tasks, members)
    else:
        return train_new_model(tasks, members)

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        
        # Validation des entrées
        if not all(k in input_data for k in ['tasks', 'members']):
            raise ValueError("Données d'entrée invalides")
            
        model = load_or_train_model(input_data['tasks'], input_data['members'])
        
        # Traitement de la tâche
        task = input_data['tasks'][0]
        task_features = model['vectorizer'].transform([' '.join(task['required_skills_list'])])
        
        distances, indices = model['knn'].kneighbors(
            task_features, 
            n_neighbors=input_data.get('topN', 3)
        )
        
        # Préparation des résultats
        matches = []
        for dist, idx in zip(distances[0], indices[0]):
            member = model['member_data'][idx]
            matches.append({
                'member_id': model['member_ids'][idx],
                'score': float(1 - dist),
                'skills': member['employer_skills_list']
            })
        
        print(json.dumps({
            'task_id': task['task_id'],
            'matches': matches
        }))
        
    except Exception as e:
        print(f"ERREUR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()