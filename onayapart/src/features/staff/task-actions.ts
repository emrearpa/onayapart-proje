"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { date, optStr, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { getCurrentActorLabel, logActivity } from "@/features/audit/activity-log";

// Kurum ici is/talimat takibi ("mudurluk notu"). Oda bakim islerinden ayridir.

const PAGE_PATH = "/panel/is-takibi";
const STATUSES = ["ACIK", "DEVAM_EDIYOR", "TAMAMLANDI"];

function done(result: string): never {
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?ok=${result}`);
}

export async function createStaffTask(formData: FormData) {
  await requirePanel("istakibi");
  const title = str(formData, "title");
  const message = str(formData, "message");
  if (!title || !message) redirect(`${PAGE_PATH}?hata=gorev-eksik`);

  const task = await prisma.staffTask.create({
    data: {
      title,
      message,
      assignedToId: optStr(formData, "assignedToId"),
      dueDate: date(formData, "dueDate"),
      createdByLabel: await getCurrentActorLabel(),
    },
    include: { assignedTo: true },
  });

  await logActivity("İş takibi notu bıraktı", `${title} · ${task.assignedTo?.fullName ?? "genel"}`);
  done("gorev-eklendi");
}

export async function addStaffTaskReply(formData: FormData) {
  await requirePanel("istakibi");
  const message = str(formData, "message");
  if (!message) redirect(`${PAGE_PATH}?hata=yanit-eksik`);

  await prisma.staffTaskReply.create({
    data: { taskId: str(formData, "taskId"), authorLabel: await getCurrentActorLabel(), message },
  });
  done("yanit-eklendi");
}

export async function updateStaffTaskStatus(formData: FormData) {
  await requirePanel("istakibi");
  const status = str(formData, "status");
  if (!STATUSES.includes(status)) redirect(PAGE_PATH);

  const task = await prisma.staffTask.update({ where: { id: str(formData, "taskId") }, data: { status } });
  await logActivity("İş takibi durumunu güncelledi", `${task.title} · ${status}`);
  done("durum-guncellendi");
}
