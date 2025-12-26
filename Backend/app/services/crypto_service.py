import base64
import os
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256
from app.core.config import settings

def get_derived_key():
    # Derives the 32-byte key using PBKDF2 matching Deno logic
    salt = b"pg-backup-salt"
    return PBKDF2(
        settings.ENCRYPTION_KEY, 
        salt, 
        dkLen=32, 
        count=100000, 
        hmac_hash_module=SHA256
    )

def encrypt(plaintext: str) -> str:
    key = get_derived_key()
    iv = os.urandom(12) # 12-byte nonce for GCM
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode('utf-8'))
    
    # Combined format: IV + Ciphertext + Tag (Matches Deno/WebCrypto)
    combined = iv + ciphertext + tag
    return base64.b64encode(combined).decode('utf-8')

def decrypt(base64_ciphertext: str) -> str:
    key = get_derived_key()
    data = base64.b64decode(base64_ciphertext)
    
    iv = data[:12]
    tag = data[-16:]
    ciphertext = data[12:-16]
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    decrypted = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted.decode('utf-8')