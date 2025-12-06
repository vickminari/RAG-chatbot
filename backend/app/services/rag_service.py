import os
import tempfile
import logging
from io import BytesIO
from typing import List, Tuple, Optional
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.core.config import settings
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)


class RAGService:
    """
    Serviço para indexação e recuperação RAG (Retrieval-Augmented Generation).
    
    Responsável por:
    - Indexar documentos PDF usando FAISS
    - Gerar embeddings com HuggingFace (otimizado para CPU)
    - Fazer chunking otimizado dos documentos
    - Armazenar índices no S3
    - Recuperar chunks relevantes para queries
    """
    
    def __init__(self):
        """Inicializa o serviço RAG com configurações otimizadas para CPU."""
        self._embedder = None
        self._text_splitter = None
        
    @property
    def embedder(self):
        """Lazy loading do embedder"""
        if self._embedder is None:
            logger.info("Inicializando embeddings HuggingFace (CPU otimizado)...")
            self._embedder = HuggingFaceEmbeddings(
                model_name=settings.embedding_model,
                model_kwargs={
                    'device': 'cpu'
                },
                encode_kwargs={
                    'batch_size': 32,  # Otimizado para 8GB RAM - processa 32 chunks por vez
                    'normalize_embeddings': True,  # Busca mais rápida
                    'show_progress_bar': False  # Reduz overhead
                }
            )
        return self._embedder

    @property
    def text_splitter(self):
        """Lazy loading do text splitter"""
        if self._text_splitter is None:
            # Text splitter otimizado para PDFs pequenos (≤10MB)
            self._text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.chunk_size,  # 1200 chars
                chunk_overlap=settings.chunk_overlap,  # 200 chars
                add_start_index=True,  # Guarda posição original
                separators=["\n\n", "\n", ". ", " ", ""]  # Prioriza quebras semânticas
            )
        return self._text_splitter
    
    async def index_document(
        self,
        document_id: int,
        user_id: int,
        file_content: bytes,
        filename: str
    ) -> Tuple[str, str]:
        """
        Indexa um documento PDF criando embeddings e índice FAISS.
        
        Pipeline:
        1. Valida tamanho do PDF
        2. Loading: Extrai texto do PDF
        3. Chunking: Divide em pedaços semânticos
        4. Embedding: Gera vetores (CPU otimizado)
        5. FAISS Indexing: Cria estrutura de busca
        6. Upload S3: Salva index.faiss e metadata.pkl
        
        Args:
            document_id: ID do documento no banco
            user_id: ID do usuário dono
            file_content: Conteúdo do PDF em bytes
            filename: Nome do arquivo
            
        Returns:
            Tupla (faiss_index_s3_key, metadata_s3_key)
            
        Raises:
            ValueError: Se PDF for muito grande ou inválido
            Exception: Erros durante processamento
        """
        # Validação de tamanho
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > settings.max_pdf_size_mb:
            raise ValueError(
                f"PDF muito grande: {size_mb:.1f}MB (máx: {settings.max_pdf_size_mb}MB)"
            )
        
        logger.info(f"Iniciando indexação do documento {document_id} ({size_mb:.2f}MB)")
        
        # Usar diretório temporário para processar o PDF
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_pdf_path = Path(temp_dir) / filename
            
            # 1. Salvar PDF temporariamente
            with open(temp_pdf_path, 'wb') as f:
                f.write(file_content)
            
            # 2. Loading: Extrair texto do PDF
            logger.info(f"[Doc {document_id}] Fase 1/4: Loading (extração de texto)...")
            loader = PyPDFLoader(str(temp_pdf_path))
            documents = loader.load()
            
            if not documents:
                raise ValueError("PDF vazio ou sem texto extraível")
            
            logger.info(f"[Doc {document_id}] Extraídas {len(documents)} páginas")
            
            # 3. Chunking: Dividir em pedaços
            logger.info(f"[Doc {document_id}] Fase 2/4: Chunking (divisão de texto)...")
            chunks = self.text_splitter.split_documents(documents)
            
            if not chunks:
                raise ValueError("Nenhum chunk gerado após processamento")
            
            logger.info(f"[Doc {document_id}] Gerados {len(chunks)} chunks")
            
            # 4. Embedding + FAISS: Gera vetores e cria índice
            logger.info(f"[Doc {document_id}] Fase 3/4: Embedding + FAISS indexing...")
            vectorstore = FAISS.from_documents(chunks, self.embedder)
            
            # 5. Salvar índice localmente (temporário)
            index_temp_dir = Path(temp_dir) / "index"
            index_temp_dir.mkdir(exist_ok=True)
            vectorstore.save_local(str(index_temp_dir))
            
            # 6. Upload para S3
            logger.info(f"[Doc {document_id}] Fase 4/4: Upload para S3...")
            
            # Paths no S3
            faiss_index_s3_key = f"indices/{user_id}/{document_id}/index.faiss"
            metadata_s3_key = f"metadata/{user_id}/{document_id}/metadata.pkl"
            
            # Upload index.faiss
            with open(index_temp_dir / "index.faiss", 'rb') as f:
                success_index = s3_service.upload_file(
                    file_obj=f,
                    s3_key=faiss_index_s3_key,
                    content_type="application/octet-stream"
                )
            
            # Upload index.pkl (metadata)
            with open(index_temp_dir / "index.pkl", 'rb') as f:
                success_metadata = s3_service.upload_file(
                    file_obj=f,
                    s3_key=metadata_s3_key,
                    content_type="application/octet-stream"
                )
            
            if not (success_index and success_metadata):
                raise Exception("Erro ao fazer upload dos índices para S3")
            
            logger.info(
                f"[Doc {document_id}] Indexação concluída! "
                f"{len(chunks)} chunks indexados"
            )
            
            return faiss_index_s3_key, metadata_s3_key
    
    async def load_vectorstore(
        self,
        faiss_index_s3_key: str,
        metadata_s3_key: str
    ) -> FAISS:
        """
        Carrega um vectorstore FAISS do S3.
        
        Args:
            faiss_index_s3_key: Chave S3 do index.faiss
            metadata_s3_key: Chave S3 do metadata.pkl
            
        Returns:
            Vectorstore FAISS carregado
            
        Raises:
            Exception: Se falhar ao baixar ou carregar
        """
        logger.info(f"Carregando vectorstore do S3...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            index_dir = Path(temp_dir) / "index"
            index_dir.mkdir(exist_ok=True)
            
            # Download index.faiss
            faiss_content = s3_service.download_file(faiss_index_s3_key)
            if not faiss_content:
                raise Exception(f"Erro ao baixar {faiss_index_s3_key}")
            
            with open(index_dir / "index.faiss", 'wb') as f:
                f.write(faiss_content)
            
            # Download index.pkl (metadata)
            metadata_content = s3_service.download_file(metadata_s3_key)
            if not metadata_content:
                raise Exception(f"Erro ao baixar {metadata_s3_key}")
            
            with open(index_dir / "index.pkl", 'wb') as f:
                f.write(metadata_content)
            
            # Carregar vectorstore
            vectorstore = FAISS.load_local(
                str(index_dir),
                self.embedder,
                allow_dangerous_deserialization=True  # Necessário para carregar pickle
            )
            
            logger.info("Vectorstore carregado com sucesso")
            return vectorstore
    
    async def retrieve_relevant_chunks(
        self,
        faiss_index_s3_key: str,
        metadata_s3_key: str,
        query: str,
        k: Optional[int] = None
    ) -> List[Document]:
        """
        Recupera chunks relevantes para uma query.
        
        Args:
            faiss_index_s3_key: Chave S3 do índice FAISS
            metadata_s3_key: Chave S3 dos metadados
            query: Pergunta/query do usuário
            k: Número de chunks a retornar (padrão: settings.default_k_chunks)
            
        Returns:
            Lista de chunks relevantes ordenados por relevância
        """
        if k is None:
            k = settings.default_k_chunks
        
        logger.info(f"Buscando {k} chunks relevantes para query...")
        
        # Carregar vectorstore
        vectorstore = await self.load_vectorstore(faiss_index_s3_key, metadata_s3_key)
        
        # Buscar chunks similares
        chunks = vectorstore.similarity_search(query, k=k)
        
        logger.info(f"Encontrados {len(chunks)} chunks relevantes")
        return chunks
    
    async def generate_document_summary_chunks(
        self,
        faiss_index_s3_key: str,
        metadata_s3_key: str,
        total_pages: Optional[int] = None
    ) -> List[Document]:
        """
        Recupera chunks otimizados para geração de resumo geral do documento.
        
        Usa query otimizada com termos estruturais e conceituais para capturar
        as partes mais importantes do documento.
        
        Args:
            faiss_index_s3_key: Chave S3 do índice FAISS
            metadata_s3_key: Chave S3 dos metadados
            total_pages: Número total de páginas (para calcular K ideal)
            
        Returns:
            Lista de chunks ordenados por página (ordem cronológica)
        """
        # Query otimizada para resumo geral
        SUMMARY_QUERY = """
        resumo introdução objetivo contexto problema solução
        principais pontos key concepts definições metodologia
        resultados conclusão abstract overview síntese fundamentação
        """
        
        # Calcular K ideal baseado no tamanho do documento
        if total_pages:
            if total_pages <= 10:
                k = 8
            elif total_pages <= 50:
                k = 12
            else:
                k = 18
        else:
            k = 12  # Padrão
        
        logger.info(f"Recuperando {k} chunks para resumo (páginas: {total_pages})...")
        
        # Carregar vectorstore e buscar
        vectorstore = await self.load_vectorstore(faiss_index_s3_key, metadata_s3_key)
        chunks = vectorstore.similarity_search(SUMMARY_QUERY, k=k)
        
        # Ordenar por página para manter ordem cronológica
        chunks.sort(key=lambda x: x.metadata.get('page', 0))
        
        logger.info(f"Recuperados {len(chunks)} chunks para resumo")
        return chunks


# Instância singleton
rag_service = RAGService()
