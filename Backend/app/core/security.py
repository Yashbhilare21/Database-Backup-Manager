import base64
import os
from datetime import datetime, timedelta
from typing import Any, Union

from jose import jwt
from passlib.context import CryptContext
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256

from app.core.config import settings

# --- MODERN PASSWD CONTEXT FIX ---
# We explicitly set the bcrypt 'ident' and handle potential errors
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__ident="2b" 
)

# --- JWT Logic ---

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt limit check: if someone enters a password > 72 chars, 
    # we use the first 72 to stay compatible with the algorithm
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    # Ensure the password is truncated to 72 chars for bcrypt compatibility
    return pwd_context.hash(password[:72])

# --- AES-GCM Encryption (Compatible with Supabase Deno Function) ---

def get_encryption_key():
    salt = b"pg-backup-salt"
    # settings.ENCRYPTION_KEY should be a string from .env
    key_material = settings.ENCRYPTION_KEY.encode('utf-8')
    return PBKDF2(
        key_material, 
        salt, 
        dkLen=32, 
        count=100000, 
        hmac_hash_module=SHA256
    )

def encrypt_data(plaintext: str) -> str:
    key = get_encryption_key()
    nonce = os.urandom(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode('utf-8'))
    
    combined = nonce + ciphertext + tag
    return base64.b64encode(combined).decode('utf-8')

def decrypt_data(base64_ciphertext: str) -> str:
    key = get_encryption_key()
    data = base64.b64decode(base64_ciphertext)
    
    nonce = data[:12]
    tag = data[-16:]
    ciphertext = data[12:-16]
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    decrypted = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted.decode('utf-8')