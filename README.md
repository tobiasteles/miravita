# Miravita

1. `npm install`
2. `cp .env.example .env.local` e preencha: `DATABASE_URL` (Neon) e as chaves do Clerk (clerk.com → API Keys).
3. `npm run db:push` (cria as tabelas) e `npm run db:seed` (elementos, itens, classes, traços, mapas).
4. `npm run dev` → http://localhost:3000
5. Coloque os avatares em `public/avatars/class_<classe>_01..03.png`.

## Deploy na Vercel
Suba para o GitHub, importe na Vercel e cadastre as 5 variáveis do `.env.example` em Settings → Environment Variables.
No painel do Clerk, adicione o domínio da Vercel. Rode `db:push` e `db:seed` uma vez apontando para o banco de produção.

## Já incluído
Schema completo, auth (Clerk), criação/seleção/exclusão de até 6 personagens (limite atômico), traços e avatares por classe,
curva de XP (`lib/game/xp.ts`), algoritmo de itens da tabela periódica (`lib/game/item-stats.ts`), mapas com nível mínimo e
localização no painel, chat global (polling), menu ESC com configurações/seleção/desconectar.

## Combate, calabouços, forja e guildas
Combate servidor-autoritativo (`src/actions/battle.ts`, estado na tabela `battles`), barra de timing, invocações (Humanas), portal com 4 ondas + chefe,
forja (5 elementos → arma/armadura equipada automaticamente), guildas com patentes e chat privado.
Para testar rápido, defina `XP_MULTIPLIER=30`. Depois de atualizar, rode `npm run db:push` (nova tabela `battles`).

## IA (Gemini)
`GEMINI_API_KEY` (aistudio.google.com/apikey), `GEMINI_MODEL` e `CRON_SECRET` nas variáveis da Vercel. Rode `npm install` e `npm run db:push`.
O cron diário (`vercel.json`) chama `/api/cron/monsters`, que gera monstros e grava em `ai_monsters`. Teste manual:
`curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-APP/api/cron/monsters`

## Telemetria e balanceamento por IA
Cada luta grava uma linha em `battle_logs`. Toda segunda, `/api/cron/balance` agrega os últimos 7 dias (grupos com 30+ lutas), compara com as metas
e pede sugestões ao Gemini, gravadas em `balance_suggestions`. Revise em `/admin/balance` (só IDs em `ADMIN_USER_IDS`). Rode `npm run db:push`.

## Painel do personagem e atalhos
Na tela `/play`: Q missões, O inventário, T técnicas, G guilda, C chat, H habilidades (5 pontos por nível em FOR/INT/DES), M mapa. Rode `npm run db:push`.
Teleporte: Humanas e Linguagens (mágicas) sem custo; Exatas gastam 1 Pedra de Teletransporte (150g ou missões secundárias).

## Imagens da batalha (estilo FireRed)
- Monstros: `public/monsters/<nome-em-slug>.png` (ex.: `slime-de-cinza.png`, `sombra-soberana.png`; sem acentos, minúsculas, hífens; o 👑 do chefe é ignorado).
- Personagem: `public/battle/player/<avatarId>.png` (opcional, ex.: de costas); se faltar, usa `public/avatars/<avatarId>.png`. Sem imagem, aparece um emoji.
## Chat
Local (mesmo mapa, 1 msg/2s), Privado (por nome, 1 msg/s), Gritar (todos os mapas, Nv.5+, 1 msg/30s, 80 letras, vale por 10 min), Guilda. Máx. 20 msgs/min por personagem. Rode `npm run db:push`.

## Energia Arcana, domínios, grupos e caçadas
"Mana/MP" virou **Energia Arcana (EA)** na interface. Se já rodou o seed, atualize o traço: `update traits set description='+20% EA' where id='criativo';`
Domínios (3 por classe, 1 ponto por nível, máx. 20) em `/attributes`; grupos de até 4 dentro da guilda (+10% XP por aliado no mesmo mapa, chat "Grupo");
caçadas (matar N monstros do mapa) em `/quests`. Rode `npm run db:push`.

## Hierarquia de técnicas e Expansão Arcana
Técnicas em níveis Fundamental (<50), Médio (50–119) e Superior (120+). No Superior, cada classe tem sua técnica suprema (Nv. 150): Horizonte de Eventos (Exatas),
Panteão das Eras (Humanas), Grimório Absoluto (Linguagens). Nomes em `DOMAINS`/`DOMAIN_TERM` em `src/lib/game/battle.ts`. Não há mudança de banco.

## Técnica suprema personalizável (Nv. 150)
O jogador dá o nome, escolhe o grito de ativação e um dos 4 aspectos da sua classe (`ASPECTS`): cada um muda o efeito da barreira (paralisia, cura, recuperar EA, mais dano com custo de HP...).
Maestria 0–10 (+1 a cada 5 usos: +5% de poder, -2% de custo). Reforjar custa 10.000g e mantém a maestria. Rode `npm run db:push` (coluna `domain`).

## Identidade visual
Emblema "Olho do Desperto", logo, selos de classe (Exatas/Humanas/Linguagens), paleta e tipografia (Cinzel). Guia em `/brand`; SVGs para download em `public/brand/`;
favicon (`src/app/icon.svg`) e imagem de compartilhamento (`opengraph-image.tsx`). Componentes em `src/components/brand/Brand.tsx`; fonte dos desenhos em `src/lib/brand.ts`.

## Imagens conectadas
Coloque os arquivos em `public/`: `avatars/`, `battle/player/`, `monsters/`, `items/` (mat-/blade-/armor-<simbolo>, potion, teleport-stone), `maps/<slug>.png` (batalha, painel e mapa),
`npcs/`, `summons/`, `story/m1..m8.png`, `domains/<aspecto>.png`, `skills/<classe>-<1..6>.png`, `brand/key-art.png` e `brand/levelup-banner.png`.
O jogo aceita .png, .jpg, .jpeg e .webp (tenta nessa ordem). Para sprites/itens que precisam de fundo transparente: `python tools/converter-imagens.py`.
Se um arquivo não existir, o jogo usa emoji ou o fundo padrão (componente `SafeImg`).

## Tema sem "ensino"
Classes exibidas como **Duelista** (exatas), **Invocador** (humanas) e **Mago** (linguagens); as chaves internas e os nomes dos arquivos de imagem continuam os mesmos.
Se o banco já estava populado: `update maps set name='Pântano Sombrio' where slug='pantano-radioativo';`

## 11 classes
Espadachins: Mestre da Precisão, Destruidor, Lâmina Elemental. Magos: Mago Arcano, Ilusionista, Mago das Runas, Mago da Luz. Invocadores: Invocador de Eras, da Terra, de Ideias, Mestre de Feras.
Passiva de todos: Condicionamento Físico (+10% HP, +3% esquiva). Rode `npm run db:push` e `npm run db:seed`. Para migrar personagens antigos:
`update characters set class_key='fisica' where class_key='exatas'; update characters set class_key='historia' where class_key='humanas'; update characters set class_key='portugues' where class_key='linguagens';`
Imagens: `class_<chave>_0N.png` com as chaves matematica, fisica, quimica, portugues, literatura, ingles, artes, historia, geografia, filosofia, biologia.
