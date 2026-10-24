// Define (ou troca) a senha de uma conta existente:  npx tsx src/db/set-password.ts email@exemplo.com NovaSenha123
// Cria a conta se o email ainda não existir. Serve para as contas antigas do Clerk e para recuperar senha.
import { config } from "dotenv"; config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless"; import { drizzle } from "drizzle-orm/neon-http"; import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import * as s from "./schema"; import { hashPassword } from "../lib/auth-hash";
const db = drizzle(neon(process.env.DATABASE_URL!));
async function main() {
  const [email, pw] = [process.argv[2]?.trim().toLowerCase(), process.argv[3]];
  if (!email || !pw || pw.length < 8) return console.log("Uso: npx tsx src/db/set-password.ts email senha(8+ caracteres)");
  const passwordHash = await hashPassword(pw), [u] = await db.select().from(s.users).where(eq(s.users.email, email));
  if (u) await db.update(s.users).set({ passwordHash }).where(eq(s.users.id, u.id));
  else await db.insert(s.users).values({ id: randomUUID(), email, passwordHash });
  console.log(u ? `Senha de ${email} atualizada.` : `Conta ${email} criada.`);
}
main();
