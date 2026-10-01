import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { retrieveCheckoutForm } from "@/features/payments/iyzico";
import { site } from "@/shared/lib/site";

/**
 * iyzico odeme tamamlandiktan sonra misafirin taraycisini bu adrese (POST) geri
 * gonderir. Odeme sonucu ASLA bu yonlendirmeye guvenerek degil, token ile
 * iyzico'dan tekrar sorgulanarak dogrulanir - bu, sahtecilige karsi zorunlu bir adim.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");

  const redirectTo = (path: string) => NextResponse.redirect(`${site.url}${path}`, { status: 303 });

  if (!token) return redirectTo("/musteri?hata=odeme-token-yok");

  const attempt = await prisma.onlinePaymentAttempt.findUnique({ where: { token } });
  if (!attempt) return redirectTo("/musteri?hata=odeme-bulunamadi");

  // Ayni odeme daha once basariyla isaretlendiyse tekrar Payment olusturma (cift tahsilat koruma).
  if (attempt.status === "BASARILI") return redirectTo("/musteri?ok=odeme");

  const settings = await getIntegrationSettings();
  if (!settings.iyzicoApiKey || !settings.iyzicoSecretKey) return redirectTo("/musteri?hata=odeme-ayar-yok");

  const result = await retrieveCheckoutForm(
    { iyzicoApiKey: settings.iyzicoApiKey, iyzicoSecretKey: settings.iyzicoSecretKey, iyzicoSandbox: settings.iyzicoSandbox },
    token,
    attempt.conversationId
  );

  if (!result.ok || !result.paid) {
    await prisma.onlinePaymentAttempt.update({
      where: { token },
      data: { status: "BASARISIZ", errorMessage: !result.ok ? result.error : "Ödeme tamamlanmadı.", completedAt: new Date() },
    });
    return redirectTo("/musteri?hata=odeme-basarisiz");
  }

  await prisma.$transaction([
    prisma.onlinePaymentAttempt.update({
      where: { token },
      data: { status: "BASARILI", iyzicoPaymentId: result.paymentId ?? null, completedAt: new Date() },
    }),
    prisma.payment.create({
      data: {
        reservationId: attempt.reservationId,
        amount: attempt.amount,
        method: "KART",
        accountId: settings.iyzicoDefaultAccountId ?? null,
        note: `Online ödeme (iyzico) — işlem no: ${result.paymentId ?? token}`,
      },
    }),
  ]);

  return redirectTo("/musteri?ok=odeme");
}
