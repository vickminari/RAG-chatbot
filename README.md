# RAG Chatbot

Aplicação full-stack de chatbot inteligente com Retrieval-Augmented Generation (RAG), permitindo conversas contextualizadas baseadas em documentos PDF com inteligência artificial generativa.

## Visão Geral

O RAG Chatbot é uma plataforma que combina a capacidade de processamento de linguagem natural do Google Gemini com técnicas de RAG para fornecer respostas precisas e contextualizadas baseadas em documentos fornecidos pelo usuário. A aplicação permite upload de PDFs, extração de conteúdo, geração de embeddings e consultas inteligentes sobre os documentos.

## Arquitetura

### Stack Tecnológico

**Backend:**
- FastAPI - Framework web moderno e de alta performance
- SQLAlchemy - ORM para persistência de dados
- LangChain - Framework para aplicações LLM
- Google Gemini - Modelo de linguagem generativa
- FAISS - Armazenamento vetorial para busca semântica
- Sentence Transformers - Geração de embeddings
- AWS S3 - Armazenamento de documentos
- JWT - Autenticação baseada em tokens

**Frontend:**
- React - Biblioteca UI moderna
- TypeScript - Tipagem estática
- Vite - Build tool e dev server
- React Router v7 - Roteamento client-side
- TailwindCSS - Framework de estilização
- React Markdown - Renderização de respostas

**Infraestrutura:**
- Docker & Docker Compose - Containerização
- Nginx - Proxy reverso (produção)
- SQLite - Banco de dados relacional

## Funcionalidades Principais

### Gestão de Usuários
- Registro e autenticação com JWT
- Perfis personalizáveis com foto
- Autenticação via HttpOnly cookies
- Validação robusta de credenciais

### Sistema de Conversas
- Criação automática de conversas
- Histórico completo de mensagens
- Múltiplas conversas simultâneas

### RAG (Retrieval-Augmented Generation)
- Upload de documentos PDF
- Extração e chunking inteligente de texto
- Geração de embeddings semânticos
- Busca vetorial com FAISS
- Respostas contextualizadas baseadas nos documentos
- Suporte a múltiplos documentos por conversa

### Recursos Adicionais
- Geração de resumos automáticos
- Download de documentos via URLs pré-assinadas
- Tema claro/escuro
- Interface responsiva
- Limite de caracteres com contador visual

## Estrutura do Projeto

```
RAG-chatbot/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── auth/              # Sistema de autenticação
│   │   ├── core/              # Configurações e database
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── routers/           # Endpoints da API
│   │   ├── schemas/           # Schemas Pydantic
│   │   └── services/          # Lógica de negócio
│   ├── data/                  # Banco de dados e índices FAISS
│   ├── Dockerfile             # Container de desenvolvimento
│   ├── Dockerfile.prod        # Container de produção
│   └── requirements.txt       # Dependências Python
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── contexts/          # Context API (Auth, Chat, Theme)
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas da aplicação
│   │   └── services/          # Camada de comunicação com API
│   ├── Dockerfile             # Container frontend
│   └── package.json           # Dependências Node
├── nginx/                     # Configurações Nginx
├── docs/                      # Documentação
├── docker-compose.yml         # Orquestração desenvolvimento
└── docker-compose.prod.yml    # Orquestração produção
```

## Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento frontend)
- Python 3.11+ (para desenvolvimento backend)
- Conta Google Cloud com API Gemini habilitada
- Bucket AWS S3 configurado

## Configuração

### 1. Variáveis de Ambiente - Backend

Crie o arquivo `backend/.env` baseado em `backend/.env.example`:

```env
# Database
DATABASE_URL=sqlite:///./data/chat.db

# JWT Settings
SECRET_KEY=sua-chave-secreta-aqui

# Google Gemini API
GOOGLE_API_KEY=sua-api-key-do-google-gemini
QTD_TOKENS_DEFAULT=8000

# AWS S3
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=seu-bucket-name

# Upload Settings
MAX_PDF_SIZE_MB=50
PROFILE_PICTURE_MAX_SIZE_MB=5

# RAG Settings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
DEFAULT_K_CHUNKS=10
```

### 2. Variáveis de Ambiente - Frontend

Crie o arquivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Para produção, ajuste conforme necessário em `frontend/.env.production`.

## Instalação e Execução

### Desenvolvimento com Docker

```bash
# Iniciar apenas o backend
docker-compose up backend-genai-chatbot

# O backend estará disponível em http://localhost:8000
```

Para o frontend em modo desenvolvimento:

```bash
cd frontend
npm install
npm run dev
# Frontend disponível em http://localhost:5173
```

### Produção com Docker

```bash
# Build e execução
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Desenvolvimento Local (sem Docker)

**Backend:**
```bash
cd backend
python -m venv ragenv
source ragenv/Scripts/activate  # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Obter usuário atual
- `PUT /auth/me` - Atualizar perfil
- `PUT /auth/me/password` - Atualizar senha

### Conversas
- `POST /conversations` - Criar conversa
- `GET /conversations` - Listar conversas
- `GET /conversations/{id}` - Obter conversa com mensagens
- `DELETE /conversations/{id}` - Deletar conversa

### Chat
- `POST /chat` - Enviar mensagem e receber resposta

### Documentos
- `POST /documents/upload` - Upload de PDF
- `GET /documents/conversation/{conversation_id}` - Listar documentos
- `GET /documents/{id}` - Obter informações do documento
- `GET /documents/{id}/download` - Gerar URL de download
- `DELETE /documents/{id}` - Deletar documento

### Resumos
- `POST /conversations/{id}/summary` - Gerar resumo
- `GET /conversations/{id}/summaries` - Listar resumos
- `GET /summaries/{id}` - Obter resumo específico
- `DELETE /summaries/{id}` - Deletar resumo

### Health Check
- `GET /health` - Status da aplicação

Documentação completa da API: `backend/API_DOCUMENTATION.md`

## Fluxo de Uso

1. **Registro/Login:** Criar conta ou fazer login
2. **Nova Conversa:** Acessar interface de chat
3. **Upload de Documentos:** Enviar PDFs relevantes
4. **Fazer Perguntas:** Chatbot responde baseado nos documentos
5. **Gerar Resumos:** Criar resumos das conversas
6. **Gerenciar:** Visualizar histórico e gerenciar conversas

## Tecnologias de RAG

### Pipeline RAG

1. **Ingestão:** Upload de PDF via API
2. **Extração:** PyPDF extrai texto do documento
3. **Chunking:** Divisão inteligente em chunks (1200 chars, overlap 200)
4. **Embedding:** Sentence Transformers gera vetores semânticos
5. **Indexação:** FAISS armazena vetores para busca eficiente
6. **Retrieval:** Query do usuário busca chunks relevantes
7. **Augmentation:** Chunks são injetados no contexto
8. **Generation:** Google Gemini gera resposta contextualizada

### Modelos Utilizados

- **LLM:** Google Gemini (gemini-1.5-flash)
- **Embeddings:** all-MiniLM-L6-v2 (384 dimensões)
- **Vector Store:** FAISS (CPU-optimized)

## Segurança

- Autenticação JWT com HttpOnly cookies
- Validação rigorosa de senhas (mínimo 8 caracteres, maiúscula, número, caractere especial)
- Proteção contra XSS via cookies HttpOnly
- CORS configurado apropriadamente
- Validação de tipos de arquivo (apenas PDF)
- Limites de tamanho para uploads
- URLs pré-assinadas do S3 com expiração

## Performance

- Índices FAISS otimizados para CPU
- PyTorch CPU-only (sem dependência CUDA)
- Chunking eficiente com overlap
- Lazy loading de conversas
- Streaming de respostas no frontend

## Licença

Este projeto é destinado a fins educacionais.
Desenvolvido como projeto de Computação Aplicada.

## Autores

- [Gabriel Lopes Bastos](https://github.com/G4brielLB)
- [José Victor Vieira de Oliveira](https://github.com/vickminari)
