<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

## Projeto

Este é um portfólio interativo em React + TypeScript + Vite + KAPLAY.
O projeto funciona como uma pequena experiência 2D em pixel art na qual a cidade representa o portfólio profissional.

## Objetivo atual

Evoluir o mapa atual para uma cidade desértica autoral chamada **Desert Oasis / Cidade de Descanso dos Treinadores e Devs**, mantendo a base funcional existente.

## Stack e arquitetura

- React
- TypeScript
- Vite
- KAPLAY
- Supabase para conteúdo dinâmico do portfólio
- Código principal do jogo em `src/game/`
- Componentes da experiência em `src/components/game/`

## Regras obrigatórias

1. NÃO reescrever o projeto do zero.
2. NÃO remover funcionalidades existentes sem necessidade.
3. Preservar React + TypeScript + Vite + KAPLAY.
4. Preservar a integração existente com Supabase.
5. Preservar movimento, cenas, diálogos, interações, prédios e interiores existentes.
6. Preferir mudanças incrementais e fáceis de revisar.
7. Antes de alterar um arquivo, verificar suas dependências e usos.
8. Evitar `any` desnecessário.
9. Manter TypeScript bem tipado.
10. Separar dados de lógica sempre que isso simplificar a manutenção.
11. Não criar sistemas paralelos quando já existir um sistema equivalente no projeto.
12. Não alterar histórico Git já publicado, não fazer force push, rebase, amend ou squash de commits publicados.

## Pixel art

O jogo deve manter aparência pixel art nítida.

- Priorizar renderização crisp/pixel-perfect.
- Não usar blur ou anti-aliasing em sprites.
- Evitar escala fracionada de sprites quando não for necessária.
- Investigar alpha, bordas semitransparentes, recortes e interpolação quando um sprite apresentar halo/névoa.
- Preservar a configuração de renderização pixel-perfect existente do KAPLAY.
- Não aplicar filtros CSS que suavizem os sprites.

## NPCs

A arquitetura de NPCs deve permitir dados separados da lógica de renderização.

Cada NPC pode possuir:

- `id`
- `name`
- `type`
- `x`
- `y`
- `sprite`
- `direction`
- `dialogue`
- `behavior`
- `state`

Tipos previstos:

- TRAINER
- VETERAN_TRAINER
- RESEARCHER
- RANGER
- MERCHANT
- DEVELOPER
- MECHANIC
- TRAVELER
- CAMPER
- INN_WORKER

Novos tipos devem ser fáceis de adicionar sem alterar a lógica central.

## Mundo / mapa

A evolução do mapa deve preservar o que já funciona e, gradualmente, separar:

- mapa;
- prédios;
- NPCs;
- objetos;
- colisões;
- interações;
- dados de configuração;
- renderização.

Diretórios sugeridos, caso façam sentido para a estrutura atual:

```text
src/game/maps/
src/game/data/
src/game/entities/
src/game/systems/
```

Não criar esses diretórios apenas por obrigação se uma estrutura existente já resolver o problema melhor.

## Cidade

A evolução visual deve considerar:

- Oásis/lago com margem, pedras, vegetação, palmeiras e área de interação.
- Praça central com caminhos, bancos, vegetação e iluminação.
- Arena/ginásio como área de treinamento.
- Laboratório com elementos externos de pesquisa.
- Loja/mercado com bancas, caixas e comerciante.
- Trainer Inn para descanso.
- Dev Workshop com computadores, mesas, monitores, quadros e ferramentas.
- Área de treinamento.
- Área de camping.
- Pequena área para animais do deserto.

## Significado do portfólio

Sempre que possível, aproveitar os dados já existentes no Supabase.

- Casa → Sobre mim
- Laboratório → Skills / tecnologias
- Arena → Projetos
- Loja → Contato
- Dev Workshop → Arquitetura / ferramentas / desenvolvimento
- Oásis → Exploração / descanso
- Trainer Inn → Área social / apresentação

Não duplicar dados de projetos, skills ou contato que já estejam disponíveis no sistema atual.

## Interações

Usar o sistema de interação existente.

Possíveis interações:

- Oásis → observar lago
- Trainer Inn → descansar
- Dev Workshop → ver projetos / tecnologias
- Laboratório → conversar com pesquisador
- Mercado → conversar com comerciante
- Arena → ver projetos
- Camping → conversar
- Animais → observar

Essas interações podem inicialmente ser simples, mas devem ser estruturadas para futuras expansões.

## Colisões

Separar aparência visual de colisão quando possível.

O player não deve:

- atravessar prédios;
- atravessar objetos sólidos;
- atravessar água quando ela for bloqueada;
- ficar preso por colisões invisíveis;
- ter áreas bloqueadas sem motivo visual.

## Animações

Preferir um sistema simples e reutilizável para:

- idle;
- caminhada;
- água;
- fogo;
- bandeiras;
- folhas;
- pequenos efeitos ambientais.

Não criar um framework de animação excessivamente complexo.

## Fluxo de implementação recomendado

Executar mudanças por etapas, nesta ordem:

1. Corrigir NPCs e renderização pixel-perfect.
2. Melhorar organização dos dados de NPCs.
3. Modularizar mapa/dados sem reescrever o jogo.
4. Evoluir o mapa para Desert Oasis.
5. Adicionar Trainer Inn e Dev Workshop.
6. Adicionar áreas de treinamento, camping e animais.
7. Adicionar interações.
8. Adicionar vida/pequenas animações ambientais.
9. Validar integração com Supabase e funcionalidades existentes.

## Validação

Depois de alterações relevantes:

```bash
npm run build
```

Executar também lint/testes existentes, caso estejam configurados.

Corrigir erros de TypeScript, build e imports quebrados antes de considerar a tarefa concluída.

## Git

Preferir commits pequenos e claros por funcionalidade, por exemplo:

- `fix: clean npc pixel rendering`
- `refactor: separate npc data from rendering`
- `feat: add desert oasis map structure`
- `feat: add trainer inn and dev workshop`
- `feat: add world interactions`

Nunca reescrever histórico publicado.
