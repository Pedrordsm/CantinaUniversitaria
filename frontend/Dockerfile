# /frontend/Dockerfile

# ESTÁGIO 1: Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 
# (Nota: o Vite gera a pasta /dist por padrão)

# ESTÁGIO 2: Servir com Nginx
FROM nginx:alpine
# Copia os arquivos gerados no build para a pasta pública do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Copia a configuração do Nginx com proxy para o backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]