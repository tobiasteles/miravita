# Revisão de segurança — o que mudou

## Antes do deploy (ordem importa)
1. No Neon, crie uma *branch* de backup e rode **`migracao-seguranca.sql`** no SQL Editor.
2. `npm install` e `npm run db:push` (deve dizer que não há mudanças).
3. Na Vercel, confira `AUTH_SECRET` (32+ caracteres) e **`CRON_SECRET` (16+ caracteres)**; sem a segunda, os crons passam a recusar tudo.
4. Deploy. Todo mundo precisará **entrar de novo uma vez** (as sessões agora ficam no banco).
5. Teste com `npm test` e navegue pelo jogo. Se algo não carregar (imagem, áudio), ponha `CSP_MODE=report-only` e veja o console.

## Correções
| # | Problema | Correção |
|---|----------|----------|
| 1 | Requisições em paralelo duplicavam itens e ouro (loja, forja, poções, escavação, expedição, laboratório) | `src/lib/lock.ts`: uma ação por vez por personagem; todas as ações do jogador passam por `withChar`. Rede de segurança no banco: `gold >= 0` e `quantity >= 0` |
| 2 | `rest()` curava no meio da luta (e passava do HP normalizado na Arena) | Bloqueado com luta em andamento (`hasActiveBattle`); `startBattle`, viagem, `challenge` e `practice` também respeitam |
| 3 | Cron aceitava `Bearer undefined` sem `CRON_SECRET` | `src/lib/cron-auth.ts`: exige segredo de 16+ caracteres, comparação em tempo constante |
| 4 | Login sem limite real e e-mails revelados | Limite por IP e e-mail (só falhas contam), mensagem única, hash "de mentira" para igualar o tempo; cadastro limitado por IP; senha de 8 a 128 caracteres |
| 5 | Sessão sem revogação | Tabela `sessions`; sair e trocar a senha (`set-password.ts`) apagam as sessões |
| 6 | Fugir de duelo da Arena não custava rating; ranking só inflava; combinar vitórias | Sair do duelo = derrota; o defensor muda metade do delta; máx. 3 duelos/dia contra o mesmo jogador |
| 7 | Guilda aberta a todos, sem expulsão; alts somavam bônus de grupo | Código de convite, limite de 30, expulsar, passar liderança, líder não se rebaixa; bônus de grupo só conta contas diferentes; sair da guilda tira do grupo |
| 8 | Quantidade fracionária na loja | `Math.floor` |
| 9 | Sem cabeçalhos de segurança; cookie `mv_char` sem `secure` | CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS; cookie `secure` |
| 10 | Chat sem moderação, limite por personagem, sem retenção | Filtro (palavrões, links, contatos), limite por conta, denunciar/bloquear, `/admin/denuncias` com silenciar, JSON inválido → 400, cron de limpeza diária |

Também: `@google/genai` fixado em 2.27.0, `.gitignore` cobre `.env*` e `.vercel`, README atualizado, prompt do cron de balanceamento com as 10 classes reais, ação `battleAct` valida o formato do comando e há testes em `tests/`.

## Ainda não feito (precisa de decisão ou serviço externo)
- **Verificação de e-mail e "esqueci a senha"**: exige provedor de e-mail (ex.: Resend). Por enquanto: `npx tsx src/db/set-password.ts email NovaSenha`.
- **Captcha** no cadastro (Cloudflare Turnstile) se aparecerem contas falsas em massa.
- **CSP sem `unsafe-inline`** (com nonce): exige ajustes no Next; a política atual já bloqueia scripts externos, iframes e envio de formulários para fora.
- Teste de carga/concorrência contra um banco real: recomendo disparar 20 compras em paralelo no ambiente de testes para confirmar que só uma passa.
