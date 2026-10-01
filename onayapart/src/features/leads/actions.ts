"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";

/** Siteden gelen talebi "ilgilenildi" olarak isaretler. */
export async function handleLead(formData: FormData) {
  await requirePanel("talepler");
  await prisma.lead.update({ where: { id: str(formData, "id") }, data: { handled: true } });
  revalidatePath("/panel", "layout");
}
