"use client";
import { usePathname } from "next/navigation";
import { setLanguage } from "@/actions/lang";
import { LANGS } from "@/i18n/core";
import { useT } from "@/i18n/client";

// seletor de idioma (menu, entrar/criar conta): troca na hora e volta para a mesma página
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, t } = useT();
  const path = usePathname();
  return (
    <form action={setLanguage} className={className}>
      <input type="hidden" name="next" value={path} />
      <label className="flex items-center gap-2 text-xs text-violet-300">
        {t("lang.label")}
        <select
          name="lang"
          defaultValue={lang}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded border border-violet-700 bg-[#0c0a1f] px-2 py-1 text-violet-100"
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>{t(`lang.${l}`)}</option>
          ))}
        </select>
      </label>
    </form>
  );
}
