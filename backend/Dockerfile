# backend/Dockerfile

# 1. Usar uma imagem Node.js leve e oficial
FROM node:18-alpine

# 2. Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# 3. Copiar os ficheiros de dependência PRIMEIRO
# (Isto aproveita o cache do Docker)
COPY package*.json ./

# 4. Instalar as dependências
RUN npm install --include=dev

# 5. Copiar a pasta do Prisma
COPY prisma ./prisma/

# 6. Gerar o Cliente Prisma (MUITO IMPORTANTE)
# (Isto é necessário para o Prisma funcionar no servidor)
RUN npx prisma generate

# 7. Copiar o resto do seu código-fonte
COPY . .

# 8. Expor a porta que o seu backend usa
EXPOSE 3000

# 9. O comando para iniciar a aplicação em modo de produção
CMD [ "npm", "run", "start" ]