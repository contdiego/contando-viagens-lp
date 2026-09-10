# Site estatico servido por nginx, com politica de cache propria.
# Substitui o build Nixpacks, que nao enviava nenhum cabecalho Cache-Control.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css script.js founder.jpg logo.png fortaleza.jpg noronha.jpg madri.jpg /usr/share/nginx/html/

# Arquivo de assinatura do TikTok (verificacao de URL prefix). Nome e conteudo
# vem do painel do TikTok; se apagar, a verificacao cai e o app trava.
COPY tiktokeodoWsQHItnG3L60AEjC7oulHVTbNGCc.txt /usr/share/nginx/html/

# Paginas legais. ATENCAO: o COPY acima e uma lista explicita de arquivos e nao
# leva diretorio junto. Toda pagina nova em subpasta precisa da sua propria linha
# aqui, senao vai para o GitHub, o deploy passa e a URL responde 404.
COPY privacidade/ /usr/share/nginx/html/privacidade/
COPY termos/ /usr/share/nginx/html/termos/
COPY tiktok-callback/ /usr/share/nginx/html/tiktok-callback/
COPY linkedin-callback/ /usr/share/nginx/html/linkedin-callback/

EXPOSE 80
