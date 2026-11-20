"use client";
import { buttonClass } from "@/components/ui/Button";
import LangSwitch from "@/components/LangSwitch";
import { useT } from "@/i18n/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/actions/auth";
type View = null | "menu" | "settings";
export default function EscMenu() {
  const { t } = useT();
  const [v, setV] = useState<View>(null);
  const r = useRouter();
  const [s, setS] = useState({
    sound: 70,
    graphics: "alta",
    notifications: true,
    scene3d: true,
  });
  useEffect(() => {
    try {
      const x = localStorage.getItem("mv_settings");
      if (x) setS(JSON.parse(x));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mv_settings", JSON.stringify(s));
    } catch {}
  }, [s]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setV((x) => (x ? null : "menu"));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const btn = `${buttonClass("primary")} w-full`;
  return (
    <>
      {/* botão do menu: só os três pontinhos (a tecla Esc continua abrindo e fechando o menu) */}
      <button
        onClick={() => setV("menu")}
        aria-label={t("menu.open")}
        title={t("menu.open")}
        className="fixed right-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full border border-violet-800 bg-[#171433]/90 text-violet-200 transition hover:border-violet-400 hover:text-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="9" cy="3" r="1.8" />
          <circle cx="9" cy="9" r="1.8" />
          <circle cx="9" cy="15" r="1.8" />
        </svg>
      </button>
      {v && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setV(null)}
        >
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-sm space-y-2 rounded-xl border border-violet-600 bg-[#171433] p-4"
          >
            {v === "menu" ? (
              <>
                <h2 className="text-lg font-bold">{t("menu.pause")}</h2>
                <button className={btn} onClick={() => setV("settings")}>
                  ⚙️ {t("menu.settings")}
                </button>
                <button
                  className={btn}
                  onClick={() => {
                    setV(null);
                    r.push("/characters");
                  }}
                >
                  👥 {t("menu.characters")}
                </button>
                <button
                  className={btn + " !bg-rose-600"}
                  onClick={() => logout()}
                >
                  🚪 {t("menu.logout")}
                </button>
                <button
                  className="w-full rounded border border-violet-800 p-2"
                  onClick={() => setV(null)}
                >
                  {t("menu.back")}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">{t("menu.settings")}</h2>
                <label className="block">
                  {t("menu.sound", { n: s.sound })}
                  <input
                    type="range"
                    className="w-full"
                    value={s.sound}
                    onChange={(e) => setS({ ...s, sound: +e.target.value })}
                  />
                </label>
                <label className="block">
                  {t("menu.graphics")}
                  <select
                    className="w-full rounded bg-[#0c0a1f] p-2"
                    value={s.graphics}
                    onChange={(e) => setS({ ...s, graphics: e.target.value })}
                  >
                    <option value="baixa">{t("menu.low")}</option>
                    <option value="alta">{t("menu.high")}</option>
                  </select>
                </label>
                <label className="block">
                  <input
                    type="checkbox"
                    checked={s.notifications}
                    onChange={(e) =>
                      setS({ ...s, notifications: e.target.checked })
                    }
                  />{" "}
                  {t("menu.notifications")}
                </label>
                <label className="block">
                  <input
                    type="checkbox"
                    checked={s.scene3d !== false}
                    onChange={(e) => setS({ ...s, scene3d: e.target.checked })}
                  />{" "}
                  {t("menu.scene3d")}
                </label>
                <LangSwitch />
                <button className={btn} onClick={() => setV("menu")}>
                  {t("menu.back")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
