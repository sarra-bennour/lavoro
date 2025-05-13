import joblib
import sys
import json
import numpy as np

# Load models
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_perf = joblib.load(os.path.join(BASE_DIR, "model_performance_score.pkl"))
model_tasks = joblib.load(os.path.join(BASE_DIR, "model_total_tasks.pkl"))
model_prod = joblib.load(os.path.join(BASE_DIR, "model_productivity.pkl"))


# Load input JSON from Node.js
input_data = json.loads(sys.argv[1])  # e.g., python predict_member.py '{"experience_level": 2, ...}'

# Convert to model input format
features = [
    input_data["experience_level"],
    input_data["missed_deadlines"],
    input_data["average_task_duration"],
    input_data["task_quality_score"],
    input_data["deadline_adherence"],
    input_data["task_efficiency"],
    input_data["completion_rate"],
]

# Predict
X_input = np.array(features).reshape(1, -1)
score = model_perf.predict(X_input)[0]
tasks = model_tasks.predict(X_input)[0]
prod = model_prod.predict(X_input)[0]

output = {
    "predicted_score": float(round(score, 2)),
    "predicted_tasks": int(round(tasks)),
    "predicted_productivity": float(round(prod, 2))
}
print(json.dumps(output))