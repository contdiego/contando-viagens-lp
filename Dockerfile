# Site estatico servido por nginx, com politica de cache propria.
# Substitui o build Nixpacks, que nao enviava nenhum cabecalho Cache-Control.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css script.js founder.jpg logo.png fortaleza.jpg noronha.jpg madri.jpg /usr/share/nginx/html/

EXPOSE 80
