import { setLanguage } from "@/actions/lang";
import { LogoStack } from "@/components/brand/Brand";
import { suggestedLang } from "@/i18n/server";

export const metadata = { title: "Miravita — Language · Idioma" };

// Primeira visita (sem cookie mv_lang). Esta tela é BILÍNGUE de propósito: não depende do idioma escolhido.
// O Accept-Language do navegador só pré-seleciona uma opção; quem decide é o jogador.
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams, sug = await suggestedLang();
  const opts = [
    { v: "pt-BR", name: "Português (BR)", sub: "Jogar em português" },
    { v: "en", name: "English", sub: "Play in English" },
  ];
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-sm place-items-center p-4 sm:p-6">
      <form action={setLanguage} className="w-full space-y-4 rounded-2xl border border-violet-700/60 bg-[#171433]/95 p-6 shadow-[0_0_40px_#8b5cf655]">
        <div className="flex justify-center"><LogoStack size={96} /></div>
        <h1 className="text-center text-xl font-bold">Escolha o idioma · Choose your language</h1>
        <input type="hidden" name="next" value={next ?? "/"} />
        <div className="space-y-2" role="radiogroup">
          {opts.map((o) => (
            <label key={o.v} className="block cursor-pointer">
              <input type="radio" name="lang" value={o.v} defaultChecked={sug === o.v} className="peer sr-only" />
              <span className="block rounded-xl border-2 border-violet-800 p-3 transition peer-checked:border-cyan-400 peer-checked:bg-cyan-400/10 peer-focus-visible:outline-2 peer-focus-visible:outline-cyan-300">
                <b className="block text-lg">{o.name}</b>
                <span className="text-sm text-violet-300">{o.sub}</span>
              </span>
            </label>
          ))}
        </div>
        <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 py-2 font-bold transition hover:scale-[1.02]">Continuar · Continue</button>
        <p className="text-center text-xs text-violet-400">Você pode mudar depois no menu · You can change it later in the menu</p>
      </form>
    </main>
  );
}
