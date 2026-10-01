import { prisma } from "@/shared/lib/db";
import { getRemindableCustomers } from "@/features/reservations/queries";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import ConfirmButton from "@/shared/components/ConfirmButton";
import {
  updateTemplate,
  createTemplate,
  deleteTemplate,
  updateIntegration,
  updateNotificationChannels,
  sendSingleMessage,
  sendSingleEmail,
  sendSingleSms,
  sendBulkMessage,
  sendPaymentReminders,
} from "@/features/messaging/actions";
import { requirePanel } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  GONDERILDI: "Gönderildi",
  LINK_HAZIRLANDI: "Link açıldı",
  HATA: "Hata",
};
const KIND_LABEL: Record<string, string> = {
  MANUEL: "Tekli",
  TOPLU: "Toplu",
  ODEME_HATIRLATMA: "Ödeme hatırlatma",
};

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; gonderildi?: string; hazir?: string };
}) {
  await requirePanel("bilgilendirme");
  const [templates, integration, guests, logs, remindable] = await Promise.all([
    prisma.messageTemplate.findMany({ orderBy: { sort: "asc" } }),
    getIntegrationSettings(),
    prisma.guest.findMany({
      orderBy: { createdAt: "desc" },
      include: { reservations: { orderBy: { checkIn: "desc" }, take: 1, include: { room: true } } },
    }),
    prisma.messageLog.findMany({ orderBy: { sentAt: "desc" }, take: 30, include: { guest: true } }),
    getRemindableCustomers(),
  ]);

  const apiActive = integration.waEnabled && Boolean(integration.waAccessToken) && Boolean(integration.waPhoneNumberId);
  const pendingReminders = remindable.items.filter((r) => !r.alreadyNotified);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Bilgilendirme</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Müşterilerinize tekli veya toplu WhatsApp mesajı gönderin, ödeme günü gelenlere hatırlatma yapın.
      </p>

      {searchParams.ok === "toplu" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Toplu gönderim tamamlandı. Gönderilen: {searchParams.gonderildi ?? 0}, hazırlanan link:{" "}
          {searchParams.hazir ?? 0}.
        </p>
      )}
      {searchParams.ok === "hatirlatma" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Hatırlatmalar işlendi. Gönderilen: {searchParams.gonderildi ?? 0}, hazırlanan link: {searchParams.hazir ?? 0}.
        </p>
      )}
      {searchParams.ok && searchParams.ok.endsWith("-gonderildi") && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Gönderildi.</p>
      )}
      {(searchParams.ok === "hata" || (searchParams.ok?.endsWith("-hata") ?? false)) && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Gönderim başarısız oldu. Ayarları ve bağlantı bilgilerini kontrol edip tekrar deneyin.
        </p>
      )}
      {searchParams.ok &&
        !["toplu", "hatirlatma", "hata"].includes(searchParams.ok) &&
        !searchParams.ok.endsWith("-gonderildi") &&
        !searchParams.ok.endsWith("-hata") && (
          <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Kaydedildi.</p>
        )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          İşlem tamamlanamadı, alanları kontrol edin.
        </p>
      )}

      {/* CALISMA MODU UYARISI */}
      <section className={`card mt-5 p-5 ${apiActive ? "border-brand-200 bg-brand-50/40" : "border-amber-200 bg-amber-50/40"}`}>
        <h2 className="font-extrabold tracking-tight">
          {apiActive ? "✅ Otomatik gönderim açık" : "⚠️ Şu an yarı otomatik modda"}
        </h2>
        {apiActive ? (
          <p className="mt-2 text-sm text-ink-soft">
            WhatsApp Business API bağlı. Mesajlar sistem tarafından doğrudan gönderiliyor.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            WhatsApp Business API bilgileri girilmediği için sistem mesajı <b>kendi kendine gönderemiyor</b>. Bunun
            yerine &quot;Gönder&quot; dediğinizde WhatsApp hazır mesajla açılıyor, siz tek tıkla yolluyorsunuz. Tam
            otomatik gönderim için Meta&apos;dan WhatsApp Business API hesabı ve onaylı mesaj şablonu almanız gerekir —
            bilgileri aşağıdaki bölüme girdiğinizde sistem otomatiğe geçer.
          </p>
        )}
      </section>

      {/* ODEME HATIRLATMALARI */}
      <section className="card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold tracking-tight">Ödeme günü gelen müşteriler</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Aylık, dönemlik, yıllık ve kurumsal konaklamalarda ödeme günü gelmiş/geçmiş ve borcu olanlar. Aynı
              müşteriye aynı ay içinde ikinci kez hatırlatma gönderilmez.
            </p>
          </div>
          {pendingReminders.length > 0 && apiActive && (
            <form action={sendPaymentReminders}>
              <button className="btn-primary">Tümüne hatırlatma gönder ({pendingReminders.length})</button>
            </form>
          )}
        </div>

        {remindable.items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Şu an ödeme günü gelen müşteri yok.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {remindable.items.map((r) => (
              <li key={r.reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div>
                  <div className="font-semibold">
                    {r.guest.fullName}
                    <span className="font-normal text-ink-soft"> · Oda {r.room.number}</span>
                    {r.reservation.stayType === "YILLIK" && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                        Yıllık taksit
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-soft">
                    {r.guest.phone} · Ödeme günü: {fmtDate(r.dueDate)} · Tutar: {fmtMoney(r.amount)}
                  </div>
                </div>
                {r.alreadyNotified ? (
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-600">
                    Bu ay bilgilendirildi
                  </span>
                ) : (
                  <form action={sendPaymentReminders}>
                    <input type="hidden" name="reservationId" value={r.reservation.id} />
                    <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">
                      {apiActive ? "Hatırlatma gönder" : "WhatsApp'ta aç"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* TOPLU GONDERIM */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Toplu mesaj gönder</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Mesaj metninde <code>{"{ad}"}</code>, <code>{"{oda}"}</code>, <code>{"{tutar}"}</code>,{" "}
          <code>{"{tarih}"}</code>, <code>{"{kod}"}</code> yazarsanız her müşteri için otomatik doldurulur.
          {!apiActive && " API kapalıyken toplu gönderim mesajları hazırlar ve kayda alır, ancak her birini elle göndermeniz gerekir."}
        </p>

        <form action={sendBulkMessage} className="grid gap-3">
          <label className="text-xs font-bold">
            Mesaj metni
            <textarea
              name="body"
              rows={4}
              defaultValue={templates.find((t) => t.key === "genel-duyuru")?.body ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-bold">Alıcılar ({guests.length} müşteri)</legend>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-line p-3">
              {guests.length === 0 ? (
                <p className="text-sm text-ink-soft">Henüz kayıtlı müşteri yok.</p>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {guests.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="guestIds" value={g.id} className="h-4 w-4" />
                      <span>
                        {g.fullName}
                        <span className="text-xs text-ink-soft">
                          {" "}
                          · {g.phone}
                          {g.reservations[0] ? ` · Oda ${g.reservations[0].room.number}` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <div>
            <button className="btn-primary">Seçilenlere gönder</button>
          </div>
        </form>
      </section>

      {/* TEKLI GONDERIM */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Tek kişiye mesaj</h2>
        <p className="mb-4 text-sm text-ink-soft">Numarayı elle yazabilir veya müşteri listesinden seçebilirsiniz.</p>

        <form action={sendSingleMessage} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Telefon numarası
            <input name="phone" placeholder="0530 000 00 00" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Mesaj
            <textarea name="body" rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary">{apiActive ? "Gönder" : "WhatsApp'ta aç"}</button>
          </div>
        </form>
      </section>

      {/* TEKLI E-POSTA */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Tek kişiye e-posta</h2>
        <p className="mb-4 text-sm text-ink-soft">
          {integration.emailEnabled ? "Gönderildiğinde otomatik olarak iletilir." : "E-posta bildirimi aşağıdan açılmadan çalışmaz."}
        </p>
        <form action={sendSingleEmail} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            E-posta adresi
            <input name="to" type="email" placeholder="misafir@example.com" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Konu
            <input name="subject" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Mesaj
            <textarea name="body" rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={!integration.emailEnabled}>
              E-posta gönder
            </button>
          </div>
        </form>
      </section>

      {/* TEKLI SMS */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Tek kişiye SMS</h2>
        <p className="mb-4 text-sm text-ink-soft">
          {integration.smsEnabled ? "Gönderildiğinde otomatik olarak iletilir." : "SMS bildirimi aşağıdan açılmadan çalışmaz."}
        </p>
        <form action={sendSingleSms} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Telefon numarası
            <input name="phone" placeholder="0530 000 00 00" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Mesaj (160 karakteri aşmamaya dikkat edin)
            <textarea name="body" rows={2} maxLength={480} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={!integration.smsEnabled}>
              SMS gönder
            </button>
          </div>
        </form>
      </section>

      {/* SABLONLAR */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Mesaj şablonları</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Sık kullandığınız metinleri buradan düzenleyin. &quot;Aylık ödeme hatırlatması&quot; şablonu otomatik
          hatırlatmalarda kullanılır.
        </p>

        <div className="space-y-3">
          {templates.map((t) => (
            <details key={t.id} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">{t.name}</summary>
              <form action={updateTemplate} className="mt-3 grid gap-2">
                <input type="hidden" name="id" value={t.id} />
                <label className="text-xs font-bold">
                  Şablon adı
                  <input name="name" defaultValue={t.name} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-bold">
                  Mesaj metni
                  <textarea name="body" defaultValue={t.body} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
                </label>
                <div>
                  <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                </div>
              </form>
              {t.key !== "odeme-hatirlatma" && (
                <form action={deleteTemplate} className="mt-2">
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton
                    message={`"${t.name}" şablonu silinsin mi?`}
                    className="text-xs font-bold text-ink-soft hover:text-red-700"
                  >
                    Şablonu sil
                  </ConfirmButton>
                </form>
              )}
            </details>
          ))}
        </div>

        <form action={createTemplate} className="mt-4 grid gap-2 border-t border-line pt-4">
          <h3 className="text-sm font-extrabold">Yeni şablon ekle</h3>
          <input name="name" placeholder="Şablon adı" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
          <textarea name="body" rows={2} placeholder="Mesaj metni" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
          <div>
            <button className="btn-primary">Şablonu ekle</button>
          </div>
        </form>
      </section>

      {/* API AYARLARI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">WhatsApp Business API ayarları</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Meta Business hesabınızdan aldığınız bilgileri girerseniz sistem mesajları kendi kendine gönderir. Bu alanlar
          boşken sistem yarı otomatik çalışır (hazır mesajla WhatsApp&apos;ı açar).
        </p>

        <form action={updateIntegration} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Phone Number ID
            <input name="waPhoneNumberId" defaultValue={integration.waPhoneNumberId} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Access Token {integration.waAccessToken && <span className="font-normal text-ink-soft">(kayıtlı — değiştirmek için yazın)</span>}
            <input name="waAccessToken" type="password" placeholder={integration.waAccessToken ? "••••••••" : ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="waEnabled" defaultChecked={integration.waEnabled} className="h-4 w-4" />
            Otomatik gönderimi etkinleştir
          </label>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="autoRemindersEnabled" defaultChecked={integration.autoRemindersEnabled} className="h-4 w-4" />
            Ödeme günü gelenlere otomatik hatırlatma gönder
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary">Ayarları kaydet</button>
          </div>
        </form>
      </section>

      {/* E-POSTA + SMS AYARLARI */}
      <section className="card mt-5 overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-2">
          <div className={`border-b border-line p-5 sm:border-b-0 sm:border-r ${integration.emailEnabled ? "bg-brand-50/40" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold tracking-tight">E-posta (Resend)</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${integration.emailEnabled ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                {integration.emailEnabled ? "Açık" : "Kapalı"}
              </span>
            </div>
            <p className="mb-3 text-xs text-ink-soft">
              Rezervasyon onaylandığında misafire otomatik onay e-postası gider. API anahtarınız yoksa{" "}
              <a href="https://resend.com" target="_blank" rel="noopener" className="font-bold text-brand-600 hover:underline">
                resend.com
              </a>
              &apos;dan ücretsiz alabilirsiniz.
            </p>
            <form action={updateNotificationChannels} className="grid gap-2">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" name="emailEnabled" defaultChecked={integration.emailEnabled} className="h-4 w-4" />
                E-posta bildirimini etkinleştir
              </label>
              <input
                name="emailApiKey"
                placeholder={integration.emailApiKey ? "API Key (kayıtlı — değiştirmek için yazın)" : "re_..."}
                className="rounded-lg border border-line px-3 py-2 text-xs"
              />
              <input
                name="emailFrom"
                placeholder="gonderen@onayapart.com"
                defaultValue={integration.emailFrom}
                className="rounded-lg border border-line px-3 py-2 text-xs"
              />
              {/* SMS alanlari da ayni formda gonderiliyor, boylece tek kaydetme yeterli */}
              <input type="hidden" name="smsEnabled" value={integration.smsEnabled ? "on" : ""} />
              <input type="hidden" name="smsUserCode" value={integration.smsUserCode} />
              <input type="hidden" name="smsHeader" value={integration.smsHeader} />
              <button className="btn-primary mt-1">Kaydet</button>
            </form>
          </div>

          <div className={`p-5 ${integration.smsEnabled ? "bg-brand-50/40" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold tracking-tight">SMS (NetGSM)</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${integration.smsEnabled ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                {integration.smsEnabled ? "Açık" : "Kapalı"}
              </span>
            </div>
            <p className="mb-3 text-xs text-ink-soft">
              Şifre alanı NetGSM panelinizdeki normal giriş şifreniz değil, ayrıca oluşturmanız gereken &quot;API
              şifresi&quot;dir. Başlık (gönderici adı) NetGSM tarafından onaylanmış olmalıdır.
            </p>
            <form action={updateNotificationChannels} className="grid gap-2">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" name="smsEnabled" defaultChecked={integration.smsEnabled} className="h-4 w-4" />
                SMS bildirimini etkinleştir
              </label>
              <input name="smsUserCode" placeholder="Kullanıcı kodu" defaultValue={integration.smsUserCode} className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input
                name="smsPassword"
                type="password"
                placeholder={integration.smsPassword ? "API şifresi (kayıtlı — değiştirmek için yazın)" : "API şifresi"}
                className="rounded-lg border border-line px-3 py-2 text-xs"
              />
              <input name="smsHeader" placeholder="Onaylı başlık (gönderici adı)" defaultValue={integration.smsHeader} className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input type="hidden" name="emailEnabled" value={integration.emailEnabled ? "on" : ""} />
              <input type="hidden" name="emailFrom" value={integration.emailFrom} />
              <button className="btn-primary mt-1">Kaydet</button>
            </form>
          </div>
        </div>
      </section>

      {/* GONDERIM GECMISI */}
      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Son gönderimler</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz gönderim kaydı yok.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Alıcı</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Mesaj</th>
                <th className="pb-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs">{fmtDate(l.sentAt)}</td>
                  <td className="py-2.5">
                    {l.guest?.fullName ?? "—"}
                    <span className="block text-xs text-ink-soft">{l.phone}</span>
                  </td>
                  <td className="py-2.5 text-xs">{KIND_LABEL[l.kind] ?? l.kind}</td>
                  <td className="max-w-[280px] truncate py-2.5 text-xs text-ink-soft">{l.body}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        l.status === "GONDERILDI"
                          ? "bg-brand-50 text-brand-600"
                          : l.status === "HATA"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
