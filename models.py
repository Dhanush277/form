from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user") # admin or user
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    forms = relationship("Form", back_populates="owner")
    responses = relationship("Response", back_populates="user")

class Form(Base):
    __tablename__ = "forms"
    id = Column(String, primary_key=True, index=True) # UUID for shareable links
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="draft") # draft or published
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="forms")
    fields = relationship("FormField", back_populates="form", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")
    predictions = relationship("MLPrediction", back_populates="form", cascade="all, delete-orphan")

class FormField(Base):
    __tablename__ = "form_fields"
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(String, ForeignKey("forms.id"))
    field_type = Column(String) # text, email, number, textarea, radio, checkbox, dropdown, date, rating, file
    label = Column(String)
    required = Column(Boolean, default=False)
    options = Column(Text, nullable=True) # JSON string for dropdown/radio/checkbox options
    order = Column(Integer, default=0)

    form = relationship("Form", back_populates="fields")

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(String, ForeignKey("forms.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null if anonymous public response
    response_data = Column(Text) # JSON string of responses
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship("Form", back_populates="responses")
    user = relationship("User", back_populates="responses")

class AIGeneratedQuestion(Base):
    __tablename__ = "ai_generated_questions"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    generated_questions = Column(Text) # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MLPrediction(Base):
    __tablename__ = "ml_predictions"
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(String, ForeignKey("forms.id"))
    prediction = Column(String) # Complete, Partial, Abandon
    confidence_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship("Form", back_populates="predictions")
