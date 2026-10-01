/**
 * Resend API (resend.com) uzerinden e-posta gonderimi. SDK kurmadan, dogrudan
 * fetch ile - basit, guvenilir bir REST API oldugu icin ek bagimliliga gerek yok.
 */
export type EmailResult = { ok: boolean; error?: string };

export async function sendEmail(
  settings: { emailEnabled: boolean; emailApiKey: string; emailFrom: string },
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  if (!settings.emailEnabled || !settings.emailApiKey || !settings.emailFrom) {
    return { ok: false, error: "E-posta bildirimi kapalı." };
  }
  if (!to) return { ok: false, error: "Geçersiz e-posta adresi." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: settings.emailFrom, to, subject, html }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text.slice(0, 300) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}
