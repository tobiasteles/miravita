import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, traits } from "@/db/schema";
import { deleteCharacter, selectCharacter } from "@/actions/character";
import { CLASS_NAME } from "@/lib/game/classes";
import SafeImg from "@/components/game/SafeImg";
import CreateCharacter from "@/components/game/CreateCharacter";

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
      {error && list.length >= 6 && <p className="text-rose-400">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-violet-900 bg-[#171433] p-3"
          >
            <SafeImg
              src={`/avatars/${c.avatarId}.png`}
              alt={c.avatarId}
              className="mb-2 h-14 w-14 rounded-full bg-violet-950 object-cover"
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
        {/* key = nº de personagens: a janela fecha sozinha depois que o personagem é criado */}
        {list.length < 6 && (
          <CreateCharacter
            key={list.length}
            error={error}
            traits={tr.map(({ id, name, description }) => ({
              id,
              name,
              description,
            }))}
          />
        )}
      </div>
    </main>
  );
}
