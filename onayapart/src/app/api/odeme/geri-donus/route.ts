import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import { site } from "@/shared/lib/site";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { retrieveCheckoutForm } from "@/features/payments/iyzico";

const redirectTo = (query: string) => NextResponse.redirect(`${site.url}/musteri?${query}`, { status: 303 });

/**
 * iyzico odeme tamamlandiktan sonra misafirin tarayicisini bu adrese (POST) geri
 * gonderir. Odeme sonucu ASLA bu yonlendirmeye guvenerek degil, token ile
 * iyzico'dan tekrar sorgulanarak dogrulanir - sahtecilige karsi zorunlu bir adim.
 */
export async function POST(req: Request) {
  const token = String((await req.formData()).get("token") ?? "");
  if (!token) return redirectTo("hata=odeme-token-yok");

  const attempt = await prisma.onlinePaymentAttempt.findUnique({ where: { token } });
  if (!attempt) return redirectTo("hata=odeme-bulunamadi");
  if (attempt.status === "BASARILI") return redirectTo("ok=odeme");

  const settings = await getIntegrationSettings();
  if (!settings.iyzicoApiKey || !settings.iyzicoSecretKey) return redirectTo("hata=odeme-ayar-yok");

  const result = await retrieveCheckoutForm(settings, token, attempt.conversationId);
  // Tahsil edilen tutar baslattigimiz tutardan az olamaz (taksit farki nedeniyle fazla olabilir).
  const amountMatches = result.ok && Number(result.paidPrice ?? attempt.amount) >= attempt.amount - 0.01;

  if (!result.ok || !result.paid || !amountMatches) {
    await prisma.onlinePaymentAttempt.updateMany({
      where: { token, status: "BEKLIYOR" },
      data: { status: "BASARISIZ", errorMessage: result.ok ? "Ödeme tamamlanmadı." : result.error, completedAt: new Date() },
    });
    return redirectTo("hata=odeme-basarisiz");
  }

  // Cift tahsilat korumasi: deneme yalnizca BEKLIYOR/BASARISIZ durumundan bir kez
  // BASARILI'ya gecer; ayni geri donus iki kez gelse de tek Payment olusur.
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.onlinePaymentAttempt.updateMany({
      where: { token, status: { not: "BASARILI" } },
      data: { status: "BASARILI", iyzicoPaymentId: result.paymentId ?? null, errorMessage: null, completedAt: new Date() },
    });
    if (count === 0) return;

    await tx.payment.create({
      data: {
        reservationId: attempt.reservationId,
        amount: attempt.amount,
        method: "KART",
        accountId: settings.iyzicoDefaultAccountId ?? null,
        note: `Online ödeme (iyzico) — işlem no: ${result.paymentId ?? token}`,
      },
    });
  });

  return redirectTo("ok=odeme");
}
