-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO DA GRANDE ATUALIZAÇÃO  (rode no SQL Editor do Neon)
-- ORDEM: 1) npm run db:push   2) ESTE ARQUIVO   3) npx tsx src/db/seed-update.ts
-- Faça um backup antes (no Neon: crie uma "branch" do banco).
-- ═══════════════════════════════════════════════════════════════

-- 1) A classe Literatura foi removida: quem era Literatura vira Ilusionista (Artes)
UPDATE characters  SET class_key = 'artes', avatar_id = replace(avatar_id, 'class_literatura_', 'class_artes_') WHERE class_key = 'literatura';
UPDATE battle_logs SET class_key = 'artes' WHERE class_key = 'literatura';
UPDATE items       SET class_restriction = NULL WHERE class_restriction = 'literatura';
DELETE FROM classes WHERE key = 'literatura';

-- 2) Quem já jogava: aprende de graça todos os poderes que o nível já liberava
--    e equipa os 4 mais altos (troque na Academia). Níveis dos 12 degraus: 1,8,20,35,50,70,90,110,130,150,170,190
UPDATE characters c SET kit = jsonb_build_object(
  'learned', (SELECT coalesce(jsonb_agg(i ORDER BY i), '[0]'::jsonb) FROM generate_series(0, 11) i
              WHERE (ARRAY[1,8,20,35,50,70,90,110,130,150,170,190])[i + 1] <= c.level),
  'loadout', (SELECT coalesce(jsonb_agg(i ORDER BY i DESC), '[0]'::jsonb) FROM (
                SELECT i FROM generate_series(0, 11) i
                WHERE (ARRAY[1,8,20,35,50,70,90,110,130,150,170,190])[i + 1] <= c.level
                ORDER BY i DESC LIMIT 4) t)
);

-- 3) Lutas em andamento usam o formato antigo: encerra todas (ninguém perde nada, só recomeça a luta)
DELETE FROM battles;

-- 4) Conferência (opcional)
-- SELECT name, class_key, level, kit FROM characters ORDER BY level DESC LIMIT 10;
