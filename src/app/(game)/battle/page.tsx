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
import { loadout4 } from "@/lib/game/classdata";
import BattleScreen from "@/components/game/BattleScreen";
import BattleIntro from "@/components/game/BattleIntro";
export const dynamic = "force-dynamic";
export default async function Battle() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const [row] = await db
    .select()
    .from(battles)
    .where(eq(battles.characterId, a.c.id));
  if (!row) redirect("/play");
  const P = await loadPlayer(a.c.id),
    cls = P.k.key;
  const ph = await stack(a.c.id, CONS.hp.name); // estoque real de Poção de HP
  const pe = await stack(a.c.id, CONS.ea.name); // estoque real de Poção de EA
  const st = row.state as BState,
    RM = REALMS[st.mapSlug];
  const intro = st.wave === 1 && !st.over && st.log.length <= 2; // só na entrada da luta (não em cada etapa)
  // os 4 poderes equipados (loadout) com custo real de EA (% da EA máxima) e requisitos
  const skills = loadout4(P.kit.loadout)
    .filter((i) => i >= 0 && P.kit.learned.includes(i) && SKILLS[cls]?.[i])
    .slice(0, LOADOUT_SIZE)
    .map((i) => {
      const s = SKILLS[cls][i];
      return {
        i,
        n: s.n,
        lv: s.lv,
        pa: s.pa,
        t: s.t,
        d: s.d,
        c: s.allMp
          ? 0
          : s.c > 0
            ? Math.max(1, Math.round((P.q.mp * s.c) / 100))
            : 0,
        req: s.req
          ? { i: s.req.i, n: s.req.n, name: SKILLS[cls][s.req.i].n }
          : null,
      };
    });
  return (
    <>
      {intro && (
        <BattleIntro
          realm={st.dungeon}
          title={
            st.dungeon
              ? (RM?.name ?? "Reino")
              : st.ambush
                ? "Emboscada!"
                : (a.map?.name ?? "Caçada")
          }
          tagline={
            st.dungeon
              ? `${RM?.tagline ?? ""} · 4 etapas`
              : st.ambush
                ? "Você foi surpreendido na estrada!"
                : "Prepare-se para a luta!"
          }
          foe={`${st.e.n} (Nv. ${st.e.L})`}
        />
      )}
      <BattleScreen
        b={st}
        p={{
          av: P.c.avatarId,
          cls,
          name: P.c.name,
          hp: P.c.hp,
          mhp: P.q.hp,
          mp: P.c.mp,
          mmp: P.q.mp,
          lv: P.c.level,
          skills,
          pam: P.q.pam,
          cost: 0,
          pots: { hp: ph.row?.quantity ?? 0, ea: pe.row?.quantity ?? 0 },
          dom: domBtn(cls, P.c.domain, P.c.level, P.c.mp, P.q.mp, st),
        }}
      />
    </>
  );
}
