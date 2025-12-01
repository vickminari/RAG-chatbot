# 🚀 Deploy para EC2 t3.micro - Guia Rápido

## 📦 Pré-requisitos locais

```bash
# 1. Build do frontend (na sua máquina local)
cd frontend
npm run build
# Gera pasta: frontend/dist/

# 2. Verificar arquivos
ls dist/
# Deve ter: index.html, assets/, vite.svg
```

## 🌐 Deploy no EC2

### Passo 1: Transferir arquivos
```bash
# Da sua máquina local (diretório raiz do projeto)
scp -i sua-chave.pem -r backend/ ubuntu@<ELASTIC_IP>:~/
scp -i sua-chave.pem -r frontend/dist/ ubuntu@<ELASTIC_IP>:~/frontend/
scp -i sua-chave.pem -r nginx/ ubuntu@<ELASTIC_IP>:~/
scp -i sua-chave.pem docker-compose.prod.yml ubuntu@<ELASTIC_IP>:~/docker-compose.yml
```

### Passo 2: Conectar no EC2 e rodar
```bash
ssh -i sua-chave.pem ubuntu@<ELASTIC_IP>

# Verificar estrutura
ls -la
# Deve ter: backend/, frontend/dist/, nginx/, docker-compose.yml

# Criar .env do backend (se não transferiu)
cd backend
nano .env
# Colar variáveis AWS + GOOGLE_API_KEY + INDEXER_SECRET_KEY

# Voltar para raiz e rodar
cd ..
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Passo 3: Acessar
```
http://<ELASTIC_IP>
```

## 🔄 Atualizar frontend (após mudanças)

```bash
# LOCAL: Build novo
cd frontend
npm run build

# Transferir só o dist
scp -i sua-chave.pem -r dist/* ubuntu@<ELASTIC_IP>:~/frontend/dist/

# EC2: Restart nginx (instantâneo)
ssh -i sua-chave.pem ubuntu@<ELASTIC_IP>
docker-compose restart nginx
```

## 📊 Monitoramento de recursos

```bash
# Ver uso de RAM/CPU
docker stats

# Ver uso do sistema
htop
free -h
```

## ⚠️ Importante

**URL da API no frontend:**
```env
# frontend/.env (para build)
VITE_API_URL=/api
```
Nginx faz proxy de `/api/*` → `http://backend:8000/*`

## 🎯 Vantagens dessa abordagem

✅ RAM: ~160-220 MB (vs ~800 MB com Node container)
✅ CPU: Mínimo (Nginx é super leve)
✅ Deploy: Copia `dist/` e reinicia Nginx (segundos)
✅ Cache: Nginx serve assets com cache HTTP
✅ HTTPS: Fácil adicionar Certbot depois
