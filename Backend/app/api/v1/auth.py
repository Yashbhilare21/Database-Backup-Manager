from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, Profile, UserRole
from app.schemas import user as user_schema
from app.schemas import token as token_schema

router = APIRouter()

@router.post("/signup", response_model=user_schema.User)
def create_user(obj_in: user_schema.UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == obj_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create User
    new_user = User(
        email=obj_in.email,
        hashed_password=security.get_password_hash(obj_in.password)
    )
    db.add(new_user)
    db.flush() 

    # Create Profile & Default Role
    profile = Profile(user_id=new_user.id, email=obj_in.email, full_name=obj_in.full_name)
    role = UserRole(user_id=new_user.id, role="user")
    db.add(profile)
    db.add(role)
    
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=token_schema.Token)
def login(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }

# --- ADD THIS ROUTE TO FIX THE 404 ---
@router.get("/me", response_model=user_schema.User)
def get_user_me(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Fetch the currently authenticated user's profile.
    The 'deps.get_current_user' handles the token validation.
    """
    return current_user