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
