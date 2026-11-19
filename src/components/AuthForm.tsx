import Link from "next/link";
import { LogoStack } from "@/components/brand/Brand";
import LangSwitch from "@/components/LangSwitch";
import { errKey } from "@/i18n";
import { getT } from "@/i18n/server";

// formulário simples de entrar/criar conta (servidor; usa as ações de src/actions/auth.ts)
export default async function AuthForm({ mode, action, error, next }: { mode: "in" | "up"; action: (fd: FormData) => void | Promise<void>; error?: string; next?: string }) {
  const inp = "w-full rounded-lg border border-violet-700 bg-[#0c0a1f] px-3 py-2 outline-none focus:border-cyan-400";
  const up = mode === "up";
  const { t } = await getT(), ek = errKey(error);
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-sm place-items-center p-4 sm:p-6">
      <form action={action} className="w-full min-w-0 space-y-3 overflow-hidden rounded-2xl border border-violet-700/60 bg-[#171433]/95 p-5 sm:p-6 shadow-[0_0_40px_#8b5cf655]">
        <div className="flex justify-center"><LogoStack size={96} /></div>
        <h1 className="text-center text-xl font-bold">{up ? t("auth.signUp") : t("auth.signIn")}</h1>
        {ek && <p role="alert" className="rounded border border-rose-600 bg-rose-950/50 p-2 text-sm text-rose-200">{t(ek)}</p>}
        <input type="hidden" name="next" value={next ?? ""} />
        {up && <input name="name" placeholder={t("auth.namePlaceholder")} maxLength={30} className={inp} autoComplete="nickname" />}
        <input name="email" type="email" required placeholder={t("auth.email")} className={inp} autoComplete="email" />
        <input name="password" type="password" required minLength={up ? 8 : undefined} placeholder={up ? t("auth.passwordNew") : t("auth.password")} className={inp} autoComplete={up ? "new-password" : "current-password"} />
        {up && <input name="password2" type="password" required minLength={8} placeholder={t("auth.passwordRepeat")} className={inp} autoComplete="new-password" />}
        <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 py-2 font-bold transition hover:scale-[1.02]">{up ? t("auth.submitUp") : t("auth.signIn")}</button>
        <p className="text-center text-sm text-violet-300">
          {up ? <>{t("auth.haveAccount")} <Link href="/sign-in" className="text-cyan-300 underline">{t("auth.signIn")}</Link></> : <>{t("auth.firstTime")} <Link href="/sign-up" className="text-cyan-300 underline">{t("auth.signUp")}</Link></>}
        </p>
        <LangSwitch className="flex justify-center" />
      </form>
    </main>
  );
}
