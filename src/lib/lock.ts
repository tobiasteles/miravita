// Uma ação por vez para cada personagem.
// As ações do jogo leem o estado, calculam e gravam. Com requisições em paralelo (duas abas, um script),
// todas leriam o mesmo saldo e o jogador pagaria uma vez e levaria várias. Esta trava curta (lease de 15 s
// na tabela action_locks) serializa as ações do mesmo personagem; as demais esperam a sua vez.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getActiveCharacter } from "@/lib/session";
type Active = Awaited<ReturnType<typeof getActiveCharacter>>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function acquire(cid: string) {
  try {
    for (let i = 0; i < 12; i++) {
      const r = await db.execute(sql`insert into action_locks (character_id, until) values (${cid}, now() + interval '15 seconds')
        on conflict (character_id) do update set until = excluded.until where action_locks.until < now() returning character_id`);
      if (r.rows.length) return true;
      await sleep(120 + Math.random() * 120);
    }
    return false; // ocupado por mais de ~2 s: descarta esta chamada
  } catch (e) {
    console.error("action_locks indisponível (rodou migracao-seguranca.sql?)", e);
    return true; // não derruba o jogo se a tabela ainda não existe
  }
}
// Roda `fn` com o personagem ativo (já relido DEPOIS de pegar a trava, então os números estão frescos).
// Sem personagem ativo, chama fn(null) e a função decide (redirecionar, ignorar...).
export async function withChar<T>(fn: (a: Active) => Promise<T>): Promise<T | undefined> {
  const first = await getActiveCharacter();
  if (!first) return fn(null);
  const cid = first.c.id;
  if (!(await acquire(cid))) return undefined;
  try {
    return await fn(await getActiveCharacter());
  } finally {
    await db.execute(sql`delete from action_locks where character_id = ${cid}`).catch(() => {});
  }
}
