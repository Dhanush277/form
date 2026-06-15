import joblib
import os
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'trained_model', 'rf_model.joblib')

model = None

def load_model():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")

def predict_completion(field_count: int, required_count: int, completion_time_sec: int, complexity_score: int, click_count: int, scroll_count: int):
    load_model()
    if model is None:
        return {"prediction": "Unknown", "confidence_score": 0.0}
    
    optional_count = field_count - required_count
    
    features = np.array([[field_count, required_count, optional_count, completion_time_sec, complexity_score, click_count, scroll_count]])
    
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    confidence = float(np.max(probabilities)) * 100
    
    return {
        "prediction": prediction,
        "confidence_score": round(confidence, 2)
    }
