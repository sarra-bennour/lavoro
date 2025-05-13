import json
import joblib
import sys
from sklearn.neighbors import NearestNeighbors

# Load pre-trained model
matcher = joblib.load('task_member_matcher.joblib')

if __name__ == "__main__":
    # Get input data from command line arguments
    input_data = json.loads(sys.argv[1])
    task_data = input_data['task']
    
    # Convert to DataFrame-like format expected by the matcher
    task_df = {
        'task_id': [task_data['task_id']],
        'required_skills_list': [task_data['required_skills_list']],
        'skills_str': [' '.join(task_data['required_skills_list'])]
    }
    
    # Find matches
    matches = matcher.find_best_matches(task_data['task_id'], task_df)
    
    # Output results as JSON
    print(json.dumps(matches))