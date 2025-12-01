FROM python:3.12-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements primeiro para aproveitar cache do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretório para o banco de dados
RUN mkdir -p /app/data

# Expor porta
EXPOSE 8000

# Comando para iniciar a aplicação com hot-reload otimizado usando watchfiles
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "app"]
# retirar o --reload em produção
