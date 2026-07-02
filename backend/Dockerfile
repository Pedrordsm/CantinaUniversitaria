# /backend/Dockerfile

# Imagem base
FROM node:18-alpine

# Diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que a API e o Socket.io vão usar
EXPOSE 3001

# Comando para iniciar o backend (baseado no seu script)
CMD ["npm", "run", "dev"]