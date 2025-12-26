import os
import boto3
from botocore.client import Config
from app.models.storage import StorageType

class StorageService:
    @staticmethod
    def upload_file(local_path: str, remote_path: str, config):
        """
        config: StorageConfiguration model instance
        """
        if config.storage_type == StorageType.local:
            # Already saved locally in temp folder, move to permanent local storage
            return local_path
            
        elif config.storage_type == StorageType.s3:
            s3 = boto3.client(
                's3',
                endpoint_url=config.endpoint_url,
                aws_access_key_id=config.access_key_encrypted, # Assume decrypted earlier
                aws_secret_access_key=config.secret_key_encrypted,
                config=Config(signature_version='s3v4')
            )
            s3.upload_file(local_path, config.bucket_name, remote_path)
            return f"{config.bucket_name}/{remote_path}"
        
        raise Exception(f"Storage type {config.storage_type} not implemented")