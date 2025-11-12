# frontend/Dockerfile

# --- 1. Estágio de "Build" (Construir o 'dist') ---
# (Isto executa 'npm run build' dentro do Docker)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 2. Estágio de "Servir" (O Porteiro Nginx) ---
# (Isto cria um servidor Nginx leve)
FROM nginx:1.21-alpine

# Copia os ficheiros da 'dist' (que acabámos de construir) para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia as nossas "Regras do Porteiro" (o proxy) para o Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 (a porta do Nginx)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]