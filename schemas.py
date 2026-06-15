from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserOut(UserBase):
    id: int
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class FormFieldBase(BaseModel):
    field_type: str
    label: str
    required: bool = False
    options: Optional[str] = None
    order: int = 0

class FormFieldCreate(FormFieldBase):
    pass

class FormFieldOut(FormFieldBase):
    id: int
    form_id: str
    class Config:
        from_attributes = True

class FormBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "draft"

class FormCreate(FormBase):
    pass

class FormOut(FormBase):
    id: str
    user_id: int
    created_at: datetime
    fields: List[FormFieldOut] = []
    class Config:
        from_attributes = True

class ResponseBase(BaseModel):
    response_data: str # JSON string

class ResponseCreate(ResponseBase):
    pass

class ResponseOut(ResponseBase):
    id: int
    form_id: str
    user_id: Optional[int]
    submitted_at: datetime
    class Config:
        from_attributes = True

class AIGenerateRequest(BaseModel):
    topic: str
    industry: Optional[str] = None
    audience: Optional[str] = None
    difficulty: Optional[str] = None
