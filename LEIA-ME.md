# Grande atualização Miravita — como instalar

1. **Backup**: no Neon, crie uma *branch* do banco (ou exporte). Faça commit do projeto atual.
2. **Copie os arquivos**: extraia este zip por cima da pasta do projeto (a pasta `src/` daqui se junta à `src/` do projeto, sobrescrevendo os arquivos de mesmo nome).
3. **Colunas novas**: `npm run db:push` (cria `characters.kit` e `characters.activity`).
4. **Migração**: abra `migracao.sql` no SQL Editor do Neon e execute.
5. **Dados**: `npx tsx src/db/seed-update.ts` (atualiza as 10 classes e cadastra os 118 elementos).
6. `npm run dev` e teste (veja a lista de testes no chat).
