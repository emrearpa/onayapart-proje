"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { optStr, safeReturnPath, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { getCurrentActorLabel, logActivity } from "@/features/audit/activity-log";

// Bakim / ariza / temizlik gorevleri (Task). Hem panelden hem musteri panelinden
// acilabilir; personel notlariyla birlikte tamamlandi olarak kapatir.

const LIST_PATH = "/panel/bakim-talepleri";
const TASK_KINDS = ["TEMIZLIK", "BAKIM", "ARIZA"];

function revalidateTasks() {
  revalidatePath("/panel", "layout");
  revalidatePath("/", "layout");
}

export async function createTask(formData: FormData) {
  await requirePanel("bakim");
  const roomId = str(formData, "roomId");
  const title = str(formData, "title");
  const kind = str(formData, "kind");
  if (!roomId || !title) redirect(`${LIST_PATH}?hata=eksik`);

  await prisma.task.create({
    data: { roomId, kind: TASK_KINDS.includes(kind) ? kind : "ARIZA", title, message: optStr(formData, "message") },
  });
  revalidateTasks();
  redirect(`${LIST_PATH}?ok=eklendi`);
}

export async function closeTask(formData: FormData) {
  await requirePanel("bakim");
  const id = str(formData, "id");
  const back = safeReturnPath(str(formData, "back"), "/panel");
  const note = str(formData, "note");

  const task = await prisma.task.findUnique({ where: { id }, include: { room: true } });
  if (!task) redirect(back);
  const isCleaning = task.kind === "TEMIZLIK";
  const authorLabel = await getCurrentActorLabel();

  await prisma.$transaction([
    prisma.task.update({ where: { id }, data: { status: "TAMAMLANDI", closedAt: new Date() } }),
    ...(note ? [prisma.taskNote.create({ data: { taskId: id, note, kind: "TAMAMLANDI", authorLabel } })] : []),
    // Temizlik gorevi tamamlandiginda oda otomatik olarak musaitlige doner.
    ...(isCleaning ? [prisma.room.update({ where: { id: task.roomId }, data: { condition: "MUSAIT" } })] : []),
  ]);

  await logActivity(
    isCleaning ? "Temizliği tamamladı, oda müsaitliğe alındı" : "Bakım talebini tamamladı",
    note || `Oda ${task.room.number}`
  );
  revalidateTasks();
  redirect(back);
}

/** Bir goreve, acikken ya da kapaliyken, kalici bir ilerleme notu ekler. Notlar silinmez. */
export async function addTaskNote(formData: FormData) {
  await requirePanel("bakim");
  const back = safeReturnPath(str(formData, "back"), LIST_PATH);
  const note = str(formData, "note");
  if (!note) redirect(`${back}?hata=not-eksik`);

  await prisma.taskNote.create({
    data: { taskId: str(formData, "taskId"), note, kind: "ILERLEME", authorLabel: await getCurrentActorLabel() },
  });
  revalidateTasks();
  redirect(`${back}?ok=not-eklendi`);
}

export async function reopenTask(formData: FormData) {
  await requirePanel("bakim");
  await prisma.task.update({ where: { id: str(formData, "id") }, data: { status: "ACIK", closedAt: null } });
  revalidateTasks();
  redirect(`${LIST_PATH}?ok=yeniden-acildi`);
}
