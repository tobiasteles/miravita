import { redirect } from "next/navigation";
import { CONS, stack } from "@/lib/consumables";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { battles } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import { SKILLS, LOADOUT_SIZE } from "@/lib/game/classdata";
import { domBtn, type BState } from "@/lib/game/battle";
import { REALMS } from "@/lib/game/realms";
import { loadout4 } from "@/lib/game/loadout";
import { pvpNorm } from "@/lib/game/pvp";
import BattleScreen from "@/components/game/BattleScreen";
import BattleIntro from "@/components/game/BattleIntro";
import { mapLabel, monsterName, realmName, realmTagline, skillName } from "@/i18n/content";
import { skillDesc } from "@/i18n/skills";
import { subset } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n/server";
export const dynamic = "force-dynamic";
export default async function Battle() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { lang, t } = await getT();
  const [row] = await db.select().from(battles).where(eq(battles.characterId, a.c.id));
  if (!row) redirect("/play");
  const P = await loadPlayer(a.c.id), cls = P.k.key;
  const ph = await stack(a.c.id, CONS.hp.name); // estoque real de Poção de HP
  const pe = await stack(a.c.id, CONS.ea.name); // estoque real de Poção de EA
  const st = row.state as BState, RM = REALMS[st.mapSlug];
  const Q = st.e.pvp ? pvpNorm(P.q, P.c.level) : P.q; // Arena: status normalizados
  const intro = st.wave === 1 && !st.over && st.log.length <= 2; // só na entrada da luta (não em cada etapa)
  // os 4 poderes equipados (loadout) com custo real de EA (% da EA máxima) e requisitos
  const skills = loadout4(P.kit.loadout)
    .filter((i) => i >= 0 && P.kit.learned.includes(i) && SKILLS[cls]?.[i])
    .slice(0, LOADOUT_SIZE)
    .map((i) => {
      const s = SKILLS[cls][i];
      return {
        i, n: skillName(lang, cls, i, s.n), lv: s.lv, pa: s.pa, t: s.t, d: skillDesc(lang, s),
        c: s.allMp ? 0 : s.c > 0 ? Math.max(1, Math.round((Q.mp * s.c) / 100)) : 0,
        req: s.req ? { i: s.req.i, n: s.req.n, name: skillName(lang, cls, s.req.i, SKILLS[cls][s.req.i].n) } : null,
      };
    });
  return (
    <I18nProvider lang={lang} dict={subset(lang, "battle.")}>
      {intro && (
        <BattleIntro
          realm={st.dungeon}
          title={st.pvp ? t("intro.pvp") : st.dungeon ? (RM ? realmName(lang, RM.name) : t("play.realmDefault")) : st.ambush ? t("intro.ambush") : a.map ? mapLabel(lang, a.map.slug, a.map.name) : t("intro.hunt")}
          tagline={st.pvp ? t("intro.pvpTag") : st.dungeon ? t("intro.realmTag", { tagline: RM ? realmTagline(lang, RM.name, RM.tagline) : "" }) : st.ambush ? t("intro.ambushTag") : t("intro.huntTag")}
          foe={t("intro.foe", { name: monsterName(lang, st.e.n, st.e.ne), n: st.e.L })}
        />
      )}
      <BattleScreen
        b={st}
        p={{
          av: P.c.avatarId, cls, name: P.c.name, hp: P.c.hp, mhp: Q.hp, mp: P.c.mp, mmp: Q.mp, lv: P.c.level,
          skills, pam: Q.pam, cost: 0,
          pots: { hp: ph.row?.quantity ?? 0, ea: pe.row?.quantity ?? 0 },
          dom: domBtn(cls, P.c.domain, P.c.level, P.c.mp, Q.mp, st),
        }}
      />
    </I18nProvider>
  );
}
