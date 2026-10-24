import Link from "next/link";
import { LogoStack } from "@/components/brand/Brand";

// formulário simples de entrar/criar conta (servidor; usa as ações de src/actions/auth.ts)
export default function AuthForm({ mode, action, error, next }: { mode: "in" | "up"; action: (fd: FormData) => void | Promise<void>; error?: string; next?: string }) {
  const inp = "w-full rounded-lg border border-violet-700 bg-[#0c0a1f] px-3 py-2 outline-none focus:border-cyan-400";
  const up = mode === "up";
  return (
    <main className="mx-auto grid min-h-screen max-w-sm place-items-center p-6">
      <form action={action} className="w-full space-y-3 rounded-2xl border border-violet-700/60 bg-[#171433]/95 p-6 shadow-[0_0_40px_#8b5cf655]">
        <div className="flex justify-center"><LogoStack /></div>
        <h1 className="text-center text-xl font-bold">{up ? "Criar conta" : "Entrar"}</h1>
        {error && <p role="alert" className="rounded border border-rose-600 bg-rose-950/50 p-2 text-sm text-rose-200">{error}</p>}
        <input type="hidden" name="next" value={next ?? ""} />
        {up && <input name="name" placeholder="Nome de jogador (opcional)" maxLength={30} className={inp} autoComplete="nickname" />}
        <input name="email" type="email" required placeholder="Email" className={inp} autoComplete="email" />
        <input name="password" type="password" required minLength={up ? 8 : undefined} placeholder={up ? "Senha (mín. 8 caracteres)" : "Senha"} className={inp} autoComplete={up ? "new-password" : "current-password"} />
        {up && <input name="password2" type="password" required minLength={8} placeholder="Repita a senha" className={inp} autoComplete="new-password" />}
        <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 py-2 font-bold transition hover:scale-[1.02]">{up ? "Criar conta e jogar" : "Entrar"}</button>
        <p className="text-center text-sm text-violet-300">
          {up ? <>Já tem conta? <Link href="/sign-in" className="text-cyan-300 underline">Entrar</Link></> : <>Primeira vez? <Link href="/sign-up" className="text-cyan-300 underline">Criar conta</Link></>}
        </p>
      </form>
    </main>
  );
}
