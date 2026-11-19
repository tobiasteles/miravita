-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO DO IDIOMA (Fase 2 — português/inglês)  (rode no SQL Editor do Neon)
-- ORDEM: 1) este arquivo  2) npm run db:push (deve dizer que não há mudanças)  3) faça o deploy
-- Pode rodar mais de uma vez (usa IF NOT EXISTS). Faça um backup antes (no Neon: crie uma "branch").
-- ═══════════════════════════════════════════════════════════════

-- Idioma preferido da conta ('pt-BR' ou 'en'). Null = ainda não escolheu (vale o cookie mv_lang do navegador).
alter table users add column if not exists language text;
