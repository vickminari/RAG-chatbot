# Frontend Dockerfile para desenvolvimento
FROM node:20-alpine

WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta do Vite
EXPOSE 5173

# Comando para rodar em modo dev com hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
