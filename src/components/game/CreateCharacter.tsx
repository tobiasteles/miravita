"use client";
import { useState } from "react";
import { createCharacter } from "@/actions/character";
import { BLOCKS, CLASS_DEFS, CLASS_KEYS } from "@/lib/game/classes";
import SafeImg from "@/components/game/SafeImg";

type Trait = { id: string; name: string; description: string };

// botão "Criar personagem" + janela com o formulário (só aparece quando o jogador clica)
export default function CreateCharacter({
  traits,
  error,
}: {
  traits: Trait[];
  error?: string;
}) {
  const [open, setOpen] = useState(!!error); // se o servidor devolveu um erro, reabre a janela para mostrá-lo
  const [cls, setCls] = useState(CLASS_KEYS[0]);
  const [av, setAv] = useState(1);
  const [tr, setTr] = useState<string[]>([]);
  const toggle = (id: string) =>
    setTr((t) =>
      t.includes(id)
        ? t.filter((x) => x !== id)
        : t.length < 2
          ? [...t, id]
          : t,
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid min-h-[170px] place-items-center rounded-lg border-2 border-dashed border-violet-700 text-violet-300 transition hover:border-violet-400 hover:bg-violet-900/20 hover:text-white"
      >
        <span className="text-center">
          <span className="block text-4xl leading-none">+</span>
          <span className="mt-1 block">Criar personagem</span>
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            action={createCharacter}
            className="w-full max-w-lg space-y-3 rounded-xl border border-violet-600 bg-[#171433] p-5 shadow-[0_0_40px_#8b5cf655]"
          >
            <div className="flex items-center">
              <h2 className="flex-1 text-lg font-bold">Novo personagem</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded px-2 text-violet-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            {error && <p className="text-rose-400">{error}</p>}
            <input
              name="name"
              required
              minLength={3}
              maxLength={16}
              placeholder="Nome único"
              className="w-full rounded bg-[#0c0a1f] p-2"
            />
            <select
              name="cls"
              value={cls}
              onChange={(e) => {
                setCls(e.target.value);
                setAv(1);
              }}
              className="w-full rounded bg-[#0c0a1f] p-2"
            >
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
            <p className="text-xs text-violet-300">{CLASS_DEFS[cls].desc}</p>
            <div>
              <div className="mb-1 text-sm text-violet-300">Aparência</div>
              <div className="flex gap-3">
                {[1, 2, 3].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setAv(n)}
                    aria-label={`Aparência ${n}`}
                    aria-pressed={av === n}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 bg-violet-950 transition ${av === n ? "border-cyan-400 shadow-[0_0_16px_#22d3ee88]" : "border-violet-800 opacity-70 hover:opacity-100"}`}
                  >
                    <SafeImg
                      src={`/avatars/class_${cls}_0${n}.png`}
                      className="h-full w-full object-cover"
                      fallback={
                        <span className="grid h-full w-full place-items-center text-2xl text-violet-300">
                          {n}
                        </span>
                      }
                    />
                  </button>
                ))}
              </div>
              <input
                type="hidden"
                name="avatar"
                value={`class_${cls}_0${av}`}
              />
            </div>
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <legend className="mb-1 text-violet-300">
                Personalidade (até 2)
              </legend>
              {traits.map((t) => {
                const on = tr.includes(t.id),
                  lock = !on && tr.length >= 2;
                return (
                  <label key={t.id} className={lock ? "opacity-40" : ""}>
                    <input
                      type="checkbox"
                      name="traits"
                      value={t.id}
                      checked={on}
                      disabled={lock}
                      onChange={() => toggle(t.id)}
                    />{" "}
                    {t.name}{" "}
                    <span className="text-violet-400">({t.description})</span>
                  </label>
                );
              })}
            </fieldset>
            <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 py-2 font-bold">
              Criar personagem
            </button>
          </form>
        </div>
      )}
    </>
  );
}
