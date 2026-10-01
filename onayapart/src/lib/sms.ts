/**
 * NetGSM REST v2 API uzerinden SMS gonderimi (https://api.netgsm.com.tr/sms/rest/v2).
 * Basit HTTP Basic Auth kullanir, SDK gerektirmez.
 *
 * NOT: "Password" alani NetGSM panelindeki normal giris sifreniz DEGIL - panelde
 * ayrica olusturmaniz gereken bir "API sifresi"dir. "Header" (basim) ise NetGSM'in
 * onaylamasi gereken gonderici adidir; onaysiz bir baslikla gonderim calismaz.
 */
export type SmsResult = { ok: boolean; error?: string };

export async function sendSms(
  settings: { smsEnabled: boolean; smsUserCode: string; smsPassword: string; smsHeader: string },
  phoneDigits: string,
  message: string
): Promise<SmsResult> {
  if (!settings.smsEnabled || !settings.smsUserCode || !settings.smsPassword || !settings.smsHeader) {
    return { ok: false, error: "SMS bildirimi kapalı." };
  }
  if (!phoneDigits) return { ok: false, error: "Geçersiz telefon numarası." };

  // NetGSM 10 haneli yerel format bekler (5xxxxxxxxx), basimizdaki 90'i atiyoruz.
  const local = phoneDigits.startsWith("90") ? phoneDigits.slice(2) : phoneDigits;

  try {
    const auth = Buffer.from(`${settings.smsUserCode}:${settings.smsPassword}`).toString("base64");
    const res = await fetch("https://api.netgsm.com.tr/sms/rest/v2/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgheader: settings.smsHeader,
        encoding: "TR",
        messages: [{ msg: message, no: local }],
      }),
    });

    const text = await res.text();
    if (!res.ok) return { ok: false, error: text.slice(0, 300) };

    // NetGSM basarili gonderimde genelde "00" ile baslayan bir kod doner; baska bir
    // kod donerse hata mesaji olarak gosteriyoruz ki panelden ne oldugu anlasilsin.
    let parsed: { code?: string; jobid?: string } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // duz metin donebilir, JSON degilse yoksay
    }
    if (parsed?.code && parsed.code !== "00") {
      return { ok: false, error: `NetGSM hata kodu: ${parsed.code}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}
