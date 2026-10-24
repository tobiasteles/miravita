"use server";
import { getUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { balanceSuggestions, users } from "@/db/schema";
// admin = id em ADMIN_USER_IDS ou email em ADMIN_EMAILS (no .env.local, separados por vírgula)
export async function isAdmin() {
  const userId = await getUserId();
  if (!userId) return false;
  const list = (v?: string) => (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list(process.env.ADMIN_USER_IDS).includes(userId.toLowerCase())) return true;
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  return !!u && list(process.env.ADMIN_EMAILS).includes(u.email.toLowerCase());
}
export async function setStatus(fd: FormData) {
  if (!(await isAdmin())) return;
  const status = fd.get("status") === "aplicada" ? "aplicada" : "rejeitada";
  await db
    .update(balanceSuggestions)
    .set({ status })
    .where(eq(balanceSuggestions.id, String(fd.get("id"))));
  revalidatePath("/admin/balance");
}
