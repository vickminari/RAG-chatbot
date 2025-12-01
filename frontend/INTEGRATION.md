# 🔐 Integração Frontend ↔️ Backend - Autenticação JWT

## ✅ O que foi implementado

### 1. **Estrutura de Arquivos Criada**

```
src/
├── config/
│   └── api.ts                    # Configurações de API e endpoints
├── types/
│   └── api.ts                    # TypeScript interfaces
├── services/
│   └── api.service.ts            # Serviço centralizado de API
└── hooks/
    ├── useLogin.ts               # Hook para login
    ├── useRegister.ts            # Hook para registro
    ├── useLogout.ts              # Hook para logout
    └── useCurrentUser.ts         # Hook para buscar usuário atual
```

### 2. **API Service (`services/api.service.ts`)**

Serviço centralizado com:
- ✅ `credentials: 'include'` - Envia cookies HttpOnly automaticamente
- ✅ Tratamento de erros unificado
- ✅ TypeScript types
- ✅ Métodos: `register()`, `login()`, `logout()`, `getCurrentUser()`

### 3. **Custom Hooks**

#### `useLogin()`
```typescript
const { login, loading, error } = useLogin();
await login({ email, password });
```

#### `useRegister()`
```typescript
const { register, loading, error } = useRegister();
await register({ email, password });
```

#### `useLogout()`
```typescript
const { logout, loading, error } = useLogout();
await logout();
```

#### `useCurrentUser()`
```typescript
const { user, loading, error, refetch } = useCurrentUser();
```

### 4. **AuthContext Atualizado**

- ✅ Usa API real ao invés de mock
- ✅ Verifica autenticação ao carregar (`useEffect`)
- ✅ Estado de `loading` para evitar flicker
- ✅ Logout limpa cookies no backend

### 5. **Páginas Atualizadas**

#### **LoginPage**
- ✅ Usa hook `useAuth()` para chamar API
- ✅ Mostra erros específicos do backend
- ✅ Redireciona para home após login

#### **RegisterPage**
- ✅ Usa hook `useRegister()` para criar conta
- ✅ Faz login automático após registro
- ✅ Valida senhas (backend valida complexidade)

### 6. **ProtectedRoute**

- ✅ Mostra loading enquanto verifica autenticação
- ✅ Redireciona para login se não autenticado
- ✅ Evita flash de conteúdo não autorizado

### 7. **Configuração**

**`.env` e `.env.example`**
```bash
VITE_API_URL=http://localhost:8000
```

## 🔒 Fluxo de Autenticação

### Registro
1. Usuário preenche email e senha
2. Frontend chama `POST /auth/register`
3. Backend valida senha (8+ chars, número, maiúscula, especial)
4. Backend cria usuário no banco
5. Frontend faz login automático
6. Backend retorna cookie HttpOnly com JWT
7. Usuário é redirecionado para home

### Login
1. Usuário preenche email e senha
2. Frontend chama `POST /auth/login`
3. Backend valida credenciais
4. Backend retorna cookie HttpOnly com JWT
5. Frontend busca dados do usuário (`GET /auth/me`)
6. Context atualiza estado
7. Usuário é redirecionado para home

### Verificação de Autenticação
1. App carrega
2. AuthContext chama `GET /auth/me` automaticamente
3. Se cookie válido: usuário autenticado
4. Se erro: usuário deslogado
5. ProtectedRoute redireciona se necessário

### Logout
1. Usuário clica em "Sair"
2. Frontend chama `POST /auth/logout`
3. Backend remove cookie HttpOnly
4. Context limpa estado
5. Usuário é redirecionado para login

## 🚀 Como Testar

### 1. Iniciar Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```

### 3. Testar Fluxo
1. Acesse http://localhost:5173
2. Será redirecionado para `/login` (não autenticado)
3. Clique em "Criar conta"
4. Registre com:
   - Email: `teste@exemplo.com`
   - Senha: `Senha123!` (ou qualquer senha válida)
5. Será logado e redirecionado para home
6. Cookie JWT é definido automaticamente
7. Recarregue a página - permanece logado (cookie persistente)
8. Clique em "Sair" - cookie é removido

## 🔧 Backend Requirements

### Validação de Senha no Backend:
- ✅ Mínimo 8 caracteres
- ✅ 1 número
- ✅ 1 letra maiúscula  
- ✅ 1 caractere especial (!@#$%&*)

### CORS Configurado:
```python
allow_origins=["http://localhost:5173"]
allow_credentials=True  # ⚠️ ESSENCIAL para cookies
```

## 📝 Próximos Passos

Para integrar o chat:
1. Criar rotas de conversação no backend
2. Criar hooks `useConversations()`, `useSendMessage()`
3. Atualizar `ChatContext` para usar API real
4. Integrar com Google Gemini/LangChain no backend

## 🎯 Benefícios

- ✅ **Segurança**: JWT em cookies HttpOnly (não acessível via JavaScript)
- ✅ **Separação de Concerns**: Hooks isolam lógica de API
- ✅ **Type Safety**: TypeScript em toda a aplicação
- ✅ **Reutilização**: Hooks podem ser usados em qualquer componente
- ✅ **Melhor UX**: Loading states e error handling consistentes
