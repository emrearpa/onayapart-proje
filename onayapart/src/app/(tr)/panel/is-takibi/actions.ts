"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logActivity, getCurrentActorLabel } from "@/lib/activityLog";

export async function createStaffTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  if (!title || !message) redirect("/panel/is-takibi?hata=gorev-eksik");

  const createdByLabel = await getCurrentActorLabel();

  const task = await prisma.staffTask.create({
    data: { title, message, assignedToId, dueDate, createdByLabel },
    include: { assignedTo: true },
  });

  await logActivity(
    "İş takibi notu bıraktı",
    `${title}${task.assignedTo ? ` · ${task.assignedTo.fullName}` : " · genel"}`
  );
  revalidatePath("/panel/is-takibi");
  redirect("/panel/is-takibi?ok=gorev-eklendi");
}

export async function addStaffTaskReply(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!message) redirect("/panel/is-takibi?hata=yanit-eksik");

  const authorLabel = await getCurrentActorLabel();
  await prisma.staffTaskReply.create({ data: { taskId, authorLabel, message } });

  revalidatePath("/panel/is-takibi");
  redirect("/panel/is-takibi?ok=yanit-eklendi");
}

export async function updateStaffTaskStatus(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const status = String(formData.get("status") ?? "ACIK");

  const task = await prisma.staffTask.update({ where: { id: taskId }, data: { status } });

  await logActivity("İş takibi durumunu güncelledi", `${task.title} · ${status}`);
  revalidatePath("/panel/is-takibi");
  redirect("/panel/is-takibi?ok=durum-guncellendi");
}
