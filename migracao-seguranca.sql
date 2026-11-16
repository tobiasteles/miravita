-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO DA REVISÃO DE SEGURANÇA  (rode no SQL Editor do Neon)
-- ORDEM: 1) este arquivo  2) npm run db:push (deve dizer que não há mudanças)  3) faça o deploy
-- Pode rodar mais de uma vez (tudo usa IF NOT EXISTS). Faça um backup antes (no Neon: crie uma "branch").
-- ═══════════════════════════════════════════════════════════════

-- 1) Sessões no servidor (sair/trocar senha agora invalida o cookie). Todo mundo precisa entrar de novo uma vez.
create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamp not null,
  created_at timestamp not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);

-- 2) Trava por personagem (uma ação por vez) e contador de tentativas (login, cadastro, chat)
create table if not exists action_locks (character_id uuid primary key, until timestamp not null);
create table if not exists rate_limits (key text primary key, count integer not null default 0, reset_at timestamp not null);

-- 3) Moderação do chat: denúncias e silenciar personagem
create table if not exists chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references characters(id) on delete cascade,
  message_id uuid not null references chat_messages(id) on delete cascade,
  reason text,
  resolved boolean not null default false,
  created_at timestamp not null default now()
);
create unique index if not exists chat_reports_unique on chat_reports(reporter_id, message_id);
alter table characters add column if not exists muted_until timestamp;

-- 4) Guilda por convite (null = aberta)
alter table guilds add column if not exists invite_code text;

-- 5) Rede de segurança no banco: ouro e quantidade nunca negativos
update characters set gold = 0 where gold < 0;
update inventory  set quantity = 0 where quantity < 0;
do $$ begin
  alter table characters add constraint characters_gold_nonneg check (gold >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table inventory add constraint inventory_quantity_nonneg check (quantity >= 0);
exception when duplicate_object then null; end $$;

-- 6) Conferência (opcional)
-- select count(*) from sessions;  select * from chat_reports limit 5;
