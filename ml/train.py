import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Create synthetic dataset
np.random.seed(42)
n_samples = 1000

field_count = np.random.randint(1, 51, n_samples)
required_count = np.array([np.random.randint(0, fc + 1) for fc in field_count])
optional_count = field_count - required_count
completion_time_sec = np.random.randint(10, 601, n_samples)
complexity_score = np.random.randint(1, 11, n_samples)
click_count = np.random.randint(5, 201, n_samples)
scroll_count = np.random.randint(0, 101, n_samples)

# Target classes: 'Complete', 'Partial', 'Abandon'
y = []
for i in range(n_samples):
    score = (completion_time_sec[i] / 60) + complexity_score[i] + (required_count[i] * 0.5)
    if score < 15:
        y.append('Complete')
    elif score < 25:
        y.append('Partial')
    else:
        y.append('Abandon')

df = pd.DataFrame({
    'field_count': field_count,
    'required_count': required_count,
    'optional_count': optional_count,
    'completion_time_sec': completion_time_sec,
    'complexity_score': complexity_score,
    'click_count': click_count,
    'scroll_count': scroll_count,
    'status': y
})

# Preprocessing
X = df.drop('status', axis=1)
y = df['status']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

# Ensure directory exists
os.makedirs(os.path.join(os.path.dirname(__file__), 'trained_model'), exist_ok=True)
model_path = os.path.join(os.path.dirname(__file__), 'trained_model', 'rf_model.joblib')
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
