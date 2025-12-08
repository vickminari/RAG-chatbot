# GenAI Chatbot - Frontend

Interface moderna e responsiva para chatbot com IA generativa, construída com React e TypeScript.

## 🚀 Stack Tecnológico

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router v7** - Roteamento client-side
- **TailwindCSS** - Estilização utility-first
- **React Markdown** - Renderização de markdown

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

Configure o arquivo `.env`:
```env
VITE_API_URL=http://localhost:8000
```

## 🏃 Comandos

```bash
# Desenvolvimento (hot-reload)
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
├── contexts/        # Context API (Auth, Chat, Theme)
├── hooks/           # Custom hooks
├── layouts/         # Layouts de página
├── pages/           # Páginas/rotas
├── services/        # Camada de API
├── types/           # Definições TypeScript
└── utils/           # Funções auxiliares
```

### Principais Features

- **Autenticação JWT** via HttpOnly cookies
- **Gerenciamento de Estado** com Context API
- **Streaming de Respostas** com animação word-by-word
- **Dark/Light Mode** persistido
- **Rotas Protegidas** com redirects automáticos
- **Renderização Markdown** para respostas da IA
- **Limite de 2000 caracteres** com contador visual

### Fluxo de Autenticação

1. Login via `POST /api/auth/login`
2. Token JWT armazenado em HttpOnly cookie
3. Requests automáticos com `credentials: 'include'`
4. Verificação via `GET /api/auth/me`

### Gerenciamento de Conversas

- **Auto-criação**: Primeira mensagem cria conversa automaticamente
- **Título automático**: 15 primeiros caracteres da mensagem
- **Histórico persistido**: Carregado sob demanda
- **Delete em cascata**: Remove conversa e mensagens

## 🔐 Segurança

- Tokens JWT em HttpOnly cookies (proteção XSS)
- CORS configurado para credenciais
- Rotas protegidas com guards
- Validação de entrada no frontend

## 🎨 Temas

O sistema de temas usa Context API e persiste a preferência no `localStorage`:

```tsx
const { isDark, toggleTheme } = useTheme();
```

## 📦 Deploy

### Build de Produção

```bash
npm run build
```

Gera arquivos otimizados em `dist/`.

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload para S3
aws s3 sync dist/ s3://seu-bucket --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation --distribution-id SEU_ID --paths "/*"
```

## 🧪 Desenvolvimento

### Convenções

- **Componentes**: PascalCase, um por arquivo
- **Hooks**: prefixo `use` (ex: `useAuth`)
- **Types**: interfaces em `types/api.ts`
- **Contexts**: sufixo `Context` (ex: `AuthContext`)

### Estado Global

Três contextos principais:
- `AuthContext` - Usuário e autenticação
- `ChatContext` - Conversas e mensagens
- `ThemeContext` - Modo escuro/claro

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
