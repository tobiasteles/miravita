import { ClerkProvider } from "@clerk/nextjs"; import { Cinzel } from "next/font/google"; import "./globals.css";
const brand = Cinzel({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-brand" });
export const metadata = { metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"), title: "Miravita — Desperte o seu poder", description: "MMORPG de navegador: caçadores, portais, calabouços e a sua própria técnica suprema.", openGraph: { title: "Miravita", description: "Desperte o seu poder." } };
export default function Root({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><html lang="pt-BR" className={brand.variable}><body className="min-h-screen pb-6">{children}</body></html></ClerkProvider>;
}
