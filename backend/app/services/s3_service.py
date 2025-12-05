import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging
from typing import BinaryIO, Optional

logger = logging.getLogger(__name__)


class S3Service:
    """Serviço para operações com AWS S3"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name = settings.s3_bucket_name
    
    def upload_file(self, file_obj: BinaryIO, s3_key: str, content_type: str = "application/pdf") -> bool:
        """
        Faz upload de arquivo para S3
        
        Args:
            file_obj: Objeto de arquivo (file-like)
            s3_key: Caminho do arquivo no S3 (ex: uploads/{user_id}/{conversation_id}/{doc_id}.pdf)
            content_type: Tipo MIME do arquivo
            
        Returns:
            True se sucesso, False se erro
        """
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            logger.info(f"Upload bem-sucedido: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao fazer upload para S3: {e}")
            return False
    
    def download_file(self, s3_key: str) -> Optional[bytes]:
        """
        Baixa arquivo do S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            Conteúdo do arquivo em bytes ou None se erro
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Erro ao baixar do S3: {e}")
            return None
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Remove arquivo do S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            True se sucesso, False se erro
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Arquivo removido do S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao remover do S3: {e}")
            return False
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Gera URL pré-assinada para download direto do S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            expiration: Tempo de validade em segundos (padrão: 1 hora)
            
        Returns:
            URL pré-assinada ou None se erro
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            logger.info(f"Presigned URL gerada para: {s3_key}")
            return url
        except ClientError as e:
            logger.error(f"Erro ao gerar presigned URL: {e}")
            return None
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Verifica se arquivo existe no S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            True se existe, False caso contrário
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False


# Instância singleton
s3_service = S3Service()
