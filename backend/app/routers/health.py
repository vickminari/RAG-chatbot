from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.s3_service import s3_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Health check básico"""
    return {
        "status": "ok",
        "message": "API está funcionando"
    }


@router.get("/s3")
async def s3_health_check():
    """
    Diagnóstico de conexão S3
    
    Testa:
    1. Se as credenciais AWS estão configuradas
    2. Se o bucket existe
    3. Se tem permissão de listagem
    """
    diagnostics = {
        "credentials_configured": False,
        "bucket_name": settings.s3_bucket_name,
        "region": settings.aws_region,
        "bucket_exists": False,
        "has_list_permission": False,
        "has_put_permission": False,
        "errors": []
    }
    
    # Verificar se credenciais estão configuradas
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        diagnostics["credentials_configured"] = True
    else:
        diagnostics["errors"].append("Credenciais AWS não configuradas no .env")
        return diagnostics
    
    # Testar se bucket existe
    try:
        s3_service.s3_client.head_bucket(Bucket=settings.s3_bucket_name)
        diagnostics["bucket_exists"] = True
    except Exception as e:
        diagnostics["errors"].append(f"Bucket não existe ou sem acesso: {str(e)}")
        return diagnostics
    
    # Testar listagem (permissão s3:ListBucket)
    try:
        s3_service.s3_client.list_objects_v2(
            Bucket=settings.s3_bucket_name,
            MaxKeys=1
        )
        diagnostics["has_list_permission"] = True
    except Exception as e:
        diagnostics["errors"].append(f"Sem permissão de listagem: {str(e)}")
    
    # Testar upload (permissão s3:PutObject)
    test_key = "_health_check_test.txt"
    try:
        s3_service.s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=test_key,
            Body=b"test",
            ContentType="text/plain"
        )
        diagnostics["has_put_permission"] = True
        
        # Limpar arquivo de teste
        try:
            s3_service.s3_client.delete_object(
                Bucket=settings.s3_bucket_name,
                Key=test_key
            )
        except:
            pass
            
    except Exception as e:
        diagnostics["errors"].append(f"Sem permissão de upload: {str(e)}")
    
    # Determinar status geral
    if diagnostics["has_put_permission"]:
        diagnostics["status"] = "ok"
        diagnostics["message"] = "S3 configurado corretamente"
    elif diagnostics["bucket_exists"]:
        diagnostics["status"] = "partial"
        diagnostics["message"] = "Bucket existe mas faltam permissões"
    else:
        diagnostics["status"] = "error"
        diagnostics["message"] = "Problemas com configuração S3"
    
    return diagnostics


@router.get("/db")
async def database_health_check(db: Session = Depends(get_db)):
    """Verifica conexão com banco de dados"""
    try:
        # Tenta executar query simples
        db.execute("SELECT 1")
        return {
            "status": "ok",
            "message": "Banco de dados conectado",
            "database_url": settings.database_url
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro ao conectar no banco: {str(e)}"
        }
