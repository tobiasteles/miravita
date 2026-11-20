import { Cinzel } from "next/font/google"; import type { Metadata } from "next"; import MusicPlayer from "@/components/game/MusicPlayer"; import { ToastProvider } from "@/components/ui/Toast"; import { I18nProvider } from "@/i18n/client"; import { subset } from "@/i18n"; import { getLang, getT } from "@/i18n/server"; import "./globals.css";
const brand = Cinzel({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-brand" });
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"), title: t("meta.title"), description: t("meta.description"), openGraph: { title: "Miravita", description: t("meta.ogDescription") } };
}
export default async function Root({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return <html lang={lang} className={brand.variable}><body className="min-h-screen pb-6"><I18nProvider lang={lang} dict={subset(lang, "common.", "lang.", "menu.", "stage.")}><ToastProvider>{children}</ToastProvider><MusicPlayer /></I18nProvider></body></html>;
}
