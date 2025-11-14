# frontend/Dockerfile (VERSÃO SIMPLIFICADA - SEM BUILD)

# --- 1. Estágio de "Servir" (O Porteiro Nginx) ---
FROM nginx:1.21-alpine

# 2. Apagamos o HTML de boas-vindas padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# 3. Copiamos a nossa pasta 'dist' (que já foi compilada localmente)
# para a pasta de 'html' do Nginx.
COPY dist /usr/share/nginx/html

# 4. Copiamos as nossas "Regras do Porteiro" (o proxy) para o Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 5. Expomos a porta 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]