# Reutiliza a imagem que o EasyPanel já usa, preservando a configuração de Nginx e PORT.
FROM easypanel/contandoviagens/lp-site:latest

WORKDIR /app

COPY index.html style.css script.js founder.jpg logo.png ./
