# Contando Viagens — Landing Page

Página única que converte visitante em membro dos grupos de ofertas no WhatsApp,
e em cotação direta com a agência.

**No ar:** https://contandoviagens.com.br
**Repositório:** https://github.com/contdiego/contando-viagens-lp (branch `main`)

---

## 1. Como o site sobe

O fluxo tem três etapas, e a terceira **não é automática hoje**.

```
pasta local  →  git push  →  GitHub (main)  →  [CLIQUE MANUAL]  →  EasyPanel builda e publica
```

### Passo a passo

```bash
cd "/Users/diegosilva/Documents/Antigravity/Projetos/Contando Viagens - lp"
git add -A && git commit -m "descrição da mudança" && git push
```

Depois, no EasyPanel:

1. Abrir `http://187.77.58.105:3000`
2. Projeto **contandoviagens** → app **lp-site**
3. Botão verde **Implantar**
4. O build leva de 15 segundos a 1 minuto

### Por que o clique é necessário

O webhook do GitHub **parou de funcionar**. O histórico do EasyPanel mostra que todos os
pushes até 6 de agosto de 2026 geraram deploy sozinhos; os pushes a partir de 23 de agosto
não geram mais.

**Consequência:** o código pode estar no GitHub e o site continuar servindo a versão antiga
por tempo indefinido. Nunca assuma que o push publicou.

### Segunda armadilha: o Dockerfile não copia diretório

O `COPY` do Dockerfile é uma **lista explícita de arquivos**. Página nova em subpasta
(`privacidade/`, `termos/`) precisa de uma linha `COPY` própria. Sem ela o arquivo chega ao
GitHub, o deploy roda sem erro, a home atualiza — e a URL nova responde 404. Aconteceu em
09/09 com as duas páginas legais.

**Ao criar qualquer página nova: acrescentar o `COPY` antes de fazer o push.**

**Causa raiz encontrada (03/09):** o EasyPanel precisa de um **GitHub Token** configurado
para conseguir criar/manter o webhook em repositórios privados. Sem o token, o botão
"Ativar Deploy Automático" (Configurações do app → aba Fonte) volta sozinho para desligado —
o clique parece funcionar mas não muda nada.

**Como arrumar (pendente, depende do Diego):** EasyPanel → **Configurações** (ícone de
engrenagem, canto superior direito) → gerar/colar um GitHub Personal Access Token com escopo
`repo`. Depois disso, voltar em `lp-site` → Fonte e clicar em "Ativar Deploy Automático".

---

## 2. Infraestrutura

| Item | Valor |
|---|---|
| VPS | Hostinger, `srv1428871.hstgr.cloud` — IP `187.77.58.105` |
| Painel | EasyPanel em `http://187.77.58.105:3000` |
| Projeto / app | `contandoviagens` / `lp-site` |
| Fonte do build | GitHub `contdiego/contando-viagens-lp`, branch `main`, caminho `/` |
| Builder | **Dockerfile** (`nginx:1.27-alpine`) — trocado de Nixpacks em 03/09 |
| Servidor web | nginx 1.27.5 (Alpine) |
| Domínio | contandoviagens.com.br (mais `www` e o endereço interno do EasyPanel) |
| Porta do container | **80** — os três domínios apontam para `http://contandoviagens_lp-site:80/` |

### Cache-Control (resolvido em 03/09)

Até 03/09 o nginx não mandava `Cache-Control` nenhum — nem no HTML, nem no CSS, nem nas
imagens. Sem essa instrução, cada navegador inventava um prazo próprio (mais ou menos 10% do
tempo desde a última modificação do arquivo), o que causou o susto do dia 23/08: HTML novo
sendo aplicado sobre CSS antigo em cache, página aparecendo quebrada.

**Correção aplicada:** o build passou de Nixpacks para um `Dockerfile` próprio
(`nginx:1.27-alpine`), com `nginx.conf` definindo os cabeçalhos abaixo. Confirmado ao vivo em
`https://contandoviagens.com.br` — resposta mostra `server: nginx/1.27.5` e os
`Cache-Control` corretos em cada tipo de arquivo:

| Arquivo | Cache-Control |
|---|---|
| `/` e `.html` | `no-cache` — sempre revalida |
| `.css` e `.js` | `max-age=31536000` — versionados pelo `?v=` no index.html |
| imagens e fontes | `max-age=604800` (7 dias) |

O gzip vem junto: index.html de 22 KB para 4,6 KB, style.css de 14,5 para 4,2.

**Como mexer:** EasyPanel → app `lp-site` → Fonte → Construção. Está marcado **Dockerfile**.
A porta do container continua 80, que é o que os domínios esperam.

**Para voltar ao Nixpacks (rollback):** mesma tela, marcar **Nixpacks** e Implantar. Isso
volta a perder os cabeçalhos de cache. Menos de um minuto.

**Pegadinha do EasyPanel ao trocar o método de build:** o primeiro "Implantar" depois de
marcar Dockerfile pode terminar em poucos segundos, sem log de build, reaproveitando a imagem
antiga em cache — o site parece no ar mas continua servindo a versão velha (`server` header
não muda). Se isso acontecer, usar **Forçar Reconstrução** (menu de ferramentas ao lado do
botão Implantar) para ignorar o cache e buildar de verdade — dá para confirmar pelo log, que
deve mostrar os passos `docker build` completos (`FROM nginx:1.27-alpine`, `COPY`, etc.).

**Cuidado ao trocar uma foto:** as imagens ficam 7 dias em cache pelo nome do arquivo. Se
substituir uma foto mantendo o mesmo nome, quem já visitou continua vendo a antiga. Use nome
novo (`madri-2.jpg`) e atualize a referência no `index.html`.

---

## 3. Arquivos

```
index.html        página inteira, sem framework
style.css         sistema visual completo
script.js         seletor de cidade, barra fixa, animação de entrada, Pixel
Dockerfile        build da imagem: nginx:1.27-alpine + arquivos do site
nginx.conf        cabeçalhos de Cache-Control, gzip
fortaleza.jpg     foto do card SSA · REC → FOR
noronha.jpg       foto do card REC → FEN
madri.jpg         foto do card REC · FOR → MAD
founder.jpg       retrato do Diego, seção "quem está do outro lado"
logo.png          marca no cabeçalho, rodapé e favicon
_mockups/         propostas de design (ignorado pelo git)

privacidade/index.html   Política de Privacidade
termos/index.html        Termos de Serviço
```

As duas páginas legais são servidas como diretório (`/privacidade/`, `/termos/`), que é o
que o `try_files $uri $uri/` do nginx resolve. Não renomear para `privacidade.html` — nessa
forma o nginx devolve 404.

**Peso da primeira carga:** cerca de 491 KB. O `founder.jpg` carrega só quando o visitante
rola até ele, e a foto de Fortaleza é pré-carregada por abrir a fileira.

Apagados em 25/08: `founder.png` (5 MB), `bg.png` (683 KB) e o `Dockerfile` antigo, que
tinha uma referência circular à própria imagem e era ignorado pelo Nixpacks.

---

## 4. Sistema visual

Sem framework, sem build. CSS escrito à mão com variáveis.

### Cores

| Variável | Valor | Uso |
|---|---|---|
| `--ground` | `#FFFFFF` | fundo principal |
| `--mist` | `#EDF1F0` | fundo das seções alternadas |
| `--ink` | `#0A1C25` | texto corrido |
| `--petrol` | `#0B3040` | títulos, botões sólidos |
| `--petrol-deep` | `#071F2B` | faixas escuras, cards de oferta, rodapé |
| `--teal` | `#10726B` | destaque, chapéus, itálico do título |
| `--copper` | `#B57A4B` | acento fino: filetes, setas, numerais |
| `--muted` | `#5C6B72` | texto secundário |

A paleta é a original da marca, aprofundada e dessaturada. O teal saiu de `#0E9F9A` para
`#10726B` e o laranja de `#F28D57` para o cobre `#B57A4B`. Cor saturada demais lê como
panfleto de promoção; a mesma família mais fechada lê como curadoria.

### Tipografia

- **Bodoni Moda** — títulos, rotas, preços. Alto contraste, ar de revista de viagem.
- **Archivo** — texto, botões, rótulos.

Ambas do Google Fonts. Não há fonte local.

### Regras de composição

Filetes de 1px no lugar de sombras difusas. Raio de 2px, quase reto. Espaçamento generoso.
A economia visual é o que faz a página parecer cara.

---

## 5. Estrutura da página

1. **Cabeçalho fixo** — marca, links sociais (Instagram, YouTube, TikTok), botão de cotação (escondido no celular)
2. **Hero** — título, subtítulo, **cards de oferta**, seletor de cidade, dois botões
3. **Como funciona** — três passos numerados
4. **Quem está do outro lado** — faixa escura com o retrato do Diego
5. **Sua viagem inteira** — os 10 serviços da agência em índice de duas colunas
6. **Sem letra miúda** — FAQ com quatro perguntas
7. **CTA final** — seletor de cidade e os dois botões de novo
8. **Rodapé** — marca e links sociais (Instagram, YouTube, TikTok)
9. **Barra fixa** — só no celular, aparece quando o botão do topo sai da tela

### Ordem no celular

O hero se reorganiza: **título → ofertas → seletor → botões**. Mostra o produto antes de
pedir a ação. No desktop, o texto e os botões ficam à esquerda e as ofertas à direita.

---

## 6. O card de oferta

É o elemento central da página. Cada card tem:

```
REC · FOR → MAD                                    AÉREO
Recife ou Fortaleza para Madri
                    [ foto do destino, sangrando ]
R$ 3.599  por pessoa
────────────────────────────────
✓ Já enviada no grupo
```

**Códigos de aeroporto** marcam a rota. Quando a oferta sai de duas cidades, os dois códigos
aparecem antes da seta (`SSA · REC → FOR`). É o vocabulário de quem viaja.

**A foto sangra pelo card inteiro**, com um escurecimento em degradê que protege o topo e a
base — onde fica o texto — e libera o meio para a imagem aparecer. O tipo ainda leva sombra
suave como seguro para fotos claras.

**No celular** os cards viram carrossel de deslize com encaixe, e o card seguinte sangra pela
borda direita para o dedo entender que tem mais.

### Como trocar uma oferta

1. Abrir `index.html` e achar o bloco `<div class="rail">`
2. Cada oferta é um `<article class="fare">`. Editar:
   - `<p class="route">` — códigos de aeroporto, separados por `<i>&rarr;</i>`
   - `<p class="fare-kind">` — `Aéreo`, `Pacote · 4 noites`, etc.
   - `<p class="fare-city">` — cidades por extenso
   - `<p class="fare-price"><b>` — o preço
   - `style="background-image:url(arquivo.jpg)"` — a foto
3. Salvar a foto nova na raiz do projeto, horizontal, 1200px de largura, JPEG
4. Commit, push, e **clicar em Implantar no EasyPanel**

**Fotos:** o assunto principal deve estar em cima ou ao centro. O rodapé da imagem fica
coberto pelo escurecimento.

---

## 7. Seletor de cidade

O visitante escolhe entre **Recife & João Pessoa** e **Fortaleza & Salvador**. O
`script.js` troca o link e o subtítulo de todos os botões marcados com `.grupo-cta` —
inclusive o da barra fixa do celular.

Substituiu os botões antigos escritos "REC · JPA" e "FOR · SSA", que ninguém decodifica
num alvo pequeno. Um alvo de toque no lugar de três.

### Links

| Destino | URL |
|---|---|
| Grupo Recife & João Pessoa | `https://chat.whatsapp.com/E8IaWyrQtkeJks55UQvmTr?mode=gi_t` |
| Grupo Fortaleza & Salvador | `https://chat.whatsapp.com/CEX3t7DDpuGIw30QyJNn1O?mode=gi_t` |
| Cotação direta | `https://wa.me/5581997869326` |
| Instagram | `https://www.instagram.com/contandoviagenss/` |
| YouTube | `https://www.youtube.com/@contandoviagenss` |
| TikTok | `https://www.tiktok.com/@contandoviagens` |

A mensagem que abre no WhatsApp da cotação:
**"Olá, vim do site e gostaria de uma cotação para viajar"**

---

## 8. Rastreamento

**Meta Pixel ID:** `3528178480663408`

Dispara `PageView` ao carregar e `Lead` a cada clique em botão de contato. São **18 pontos**:

| `data-cta-location` | Onde fica | Qtd |
|---|---|---|
| `topo-cotacao` | botão do cabeçalho | 1 |
| `hero-grupo` | botão principal do hero | 1 |
| `hero-cotacao` | botão secundário do hero | 1 |
| `agencia-servico` | os 10 serviços da lista | 10 |
| `agencia-cotacao` | botão da seção da agência | 1 |
| `final-grupo` | botão principal do CTA final | 1 |
| `final-cotacao` | botão secundário do CTA final | 1 |
| `barra-grupo` | barra fixa do celular | 1 |
| `barra-cotacao` | barra fixa do celular | 1 |

O evento carrega `content_category` com o local e `content_name` com o nome do destino —
no caso dos grupos, o nome muda conforme a cidade escolhida no seletor.

---

## 9. Acessibilidade e desempenho

- Link "Pular para o conteúdo" no início, visível ao receber foco de teclado
- Contorno de foco em cobre, visível em todos os elementos clicáveis
- Alvos de toque com 44px ou mais
- `prefers-reduced-motion` respeitado: sem animação para quem pediu
- **Conteúdo à prova de JS quebrado:** a animação de entrada só esconde os blocos se o
  JavaScript estiver vivo (classe `js` no `<html>`). Sem JS, a página aparece inteira.
  Sem isso, um `script.js` velho em cache deixaria a página em branco.
- Ícones em SVG dentro do HTML. Não há Font Awesome nem CDN de ícone.

---

## 10. Pendências

### Conteúdo

- [ ] **Origem das fotos de Noronha e da praia do Ceará.** Se vieram de busca de imagens,
      não estão licenciadas e precisam ser trocadas. Página comercial e indexada.
      A foto de Madri já foi substituída por uma sem marca d'água.
- [ ] **Confirmar se os preços são ida e volta.** Hoje nenhum card afirma isso — dizem só
      "Aéreo". Confirmado, vira "Ida e volta" e os preços ficam mais fortes.
- [ ] **Datas das ofertas.** Nenhum card mostra período. Com data, o visitante consegue
      calcular se serve para ele.
- [ ] **Resolução da foto de Noronha.** Veio a 540×360 e foi ampliada. Aceitável no celular,
      macia no desktop.

### Técnico

- [x] **Cabeçalhos de cache no nginx** — resolvido em 03/09, ver seção 2
- [x] **Apagar** `founder.png`, `bg.png` e o `Dockerfile` antigo (referência circular) — feito em 25/08
- [ ] **Webhook do GitHub** — depende do Diego adicionar um GitHub Token nas Configurações do
      EasyPanel (ver seção 1). Até lá, todo deploy continua manual.
- [ ] **Teste em Safari de iPhone real** — tudo foi testado em Chromium emulando o tamanho da
      tela. Falta confirmar no aparelho: o desfoque da barra fixa, o comportamento dela com a
      barra de endereço do Safari, e a inércia do carrossel

---

## 11. Histórico

| Data | Mudança |
|---|---|
| 12/04/2026 | Primeira versão |
| 27/07 – 06/08 | Segundo grupo, seção da agência, ajustes de texto |
| 23/08 | **Redesenho premium.** Paleta aprofundada, Bodoni Moda no lugar do Playfair, filetes no lugar de sombras, retrato editorial. Página de 5,2 MB para 180 KB |
| 23/08 | Versão nos arquivos e conteúdo à prova de JS quebrado, depois do incidente de cache |
| 23/08 | Nova mensagem de cotação no WhatsApp |
| 25/08 | **A oferta no centro.** Cards com foto do destino no hero, retrato movido para a seção de atendimento, seletor de cidade, caminho da cotação reforçado |
| 09/09 | **Páginas legais.** Política de Privacidade e Termos de Serviço criados e linkados no rodapé; CSS para `v=4`. Exigência do Google para verificar o app OAuth que publica no YouTube — a política descreve o escopo `youtube.upload` e o Uso Limitado, e cita o Meta Pixel. Razão social, CNPJ e CNAE preenchidos a partir do cartão CNPJ. Endereço publicado só como "Recife/PE" — o logradouro do cartão é de Empresário Individual e não é exigido pela LGPD |
| 03/09 | Botão "Falar com a agência" restaurado no cabeçalho (tinha sido perdido na migração), README criado, `founder.png`/`bg.png`/`Dockerfile` antigo apagados, build trocado de Nixpacks para Dockerfile próprio com `Cache-Control` correto (nginx 1.27.5), causa raiz do webhook diagnosticada |
| 09/09 | Links de YouTube e TikTok adicionados no cabeçalho e no rodapé, ao lado do Instagram |
