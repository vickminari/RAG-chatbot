# API de Autenticação - Documentação

Este documento descreve os endpoints de autenticação da API, incluindo os formatos de requisição e resposta.

---

## 📋 Sumário

1. [Registro de Usuário](#1-registro-de-usuário)
2. [Login](#2-login)
3. [Logout](#3-logout)
4. [Obter Usuário Atual](#4-obter-usuário-atual)

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
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'João Silva',
    username: 'joao_silva',
    email: 'joao.silva@example.com',
    password: 'SenhaForte123!',
    imagem_perfil: 'https://example.com/avatar.jpg',
    descricao: 'Desenvolvedor Full Stack'
  })
});

const data = await response.json();
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
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // IMPORTANTE: necessário para enviar/receber cookies
  body: JSON.stringify({
    email: 'joao.silva@example.com',
    password: 'SenhaForte123!'
  })
});

const data = await response.json();
```

**⚠️ IMPORTANTE:** Use `credentials: 'include'` para que o navegador envie e receba cookies HTTP-Only.

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
const response = await fetch('http://localhost:8000/auth/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' // IMPORTANTE: necessário para remover o cookie
});

const data = await response.json();
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
const response = await fetch('http://localhost:8000/auth/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' // IMPORTANTE: envia o cookie automaticamente
});

const data = await response.json();
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

## 🔒 Autenticação via Cookie HTTP-Only

Este sistema utiliza cookies HTTP-Only para armazenar o token JWT de autenticação. Isso significa:

### Como Funciona

1. **Login:** Ao fazer login, o servidor define um cookie chamado `access_token`
2. **Requisições Autenticadas:** O navegador envia automaticamente este cookie em todas as requisições
3. **Logout:** O cookie é removido pelo servidor

### Configuração no Frontend

Para que o sistema de cookies funcione corretamente, **SEMPRE** use `credentials: 'include'` nas requisições:

```typescript
fetch(url, {
  method: 'POST',
  credentials: 'include', // ← OBRIGATÓRIO
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
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
// 1. Registrar usuário
async function register() {
  const response = await fetch('http://localhost:8000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'João Silva',
      username: 'joao_silva',
      email: 'joao.silva@example.com',
      password: 'SenhaForte123!'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Erro no registro:', error.detail);
    return;
  }
  
  const user = await response.json();
  console.log('Usuário criado:', user);
}

// 2. Fazer login
async function login() {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // IMPORTANTE
    body: JSON.stringify({
      email: 'joao.silva@example.com',
      password: 'SenhaForte123!'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Erro no login:', error.detail);
    return;
  }
  
  const data = await response.json();
  console.log('Login bem-sucedido:', data);
}

// 3. Obter dados do usuário autenticado
async function getCurrentUser() {
  const response = await fetch('http://localhost:8000/auth/me', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // IMPORTANTE
  });
  
  if (!response.ok) {
    console.error('Não autenticado');
    return;
  }
  
  const user = await response.json();
  console.log('Usuário atual:', user);
}

// 4. Fazer logout
async function logout() {
  const response = await fetch('http://localhost:8000/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // IMPORTANTE
  });
  
  const data = await response.json();
  console.log('Logout:', data.message);
}
```

---

## 📌 Checklist para Integração Frontend

- [ ] Configurar `credentials: 'include'` em todas as requisições
- [ ] Configurar CORS no backend com `allow_credentials=True`
- [ ] Tratar erros 401 (redirecionar para login)
- [ ] Validar campos antes de enviar (feedback ao usuário)
- [ ] Implementar feedback visual (loading, success, error)
- [ ] Testar fluxo completo: registro → login → acesso a rota protegida → logout

---

## ⚠️ Observações Importantes

1. **Senhas nunca são retornadas** nas respostas da API
2. **Emails e usernames são normalizados** para lowercase automaticamente
3. **Cookies HTTP-Only** não são acessíveis via JavaScript (segurança)
4. **CORS deve estar configurado** corretamente para permitir cookies
5. **Token JWT tem tempo de expiração** configurado no backend
6. **Todas as datas** são retornadas no formato ISO 8601 (UTC)

---

*Última atualização: 1 de dezembro de 2025*
