import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib


df = pd.read_csv("data.csv")


X = df.drop(columns=["performance_score", "total_tasks_completed", "productivity"])
y_perf = df["performance_score"]
y_tasks = df["total_tasks_completed"]
y_prod = df["productivity"]

# # # Split
X_train, X_test, y_train_perf, y_test_perf = train_test_split(X, y_perf, test_size=0.2, random_state=42)
_, _, y_train_tasks, y_test_tasks = train_test_split(X, y_tasks, test_size=0.2, random_state=42)
_, _, y_train_prod, y_test_prod = train_test_split(X, y_prod, test_size=0.2, random_state=42)

# # # Models
model_perf = xgb.XGBRegressor()
model_tasks = xgb.XGBRegressor()
model_prod = xgb.XGBRegressor()

model_perf.fit(X_train, y_train_perf)
model_tasks.fit(X_train, y_train_tasks)
model_prod.fit(X_train, y_train_prod)

# # # Save models
joblib.dump(model_perf, "model_performance_score.pkl")
joblib.dump(model_tasks, "model_total_tasks.pkl")
joblib.dump(model_prod, "model_productivity.pkl")

print("✅ Models trained and saved.")