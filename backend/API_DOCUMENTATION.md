# API Completa - Documentação

Este documento descreve todos os endpoints da API, incluindo autenticação, conversas, chat, e documentos.

---

## 📋 Sumário

### Autenticação
1. [Registro de Usuário](#1-registro-de-usuário)
2. [Login](#2-login)
3. [Logout](#3-logout)
4. [Obter Usuário Atual](#4-obter-usuário-atual)
5. [Atualizar Informações do Usuário](#5-atualizar-informações-do-usuário)
6. [Atualizar Senha](#6-atualizar-senha)
7. [Upload de Foto de Perfil](#7-upload-de-foto-de-perfil)

### Conversas
8. [Criar Conversa](#8-criar-conversa)
9. [Listar Conversas](#9-listar-conversas)
10. [Obter Conversa com Mensagens](#10-obter-conversa-com-mensagens)
11. [Deletar Conversa](#11-deletar-conversa)

### Chat
12. [Enviar Mensagem](#12-enviar-mensagem)

### Resumos
13. [Gerar Resumo](#13-gerar-resumo)
14. [Listar Resumos da Conversa](#14-listar-resumos-da-conversa)
15. [Obter Resumo](#15-obter-resumo)
16. [Deletar Resumo](#16-deletar-resumo)

### Documentos
17. [Upload de Documento](#17-upload-de-documento)
18. [Listar Documentos da Conversa](#18-listar-documentos-da-conversa)
19. [Obter Documento](#19-obter-documento)
20. [Gerar URL de Download](#20-gerar-url-de-download)
21. [Deletar Documento](#21-deletar-documento)

### Health Check
22. [Health Check Básico](#22-health-check-básico)
23. [Diagnóstico S3](#23-diagnóstico-s3)
24. [Verificação de Banco de Dados](#24-verificação-de-banco-de-dados)

---

## 1. Registro de Usuário

Cria uma nova conta de usuário no sistema.

### Endpoint
```
POST /auth/register
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** Não requerida

### Corpo da Requisição (Body)

```json
{
  "nome": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "imagem_perfil": "string",  // Opcional
  "descricao": "string"       // Opcional
}
```

### Validações

#### Campo `email`
- Deve ser um email válido
- Será automaticamente normalizado para lowercase
- Deve ser único no sistema

#### Campo `username`
- Mínimo de 3 caracteres
- Apenas letras, números, `_` (underscore) ou `-` (hífen)
- Será normalizado para lowercase
- Deve ser único no sistema

#### Campo `password`
- Mínimo de 8 caracteres
- Pelo menos 1 número
- Pelo menos 1 letra maiúscula
- Pelo menos 1 caractere especial: `!@#$%&*`

#### Campos Opcionais
- `imagem_perfil`: URL ou caminho da imagem de perfil
- `descricao`: Descrição/bio do usuário

### Exemplo de Requisição

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "username": "joao_silva",
    "email": "joao.silva@example.com",
    "password": "SenhaForte123!",
    "imagem_perfil": "https://example.com/avatar.jpg",
    "descricao": "Desenvolvedor Full Stack"
  }'
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.post('http://localhost:8000/auth/register', {
  nome: 'João Silva',
  username: 'joao_silva',
  email: 'joao.silva@example.com',
  password: 'SenhaForte123!',
  imagem_perfil: 'https://example.com/avatar.jpg',
  descricao: 'Desenvolvedor Full Stack'
});

const data = response.data;
```

### Resposta de Sucesso (201 Created)

```json
{
  "id": 1,
  "nome": "João Silva",
  "username": "joao_silva",
  "email": "joao.silva@example.com",
  "imagem_perfil": "https://example.com/avatar.jpg",
  "descricao": "Desenvolvedor Full Stack",
  "created_at": "2025-12-01T10:30:00Z"
}
```

### Respostas de Erro

#### 400 Bad Request - Email já cadastrado
```json
{
  "detail": "Email já cadastrado"
}
```

#### 400 Bad Request - Username já cadastrado
```json
{
  "detail": "Nome de usuário já cadastrado"
}
```

#### 422 Unprocessable Entity - Validação falhou
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "password"],
      "msg": "Value error, Senha deve ter no mínimo 8 caracteres.",
      "input": "123"
    }
  ]
}
```

---

## 2. Login

Autentica um usuário existente e cria uma sessão.

### Endpoint
```
POST /auth/login
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** Não requerida

### Corpo da Requisição (Body)

```json
{
  "email": "string",
  "password": "string"
}
```

### Exemplo de Requisição

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@example.com",
    "password": "SenhaForte123!"
  }'
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.post('http://localhost:8000/auth/login', {
  email: 'joao.silva@example.com',
  password: 'SenhaForte123!'
}, {
  withCredentials: true // IMPORTANTE: necessário para enviar/receber cookies
});

const data = response.data;
```

**⚠️ IMPORTANTE:** Use `withCredentials: true` para que o navegador envie e receba cookies HTTP-Only.

### Resposta de Sucesso (200 OK)

```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "email": "joao.silva@example.com"
  }
}
```

**Nota:** O token JWT é automaticamente armazenado em um cookie HTTP-Only chamado `access_token`. Este cookie:
- Não é acessível via JavaScript (segurança contra XSS)
- É enviado automaticamente em requisições subsequentes
- Tem tempo de expiração configurado

### Respostas de Erro

#### 401 Unauthorized - Credenciais inválidas
```json
{
  "detail": "Email ou senha incorretos"
}
```

---

## 3. Logout

Encerra a sessão do usuário autenticado.

### Endpoint
```
POST /auth/logout
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** Não requerida (mas remove o cookie se existir)

### Corpo da Requisição (Body)

Não requer corpo na requisição (body vazio).

### Exemplo de Requisição

```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Content-Type: application/json"
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.post('http://localhost:8000/auth/logout', {}, {
  withCredentials: true // IMPORTANTE: necessário para remover o cookie
});

const data = response.data;
```

### Resposta de Sucesso (200 OK)

```json
{
  "message": "Logout realizado com sucesso"
}
```

**Nota:** O cookie `access_token` é removido automaticamente pelo servidor.

---

## 4. Obter Usuário Atual

Retorna as informações do usuário autenticado.

### Endpoint
```
GET /auth/me
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

Não requer corpo na requisição (método GET).

### Exemplo de Requisição

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Content-Type: application/json" \
  --cookie "access_token=seu_token_jwt_aqui"
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.get('http://localhost:8000/auth/me', {
  withCredentials: true // IMPORTANTE: envia o cookie automaticamente
});

const data = response.data;
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "nome": "João Silva",
  "username": "joao_silva",
  "email": "joao.silva@example.com",
  "imagem_perfil": "https://example.com/avatar.jpg",
  "descricao": "Desenvolvedor Full Stack",
  "created_at": "2025-12-01T10:30:00Z"
}
```

### Respostas de Erro

#### 401 Unauthorized - Não autenticado
```json
{
  "detail": "Não autenticado"
}
```

#### 401 Unauthorized - Token inválido
```json
{
  "detail": "Token inválido"
}
```

#### 401 Unauthorized - Token expirado
```json
{
  "detail": "Token expirado"
}
```

---

## 5. Atualizar Informações do Usuário

Atualiza as informações do usuário autenticado (exceto senha e email).

### Endpoint
```
PATCH /auth/me
```

### Tipo de Requisição
- **Method:** `PATCH`
- **Content-Type:** `application/json`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

Todos os campos são opcionais. Envie apenas os campos que deseja atualizar.

```json
{
  "nome": "string",
  "username": "string",
  "imagem_perfil": "string",
  "descricao": "string"
}
```

### Validações

#### Campo `username` (opcional)
- Mínimo de 3 caracteres
- Apenas letras, números, `_` (underscore) ou `-` (hífen)
- Será normalizado para lowercase
- Deve ser único no sistema (não pode estar em uso por outro usuário)

#### Campos Opcionais
- `nome`: Nome completo do usuário
- `imagem_perfil`: URL ou caminho da imagem de perfil
- `descricao`: Descrição/bio do usuário

**⚠️ Nota:** Email **NÃO pode ser alterado**. Para alterar senha, use o endpoint `PATCH /auth/me/password`.

### Exemplo de Requisição

```bash
curl -X PATCH http://localhost:8000/auth/me \
  -H "Content-Type: application/json" \
  --cookie "access_token=seu_token_jwt_aqui" \
  -d '{
    "nome": "João Silva Santos",
    "username": "joao_santos",
    "descricao": "Desenvolvedor Full Stack | Python | React"
  }'
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.patch('http://localhost:8000/auth/me', {
  nome: 'João Silva Santos',
  username: 'joao_santos',
  descricao: 'Desenvolvedor Full Stack | Python | React'
}, {
  withCredentials: true // IMPORTANTE: envia o cookie automaticamente
});

const data = response.data;
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "nome": "João Silva Santos",
  "username": "joao_santos",
  "email": "joao.silva@example.com",
  "imagem_perfil": "https://example.com/avatar.jpg",
  "descricao": "Desenvolvedor Full Stack | Python | React",
  "created_at": "2025-12-01T10:30:00Z"
}
```

### Respostas de Erro

#### 400 Bad Request - Username já em uso
```json
{
  "detail": "Nome de usuário já está em uso"
}
```

#### 401 Unauthorized - Não autenticado
```json
{
  "detail": "Não autenticado"
}
```

#### 404 Not Found - Usuário não encontrado
```json
{
  "detail": "Usuário não encontrado"
}
```

#### 422 Unprocessable Entity - Validação falhou
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "username"],
      "msg": "Value error, Username deve ter no mínimo 3 caracteres.",
      "input": "ab"
    }
  ]
}
```

---

## 6. Atualizar Senha

Atualiza a senha do usuário autenticado. Requer a senha antiga para validação.

### Endpoint
```
PATCH /auth/me/password
```

### Tipo de Requisição
- **Method:** `PATCH`
- **Content-Type:** `application/json`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

```json
{
  "old_password": "string",
  "new_password": "string"
}
```

### Validações

#### Campo `old_password` (obrigatório)
- Deve ser a senha atual do usuário
- Validado antes de permitir alteração

#### Campo `new_password` (obrigatório)
- Mínimo de 8 caracteres
- Pelo menos 1 número
- Pelo menos 1 letra maiúscula
- Pelo menos 1 caractere especial: `!@#$%&*`

### Exemplo de Requisição

```bash
curl -X PATCH http://localhost:8000/auth/me/password \
  -H "Content-Type: application/json" \
  --cookie "access_token=seu_token_jwt_aqui" \
  -d '{
    "old_password": "SenhaForte123!",
    "new_password": "NovaSenhaForte456@"
  }'
```

### Exemplo JavaScript/TypeScript (Frontend)

```typescript
import axios from 'axios';

const response = await axios.patch('http://localhost:8000/auth/me/password', {
  old_password: 'SenhaForte123!',
  new_password: 'NovaSenhaForte456@'
}, {
  withCredentials: true // IMPORTANTE: envia o cookie automaticamente
});

const data = response.data;
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "nome": "João Silva",
  "username": "joao_silva",
  "email": "joao.silva@example.com",
  "imagem_perfil": "https://example.com/avatar.jpg",
  "descricao": "Desenvolvedor Full Stack",
  "created_at": "2025-12-01T10:30:00Z"
}
```

**⚠️ Importante:** Após alterar a senha com sucesso, o usuário **permanece autenticado** com o mesmo token JWT. Não é necessário fazer login novamente.

### Respostas de Erro

#### 401 Unauthorized - Senha antiga incorreta
```json
{
  "detail": "Senha antiga incorreta"
}
```

#### 401 Unauthorized - Não autenticado
```json
{
  "detail": "Não autenticado"
}
```

#### 404 Not Found - Usuário não encontrado
```json
{
  "detail": "Usuário não encontrado"
}
```

#### 422 Unprocessable Entity - Validação falhou
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "new_password"],
      "msg": "Value error, Senha deve ter no mínimo 8 caracteres.",
      "input": "123"
    }
  ]
}
```

---

## 7. Upload de Foto de Perfil

Faz upload da foto de perfil do usuário autenticado para o S3.

### Endpoint
```
POST /auth/upload-profile-picture
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Form Data)

- `file` (file): Arquivo de imagem (JPG, PNG ou WebP, máximo 5MB)

### Validações

- Apenas arquivos de imagem são permitidos (JPG, PNG, WebP)
- Tamanho máximo: 5MB por arquivo
- Arquivo não pode estar vazio

### Exemplo de Requisição

```typescript
const formData = new FormData();
formData.append('file', imageFile); // File object

const response = await axios.post('http://localhost:8000/auth/upload-profile-picture', formData, {
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "message": "Foto de perfil atualizada com sucesso",
  "image_url": "https://bucket.s3.amazonaws.com/profile-pictures/1/avatar.jpg"
}
```

**Nota:** A URL retornada é a URL pública da imagem no S3 que pode ser usada diretamente no frontend.

### Respostas de Erro

#### 400 Bad Request - Tipo de arquivo inválido
```json
{
  "detail": "Apenas arquivos de imagem são permitidos (JPG, PNG, WebP)"
}
```

#### 400 Bad Request - Arquivo muito grande
```json
{
  "detail": "Arquivo muito grande. Máximo: 5MB"
}
```

#### 401 Unauthorized - Não autenticado
```json
{
  "detail": "Não autenticado"
}
```

---

## 🔒 Autenticação via Cookie HTTP-Only

Este sistema utiliza cookies HTTP-Only para armazenar o token JWT de autenticação. Isso significa:

### Como Funciona

1. **Login:** Ao fazer login, o servidor define um cookie chamado `access_token`
2. **Requisições Autenticadas:** O navegador envia automaticamente este cookie em todas as requisições
3. **Logout:** O cookie é removido pelo servidor

### Configuração no Frontend

Para que o sistema de cookies funcione corretamente, **SEMPRE** use `withCredentials: true` nas requisições:

```typescript
import axios from 'axios';

axios.post(url, data, {
  withCredentials: true // ← OBRIGATÓRIO
});

// Ou configure globalmente:
axios.defaults.withCredentials = true;
```

### Configuração CORS

O backend deve estar configurado para aceitar cookies de origens específicas:

```python
# No backend (main.py)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL do frontend
    allow_credentials=True,  # IMPORTANTE
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 8. Criar Conversa

Cria uma nova conversa vazia para o usuário autenticado.

### Endpoint
```
POST /conversations
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

```json
{
  "title": "string"
}
```

### Exemplo de Requisição

```typescript
const response = await axios.post('http://localhost:8000/conversations', {
  title: 'Análise do Documento X'
}, {
  withCredentials: true
});
```

### Resposta de Sucesso (201 Created)

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Análise do Documento X",
  "qtd_tokens": 0,
  "created_at": "2025-12-02T10:30:00Z"
}
```

---

## 9. Listar Conversas

Lista todas as conversas do usuário autenticado, ordenadas por data de criação (mais recentes primeiro).

### Endpoint
```
GET /conversations
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de Query (Opcionais)

- `skip` (int): Quantidade de registros para pular - usado para paginação (padrão: 0)
- `limit` (int): Limite de registros a retornar - máximo 100 (padrão: 100)

### Exemplo de Requisição

```typescript
// Sem paginação
const response = await axios.get('http://localhost:8000/conversations', {
  withCredentials: true
});

// Com paginação
const response = await axios.get('http://localhost:8000/conversations?skip=10&limit=20', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
[
  {
    "id": 2,
    "user_id": 1,
    "title": "Documento Recente",
    "qtd_tokens": 1500,
    "created_at": "2025-12-02T15:00:00Z"
  },
  {
    "id": 1,
    "user_id": 1,
    "title": "Análise do Documento X",
    "qtd_tokens": 2400,
    "created_at": "2025-12-02T10:30:00Z"
  }
]
```

---

## 10. Obter Conversa com Mensagens

Obtém uma conversa específica com todas as suas mensagens.

### Endpoint
```
GET /conversations/{conversation_id}
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `conversation_id` (int): ID da conversa

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/conversations/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Análise do Documento X",
  "qtd_tokens": 2400,
  "created_at": "2025-12-02T10:30:00Z",
  "messages": [
    {
      "id": 1,
      "conversation_id": 1,
      "role": "user",
      "content": "Qual é o tema principal do documento?",
      "created_at": "2025-12-02T10:31:00Z"
    },
    {
      "id": 2,
      "conversation_id": 1,
      "role": "assistant",
      "content": "O documento aborda principalmente...",
      "created_at": "2025-12-02T10:31:05Z"
    }
  ]
}
```

### Respostas de Erro

#### 404 Not Found
```json
{
  "detail": "Conversa não encontrada ou você não tem permissão para acessá-la"
}
```

---

## 11. Deletar Conversa

Deleta uma conversa e todas as suas mensagens e documentos associados.

### Endpoint
```
DELETE /conversations/{conversation_id}
```

### Tipo de Requisição
- **Method:** `DELETE`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `conversation_id` (int): ID da conversa

### Exemplo de Requisição

```typescript
await axios.delete('http://localhost:8000/conversations/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (204 No Content)

Sem corpo de resposta.

---

## 12. Enviar Mensagem

Envia uma mensagem do usuário e recebe a resposta do assistente de IA.

### Endpoint
```
POST /chat
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

```json
{
  "conversation_id": 1,
  "message": "string",
  "use_rag": false,
  "is_summary": false,
  "document_ids": [1, 2, 3]
}
```

### Validações e Campos

#### Campo `conversation_id` (obrigatório)
- ID da conversa onde a mensagem será enviada
- Deve pertencer ao usuário autenticado

#### Campo `message` (obrigatório)
- Mensagem do usuário em texto

#### Campo `use_rag` (opcional, padrão: false)
- Se `true`, utiliza RAG (Retrieval-Augmented Generation) para buscar contexto nos documentos
- Requer que `document_ids` seja fornecido quando `true`

#### Campo `is_summary` (opcional, padrão: false)
- Se `true`, indica que a mensagem é uma solicitação de resumo
- Usado internamente para controle de tipo de mensagem

#### Campo `document_ids` (opcional)
- Lista de IDs dos documentos a serem usados como contexto no RAG
- Necessário quando `use_rag` é `true
```

### Exemplos de Requisição

```typescript
// Mensagem simples sem RAG
const response = await axios.post('http://localhost:8000/chat', {
  conversation_id: 1,
  message: 'Olá, como você pode me ajudar?',
  use_rag: false
}, {
  withCredentials: true
});

// Mensagem com RAG ativado
const response = await axios.post('http://localhost:8000/chat', {
  conversation_id: 1,
  message: 'Qual é o tema principal do documento?',
  use_rag: true,
  document_ids: [1, 2]
}, {
  withCredentials: true
});

// Solicitação de resumo
const response = await axios.post('http://localhost:8000/chat', {
  conversation_id: 1,
  message: 'Gere um resumo dos documentos',
  use_rag: true,
  is_summary: true,
  document_ids: [1, 2, 3]
}, {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "user_message": {
    "id": 1,
    "conversation_id": 1,
    "role": "user",
    "content": "Qual é o tema principal do documento?",
    "created_at": "2025-12-02T10:31:00Z"
  },
  "assistant_message": {
    "id": 2,
    "conversation_id": 1,
    "role": "assistant",
    "content": "O documento aborda principalmente...",
    "created_at": "2025-12-02T10:31:05Z"
  }
}
```

### Respostas de Erro

#### 404 Not Found
```json
{
  "detail": "Conversa não encontrada ou você não tem permissão para acessá-la"
}
```

#### 429 Too Many Requests
```json
{
  "detail": "Limite de tokens atingido para esta conversa. Tokens usados: 8192/8192. Crie uma nova conversa para continuar."
}
```

---

## 13. Gerar Resumo

Gera um resumo automático para um conjunto de documentos selecionados.

### Endpoint
```
POST /summaries
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Body)

```json
{
  "title": "string",
  "content": "string",
  "conversation_id": 1,
  "document_ids": [1, 2]
}
```

### Exemplo de Requisição

```typescript
const response = await axios.post('http://localhost:8000/summaries', {
  title: 'Resumo Executivo',
  content: 'O documento trata de...',
  conversation_id: 1,
  document_ids: [1, 2]
}, {
  withCredentials: true
});
```

### Resposta de Sucesso (201 Created)

```json
{
  "id": 1,
  "title": "Resumo Executivo",
  "content": "O documento trata de...",
  "conversation_id": 1,
  "created_at": "2025-12-02T10:30:00Z",
  "document_ids": [1, 2]
}
```

---

## 14. Listar Resumos da Conversa

Lista todos os resumos associados a uma conversa.

### Endpoint
```
GET /summaries/conversation/{conversation_id}
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `conversation_id` (int): ID da conversa

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/summaries/conversation/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
[
  {
    "id": 1,
    "title": "Resumo Executivo",
    "content": "O documento trata de...",
    "conversation_id": 1,
    "created_at": "2025-12-02T10:30:00Z",
    "document_ids": [1, 2]
  }
]
```

---

## 15. Obter Resumo

Obtém os detalhes de um resumo específico.

### Endpoint
```
GET /summaries/{summary_id}
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `summary_id` (int): ID do resumo

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/summaries/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "title": "Resumo Executivo",
  "content": "O documento trata de...",
  "conversation_id": 1,
  "created_at": "2025-12-02T10:30:00Z",
  "document_ids": [1, 2],
  "documents": [
    {
      "id": 1,
      "filename": "relatorio.pdf"
    },
    {
      "id": 2,
      "filename": "anexo.pdf"
    }
  ]
}
```

---

## 16. Deletar Resumo

Remove um resumo existente.

### Endpoint
```
DELETE /summaries/{summary_id}
```

### Tipo de Requisição
- **Method:** `DELETE`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `summary_id` (int): ID do resumo

### Exemplo de Requisição

```typescript
await axios.delete('http://localhost:8000/summaries/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (204 No Content)

Sem corpo de resposta.

---

## 17. Upload de Documento

Faz upload de um documento PDF para uma conversa existente.

### Endpoint
```
POST /documents/upload
```

### Tipo de Requisição
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Corpo da Requisição (Form Data)

- `conversation_id` (int): ID da conversa
- `file` (file): Arquivo PDF (máximo 50MB)

### Validações

- Apenas arquivos PDF são permitidos
- Tamanho máximo: 50MB por arquivo
- Arquivo não pode estar vazio

### Exemplo de Requisição

```typescript
const formData = new FormData();
formData.append('conversation_id', '1');
formData.append('file', pdfFile); // File object

const response = await axios.post('http://localhost:8000/documents/upload', formData, {
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### Resposta de Sucesso (201 Created)

```json
{
  "id": 1,
  "conversation_id": 1,
  "filename": "documento.pdf",
  "file_size": 2048576,
  "status": "pending",
  "created_at": "2025-12-02T10:30:00Z",
  "message": "Upload realizado com sucesso. Indexação iniciada em background."
}
```

### Status do Documento

- `pending`: Upload realizado, aguardando indexação
- `processing`: Documento sendo processado/indexado
- `indexed`: Documento indexado e pronto para uso
- `failed`: Erro no processamento

### Respostas de Erro

#### 400 Bad Request - Tipo inválido
```json
{
  "detail": "Apenas arquivos PDF são permitidos"
}
```

#### 400 Bad Request - Arquivo muito grande
```json
{
  "detail": "Arquivo muito grande. Máximo: 50MB"
}
```

#### 404 Not Found
```json
{
  "detail": "Conversa não encontrada ou você não tem permissão"
}
```

---

## 18. Listar Documentos da Conversa

Lista todos os documentos de uma conversa específica.

### Endpoint
```
GET /documents/conversation/{conversation_id}
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `conversation_id` (int): ID da conversa

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/documents/conversation/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "documents": [
    {
      "id": 1,
      "user_id": 1,
      "conversation_id": 1,
      "filename": "documento.pdf",
      "s3_key": "uploads/1/1.pdf",
      "file_size": 2048576,
      "status": "indexed",
      "faiss_index_s3_key": "indices/1/1/index.faiss",
      "metadata_s3_key": "metadata/1/1/metadata.pkl",
      "created_at": "2025-12-02T10:30:00Z",
      "updated_at": "2025-12-02T10:31:00Z"
    }
  ],
  "total": 1
}
```

---

## 19. Obter Documento

Obtém informações de um documento específico.

### Endpoint
```
GET /documents/{document_id}
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `document_id` (int): ID do documento

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/documents/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "filename": "documento.pdf",
  "s3_key": "uploads/1/1.pdf",
  "file_size": 2048576,
  "status": "indexed",
  "faiss_index_s3_key": "indices/1/1/index.faiss",
  "metadata_s3_key": "metadata/1/1/metadata.pkl",
  "created_at": "2025-12-02T10:30:00Z",
  "updated_at": "2025-12-02T10:31:00Z"
}
```

---

## 20. Gerar URL de Download

Gera uma URL pré-assinada para download direto do documento do S3.

### Endpoint
```
GET /documents/{document_id}/download
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `document_id` (int): ID do documento

### Exemplo de Requisição

```typescript
const response = await axios.get('http://localhost:8000/documents/1/download', {
  withCredentials: true
});

// Usar a URL retornada para download
window.open(response.data.download_url, '_blank');
```

### Resposta de Sucesso (200 OK)

```json
{
  "download_url": "https://bucket.s3.amazonaws.com/uploads/1/1.pdf?X-Amz-Signature=...",
  "expires_in": 3600,
  "message": "URL válida por 1 hora"
}
```

**Nota:** A URL é válida por 1 hora e permite download direto do S3 sem autenticação adicional.

---

## 21. Deletar Documento

Deleta um documento e todos os arquivos relacionados do S3 (PDF, índice FAISS, metadados).

### Endpoint
```
DELETE /documents/{document_id}
```

### Tipo de Requisição
- **Method:** `DELETE`
- **Autenticação:** **Requerida** (cookie HTTP-Only)

### Parâmetros de URL
- `document_id` (int): ID do documento

### Exemplo de Requisição

```typescript
await axios.delete('http://localhost:8000/documents/1', {
  withCredentials: true
});
```

### Resposta de Sucesso (204 No Content)

Sem corpo de resposta.

---

## 📝 Tipos TypeScript (Referência)

Para usar no frontend, você pode definir os seguintes tipos:

```typescript
// Registro
interface RegisterRequest {
  nome: string;
  username: string;
  email: string;
  password: string;
  imagem_perfil?: string;
  descricao?: string;
}

interface UserResponse {
  id: number;
  nome: string;
  username: string;
  email: string;
  imagem_perfil: string | null;
  descricao: string | null;
  created_at: string;
}

// Login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
}

// Logout
interface LogoutResponse {
  message: string;
}

// Atualização de Usuário
interface UserUpdate {
  nome?: string;
  username?: string;
  imagem_perfil?: string;
  descricao?: string;
}

// Atualização de Senha
interface UserPasswordUpdate {
  old_password: string;
  new_password: string;
}

// Erros
interface ErrorDetail {
  type: string;
  loc: string[];
  msg: string;
  input: any;
}

interface ErrorResponse {
  detail: string | ErrorDetail[];
}
```

---

## 🚀 Exemplo Completo de Fluxo de Autenticação

```typescript
import axios from 'axios';

// Configurar axios globalmente (opcional)
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

// 1. Registrar usuário
async function register() {
  try {
    const response = await axios.post('/auth/register', {
      nome: 'João Silva',
      username: 'joao_silva',
      email: 'joao.silva@example.com',
      password: 'SenhaForte123!'
    });
    
    const user = response.data;
    console.log('Usuário criado:', user);
  } catch (error) {
    console.error('Erro no registro:', error.response?.data?.detail);
  }
}

// 2. Fazer login
async function login() {
  try {
    const response = await axios.post('/auth/login', {
      email: 'joao.silva@example.com',
      password: 'SenhaForte123!'
    });
    
    const data = response.data;
    console.log('Login bem-sucedido:', data);
  } catch (error) {
    console.error('Erro no login:', error.response?.data?.detail);
  }
}

// 3. Obter dados do usuário autenticado
async function getCurrentUser() {
  try {
    const response = await axios.get('/auth/me');
    
    const user = response.data;
    console.log('Usuário atual:', user);
  } catch (error) {
    console.error('Não autenticado');
  }
}

// 4. Fazer logout
async function logout() {
  try {
    const response = await axios.post('/auth/logout');
    
    const data = response.data;
    console.log('Logout:', data.message);
  } catch (error) {
    console.error('Erro ao fazer logout:', error.response?.data?.detail);
  }
}

// 5. Atualizar informações do usuário
async function updateUser() {
  try {
    const response = await axios.patch('/auth/me', {
      nome: 'João Silva Santos',
      username: 'joao_santos',
      descricao: 'Desenvolvedor Full Stack | Python | React'
    });
    
    const user = response.data;
    console.log('Usuário atualizado:', user);
  } catch (error) {
    console.error('Erro ao atualizar:', error.response?.data?.detail);
  }
}

// 6. Atualizar senha do usuário
async function updatePassword() {
  try {
    const response = await axios.patch('/auth/me/password', {
      old_password: 'SenhaForte123!',
      new_password: 'NovaSenhaForte456@'
    });
    
    const user = response.data;
    console.log('Senha atualizada com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar senha:', error.response?.data?.detail);
  }
}
```

---

## 📌 Checklist para Integração Frontend

- [ ] Instalar axios: `npm install axios`
- [ ] Configurar `withCredentials: true` em todas as requisições (ou globalmente)
- [ ] Configurar CORS no backend com `allow_credentials=True`
- [ ] Tratar erros 401 (redirecionar para login)
- [ ] Validar campos antes de enviar (feedback ao usuário)
- [ ] Implementar feedback visual (loading, success, error)
- [ ] Testar fluxo completo: registro → login → acesso a rota protegida → logout

---

## 22. Health Check Básico

Verifica se a API está funcionando corretamente.

### Endpoint
```
GET /health
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** Não requerida

### Exemplo de Requisição

```bash
curl -X GET http://localhost:8000/health
```

```typescript
const response = await axios.get('http://localhost:8000/health');
```

### Resposta de Sucesso (200 OK)

```json
{
  "status": "ok",
  "message": "API está funcionando"
}
```

---

## 23. Diagnóstico S3

Realiza diagnóstico completo da conexão e permissões do S3.

### Endpoint
```
GET /health/s3
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** Não requerida

### Exemplo de Requisição

```bash
curl -X GET http://localhost:8000/health/s3
```

```typescript
const response = await axios.get('http://localhost:8000/health/s3');
```

### Testes Realizados

1. Verificação de credenciais AWS configuradas
2. Existência do bucket S3
3. Permissão de listagem (s3:ListBucket)
4. Permissão de upload (s3:PutObject)

### Resposta de Sucesso (200 OK)

```json
{
  "status": "ok",
  "message": "S3 configurado corretamente",
  "credentials_configured": true,
  "bucket_name": "rag-chatbot-bucket",
  "region": "us-east-1",
  "bucket_exists": true,
  "has_list_permission": true,
  "has_put_permission": true,
  "errors": []
}
```

### Resposta com Problemas (200 OK)

```json
{
  "status": "error",
  "message": "Problemas com configuração S3",
  "credentials_configured": false,
  "bucket_name": "rag-chatbot-bucket",
  "region": "us-east-1",
  "bucket_exists": false,
  "has_list_permission": false,
  "has_put_permission": false,
  "errors": [
    "Credenciais AWS não configuradas no .env"
  ]
}
```

### Possíveis Status

- `ok`: Tudo funcionando perfeitamente
- `partial`: Bucket existe mas faltam algumas permissões
- `error`: Problemas críticos de configuração

---

## 24. Verificação de Banco de Dados

Verifica a conexão com o banco de dados.

### Endpoint
```
GET /health/db
```

### Tipo de Requisição
- **Method:** `GET`
- **Autenticação:** Não requerida

### Exemplo de Requisição

```bash
curl -X GET http://localhost:8000/health/db
```

```typescript
const response = await axios.get('http://localhost:8000/health/db');
```

### Resposta de Sucesso (200 OK)

```json
{
  "status": "ok",
  "message": "Banco de dados conectado",
  "database_url": "sqlite:///./data/chat.db"
}
```

### Resposta com Erro (200 OK)

```json
{
  "status": "error",
  "message": "Erro ao conectar no banco: [detalhes do erro]"
}
```

---

## ⚠️ Observações Importantes

1. **Senhas nunca são retornadas** nas respostas da API
2. **Emails e usernames são normalizados** para lowercase automaticamente
3. **Cookies HTTP-Only** não são acessíveis via JavaScript (segurança)
4. **CORS deve estar configurado** corretamente para permitir cookies
5. **Token JWT tem tempo de expiração** configurado no backend
6. **Todas as datas** são retornadas no formato ISO 8601 (UTC)

---

*Última atualização: 8 de dezembro de 2025*
