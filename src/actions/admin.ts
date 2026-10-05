"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { balanceSuggestions } from "@/db/schema";
export async function isAdmin() {
  const { userId } = await auth();
  return (
    !!userId &&
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .includes(userId)
  );
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
