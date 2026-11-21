-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO DO CONTEÚDO EM INGLÊS (Fase 2, bloco 3) — monstros gerados pela IA  (rode no SQL Editor do Neon)
-- ORDEM: 1) migracao-idioma.sql (se ainda não rodou)  2) este arquivo  3) npm run db:push (deve dizer que não há mudanças)  4) deploy
-- Pode rodar mais de uma vez (IF NOT EXISTS). Faça um backup antes (no Neon: crie uma "branch").
-- ═══════════════════════════════════════════════════════════════

-- versão em inglês dos monstros da IA e do /admin. Null = o jogo usa o texto em português (nada quebra).
alter table ai_monsters add column if not exists name_en text;
alter table ai_monsters add column if not exists lore_en text;
alter table ai_monsters add column if not exists skill_name_en text;
