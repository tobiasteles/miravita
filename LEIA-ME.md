# Painel /admin

Pré-requisito: o pacote "sem Clerk" já aplicado (o painel usa o login novo).

1. Extraia por cima do projeto.
2. `.env.local`: `ADMIN_EMAILS=seu@email.com` (e o mesmo na Vercel).
3. `npm run db:push` (cria 4 tabelas e 3 colunas novas; se perguntar "created or renamed", escolha create).
4. `npm run dev` e abra http://localhost:3000/admin
