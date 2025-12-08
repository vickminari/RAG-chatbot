#!/bin/bash
# Script de deploy automatizado para EC2 Ubuntu
# USO: ./deploy-ec2.sh [branch]
# Exemplo: ./deploy-ec2.sh main  (ou ./deploy-ec2.sh victor)

set -e

echo "🚀 Iniciando deploy do RAG Chatbot na EC2..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/home/ubuntu/RAG-chatbot"

# Branch padrão
BRANCH="${1:-main}"

echo -e "${YELLOW}📋 Configuração:${NC}"
echo "   Branch: $BRANCH"
echo "   Diretório: $PROJECT_DIR"
echo ""

# Verificar se diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório $PROJECT_DIR não encontrado!${NC}"
    exit 1
fi

# FASE 1: Atualizar código
echo -e "${YELLOW}📥 Fase 1: Atualizando código do repositório...${NC}"
cd $PROJECT_DIR

# Verificar mudanças locais
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Há mudanças locais. Salvando em stash...${NC}"
    git stash
fi

git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

echo -e "${GREEN}✓ Código atualizado${NC}"

# FASE 2: Rebuild do backend
echo -e "${YELLOW}🐳 Fase 2: Rebuilding backend Docker...${NC}"
sudo docker stop genai-chatbot-backend 2>/dev/null || true
sudo docker rm genai-chatbot-backend 2>/dev/null || true
sudo docker build -f backend/Dockerfile.prod -t genai-chatbot-backend:latest ./backend

echo -e "${GREEN}✓ Backend build concluído${NC}"

# FASE 3: Rodar backend
echo -e "${YELLOW}▶️  Fase 3: Iniciando backend...${NC}"
sudo docker run -d \
  --name genai-chatbot-backend \
  -p 8000:8000 \
  --env-file ./backend/.env \
  -v $PROJECT_DIR/backend/data:/app/data \
  --restart unless-stopped \
  genai-chatbot-backend:latest

# Aguardar backend ficar pronto
echo "⏳ Aguardando backend iniciar..."
sleep 10

echo -e "${GREEN}✓ Backend iniciado${NC}"

# FASE 4: Build do frontend
echo -e "${YELLOW}⚛️  Fase 4: Building frontend...${NC}"
cd $PROJECT_DIR/frontend

# Limpar node_modules antigo se necessário (apenas se package.json mudou)
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    echo "📦 package.json mudou, reinstalando dependências..."
    rm -rf node_modules
fi

npm install
npm run build

echo -e "${GREEN}✓ Frontend build concluído${NC}"

# FASE 5: Deploy do frontend no nginx
echo -e "${YELLOW}📦 Fase 5: Deploying frontend...${NC}"
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r $PROJECT_DIR/frontend/dist/* /usr/share/nginx/html/
sudo chown -R www-data:www-data /usr/share/nginx/html
sudo chmod -R 755 /usr/share/nginx/html

echo -e "${GREEN}✓ Frontend deployado${NC}"

# FASE 6: Restart nginx
echo -e "${YELLOW}🔄 Fase 6: Reiniciando nginx...${NC}"
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✓ Nginx reiniciado${NC}"

# FASE 7: Verificações
echo ""
echo -e "${YELLOW}✅ Fase 7: Verificando serviços...${NC}"
echo ""

echo "🐳 Docker Backend:"
sudo docker ps | grep genai-chatbot-backend || echo -e "${RED}❌ Backend não está rodando${NC}"

echo ""
echo "🌐 Nginx:"
sudo systemctl is-active nginx >/dev/null 2>&1 && echo -e "${GREEN}✓ Nginx ativo${NC}" || echo -e "${RED}❌ Nginx inativo${NC}"

echo ""
echo "🔍 Backend Health Check:"
sleep 2
HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null || echo "ERRO")
if [[ $HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Backend respondendo: $HEALTH${NC}"
else
    echo -e "${RED}❌ Backend não respondeu${NC}"
    echo "Verificando logs do Docker:"
    sudo docker logs --tail 20 genai-chatbot-backend
fi

echo ""
echo "🔍 Nginx Health Check:"
NGINX_HEALTH=$(curl -s http://localhost/health 2>/dev/null || echo "ERRO")
if [[ $NGINX_HEALTH == "healthy" ]]; then
    echo -e "${GREEN}✓ Nginx respondendo${NC}"
else
    echo -e "${RED}❌ Nginx não respondeu${NC}"
fi

# IP Público
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "======================================"
echo -e "${GREEN}✨ Deploy concluído com sucesso!${NC}"
echo "======================================"
echo -e "${GREEN}🌐 Acesse: http://$PUBLIC_IP${NC}"
echo ""
echo "📊 Informações:"
echo "   Branch: $BRANCH"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs backend: sudo docker logs -f genai-chatbot-backend"
echo "   Ver logs nginx: sudo tail -f /var/log/nginx/error.log"
echo "   Reiniciar: cd $PROJECT_DIR && ./deploy-ec2.sh"
echo "======================================"
