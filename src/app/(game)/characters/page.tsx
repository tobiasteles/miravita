import SafeImg from "@/components/game/SafeImg";
import { CLASS_NAME, CLASS_KEYS, CLASS_DEFS, BLOCKS } from "@/lib/game/classes";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, traits } from "@/db/schema";
import {
  createCharacter,
  deleteCharacter,
  selectCharacter,
} from "@/actions/character";
const AV = CLASS_KEYS.flatMap((c) => [1, 2, 3].map((i) => `class_${c}_0${i}`));
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  const { error } = await searchParams;
  const list = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId!));
  const tr = await db.select().from(traits);
  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Seus personagens ({list.length}/6)</h1>
      {error && <p className="text-rose-400">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-violet-900 bg-[#171433] p-3"
          >
            <SafeImg
              src={`/avatars/${c.avatarId}.png`}
              alt={c.avatarId}
              className="mb-2 h-14 w-14 rounded-full bg-violet-950"
            />
            <b>{c.name}</b>
            <div className="text-sm text-violet-300">
              {CLASS_NAME[c.classKey]} · Nv. {c.level}
            </div>
            <form action={selectCharacter}>
              <input type="hidden" name="id" value={c.id} />
              <button className="mt-2 rounded bg-violet-600 px-3 py-1">
                Jogar
              </button>
            </form>
            <form action={deleteCharacter}>
              <input type="hidden" name="id" value={c.id} />
              <button className="mt-1 text-xs text-rose-400">Excluir</button>
            </form>
          </div>
        ))}
      </div>
      {list.length < 6 && (
        <form
          action={createCharacter}
          className="space-y-3 rounded-lg border border-violet-900 bg-[#171433] p-4"
        >
          <h2 className="font-semibold">Novo personagem</h2>
          <input
            name="name"
            required
            minLength={3}
            maxLength={16}
            placeholder="Nome único"
            className="w-full rounded bg-[#0c0a1f] p-2"
          />
          <select name="cls" className="w-full rounded bg-[#0c0a1f] p-2">
            {BLOCKS.map(([bl, label]) => (
              <optgroup key={bl} label={label}>
                {CLASS_KEYS.filter((k) => CLASS_DEFS[k].block === bl).map(
                  (k) => (
                    <option key={k} value={k}>
                      {CLASS_DEFS[k].name}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
          <select name="avatar" className="w-full rounded bg-[#0c0a1f] p-2">
            {AV.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <fieldset className="flex flex-wrap gap-3 text-sm">
            {tr.map((t) => (
              <label key={t.id}>
                <input type="checkbox" name="traits" value={t.id} /> {t.name} (
                {t.description})
              </label>
            ))}
            <span className="text-violet-400">máx. 2</span>
          </fieldset>
          <button className="rounded bg-violet-600 px-4 py-2 font-semibold">
            Criar
          </button>
        </form>
      )}
    </main>
  );
}
