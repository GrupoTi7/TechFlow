# --- ESTÁGIO 1: A "Cozinha" (Construção) ---
# Usamos o Node.js para compilar o projeto do zero
FROM node:18-alpine as build
WORKDIR /app

# Copia os ficheiros de dependências primeiro (para otimizar cache)
COPY package*.json ./
RUN npm install

# Copia o resto do código (incluindo o seu novo api.js com o /api)
COPY . .

# Obriga o Docker a gerar uma pasta 'dist' novinha em folha
RUN npm run build


# --- ESTÁGIO 2: O "Porteiro" (Nginx) ---
FROM nginx:1.21-alpine

# Apaga o HTML padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# O GRANDE SEGREDO: Copia a pasta 'dist' gerada no ESTÁGIO 1, e não do seu computador!
COPY --from=build /app/dist /usr/share/nginx/html

# Copia os certificados e configurações do Nginx
COPY certs /etc/nginx/certs/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe as portas
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]