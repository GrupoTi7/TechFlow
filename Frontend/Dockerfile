FROM nginx:1.21-alpine
RUN rm -rf /usr/share/nginx/html/*
# Copia a nossa pasta dist novinha do computador direto para o Nginx
COPY dist /usr/share/nginx/html
COPY certs /etc/nginx/certs/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]