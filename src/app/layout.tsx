import { ClerkProvider } from "@clerk/nextjs"; import "./globals.css";
export const metadata = { title: "Miravita" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><html lang="pt-BR"><body className="min-h-screen pb-52">{children}</body></html></ClerkProvider>;
}
