# Portfólio RPG 2D estilo Pokémon — reconstrução no Lovable

Recriar o jogo do repositório `Lucas-Amaral-dom/portfolio` aqui, com mapa externo, **interiores 2D jogáveis** e conteúdo editável salvo na nuvem.

## O que você vai ter

1. **Cidade (mapa externo)** — grama, estradas, água, árvores, lampiões e 4 construções. Movimento com WASD/setas, D-pad no celular, câmera que segue o jogador.
2. **Entrar nos prédios de verdade** — ao pisar na porta e apertar A/Enter, a tela troca para o **interior** daquele prédio: piso, paredes, móveis e NPCs/objetos que abrem **caixas de diálogo pixel art** paginadas com suas informações. Sair pelo tapete da porta volta você para o mapa, na frente do prédio.
3. **Os 4 interiores**
   - **Casa (Sobre mim)** — NPC "você mesmo" conta sua história; quadro na parede com classe/origem/foco.
   - **Lab SENAI (Skills)** — 4 bancadas, cada uma abre um grupo de competências (base, web, dados/backend, qualidade).
   - **Arena (Projetos)** — cada projeto é um "troféu"/placa: título, descrição, tags e links para os repositórios.
   - **Loja (Contato)** — balcão com atendente: e-mail, LinkedIn, GitHub, e um formulário de mensagem que salva na nuvem e você lê no painel de admin.
4. **Extras de jogo** que valorizam o portfólio: "Pokédex de Skills" com nível por tecnologia, badges coletáveis ao visitar cada prédio (progresso 0/4), música/efeitos com botão de mudo, tela de título "Aperte Start", e transições de fade estilo Pokémon.
5. **Modo edição com login** — você entra em `/auth`, ativa o modo edição e altera qualquer texto (bio, skills, projetos, contatos, títulos dos diálogos). Salvo na nuvem, então quem visitar vê o conteúdo atualizado. Visitantes nunca veem os botões de edição.

## Melhorias que já identifiquei no repo atual

- Layout do mapa tem linhas com **28 e 27 colunas** (linhas 6, 7, 15, 16, 18, 19), o que desalinha tiles e colisões.
- Prédios são **JPGs de 1024px (~500–700 KB cada)** esticados; vou fatiar/otimizar para pixel art nítida e leve.
- Movimento é preso a `onKeyDown` sem diagonais e o "clique para andar" briga com o teclado; vou trocar por vetor de movimento normalizado.
- Ao entrar, o jogo continua rodando atrás do painel; vou pausar/trocar de cena.
- Conteúdo salvo em `localStorage` só existe no seu navegador — resolvido com a nuvem.
- Sem SEO, sem título/descrição por página, sem preview social — vou adicionar.
- `contentEditable` gravando `innerHTML` é risco de XSS; a edição nova salva texto puro validado.

## Detalhes técnicos

- **Engine**: Kaplay (sucessor mantido do Kaboom) carregado via npm, montado em componente `<ClientOnly>` + `React.lazy` para não rodar no SSR. Rota `/` = jogo; `/auth` = login; `/admin` = mensagens recebidas.
- **Cenas**: `title`, `city`, `interior-about`, `interior-skills`, `interior-projects`, `interior-contact`. Dados do mapa e dos móveis em módulos de dados puros (browser-safe), separados do módulo da engine.
- **Backend (Lovable Cloud)**: tabelas `site_content` (chave/valor de texto), `projects`, `skills`, `contact_messages`, `user_roles` + função `has_role`. RLS: leitura pública do conteúdo, escrita só para admin; `contact_messages` aceita insert público e leitura só admin. GRANTs explícitos por tabela.
- **Leitura**: server function pública lê o conteúdo; rota usa `ensureQueryData` + `useSuspenseQuery`. Escritas passam por server functions autenticadas com checagem de role admin.
- **Design**: tema pixel art próprio (paleta verde/creme Pokémon, fonte Press Start 2P nos diálogos + fonte legível no corpo), tokens em `src/styles.css`, caixas de diálogo e HUD como componentes reutilizáveis.
- **Conteúdo**: começo com os textos do repo atual como seed no banco (bio, 4 grupos de skills, projetos Biblioteca e Guarda-vidas). Contatos ficam com placeholder até você me passar e-mail/LinkedIn/GitHub — ou você mesmo edita direto no modo edição.

## Ordem de execução

1. Ativar Lovable Cloud, criar tabelas + roles + seed do conteúdo atual.
2. Tema pixel art, tela de título, HUD e caixa de diálogo.
3. Mapa da cidade corrigido, jogador, colisões, portas.
4. Os 4 interiores com NPCs/objetos e diálogos vindos do banco.
5. Login, modo edição e painel de mensagens.
6. Badges/progresso, áudio, transições, SEO por rota e ajuste mobile.
