from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
import auth
from database import engine, get_db
import uuid
import json

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Enhanced Form Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Using UserCreate schema for login for simplicity here (email & password)
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# Form CRUD
@app.post("/forms", response_model=schemas.FormOut)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    form_id = str(uuid.uuid4())
    new_form = models.Form(**form.model_dump(), id=form_id, user_id=current_user.id)
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    return new_form

@app.get("/forms", response_model=list[schemas.FormOut])
def get_forms(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    forms = db.query(models.Form).filter(models.Form.user_id == current_user.id).all()
    return forms

@app.post("/forms/{form_id}/fields", response_model=schemas.FormFieldOut)
def add_form_field(form_id: str, field: schemas.FormFieldCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    form = db.query(models.Form).filter(models.Form.id == form_id, models.Form.user_id == current_user.id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    new_field = models.FormField(**field.model_dump(), form_id=form_id)
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    return new_field

@app.get("/public/forms/{form_id}", response_model=schemas.FormOut)
def get_public_form(form_id: str, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@app.post("/public/forms/{form_id}/responses", response_model=schemas.ResponseOut)
def submit_response(form_id: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    new_response = models.Response(form_id=form_id, response_data=response.response_data)
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    
    # ML Prediction
    try:
        response_json = json.loads(response.response_data)
        field_count = response_json.get("field_count", 10)
        required_count = response_json.get("required_count", 5)
        completion_time_sec = response_json.get("completion_time_sec", 60)
        complexity_score = response_json.get("complexity_score", 5)
        click_count = response_json.get("click_count", 20)
        scroll_count = response_json.get("scroll_count", 10)
        
        import ml_integration
        pred = ml_integration.predict_completion(field_count, required_count, completion_time_sec, complexity_score, click_count, scroll_count)
        
        ml_record = models.MLPrediction(
            form_id=form_id,
            prediction=pred["prediction"],
            confidence_score=pred["confidence_score"]
        )
        db.add(ml_record)
        db.commit()
    except Exception as e:
        print(f"ML Error: {e}")

    return new_response

@app.post("/ai/generate-questions")
def generate_questions(req: schemas.AIGenerateRequest, current_user: models.User = Depends(auth.get_current_user)):
    import ai_integration
    questions = ai_integration.generate_form_questions(req.topic, req.industry, req.audience, req.difficulty)
    return {"questions": questions}

@app.get("/forms/{form_id}/analytics")
def get_form_analytics(form_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    form = db.query(models.Form).filter(models.Form.id == form_id, models.Form.user_id == current_user.id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    predictions = db.query(models.MLPrediction).filter(models.MLPrediction.form_id == form_id).all()
    
    return {
        "total_responses": len(responses),
        "predictions": [
            {"prediction": p.prediction, "confidence": p.confidence_score} for p in predictions
        ]
    }
