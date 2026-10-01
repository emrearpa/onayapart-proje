import { prisma } from "@/shared/lib/db";
import { fmtMoney, fmtDate } from "@/shared/lib/dates";
import { computeMonthlyStats, tgaPayloadPreview } from "@/features/accounting/tga";
import MuhasebeNav from "@/features/accounting/components/MuhasebeNav";
import { updateTgaSettings, sendTgaReportAction } from "@/features/accounting/tga-actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  ayar: "TGA ayarları kaydedildi.",
  gonderildi: "Rapor TGA'ya başarıyla gönderildi.",
};
const ERRORS: Record<string, string> = {
  "ay-gecersiz": "Geçerli bir ay seçin.",
  "ayar-eksik": "Önce TGA'yı etkinleştirip API anahtarınızı girmelisiniz.",
  hata: "Gönderim başarısız oldu, aşağıdaki geçmişten hata detayını görebilirsiniz.",
};

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TgaPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; ay?: string };
}) {
  const settings = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  const reportMonth = searchParams.ay && /^\d{4}-\d{2}$/.test(searchParams.ay) ? searchParams.ay : currentMonthStr();
  const [year, month] = reportMonth.split("-").map(Number);

  const [stats, submissions] = await Promise.all([
    computeMonthlyStats(year, month),
    prisma.tgaSubmission.findMany({ orderBy: { reportMonth: "desc" }, take: 12 }),
  ]);

  const tgaReady = Boolean(settings?.tgaEnabled && settings.tgaApiKey && settings.tgaFacilityId);
  const preview = tgaReady
    ? tgaPayloadPreview(
        {
          tgaApiKey: settings!.tgaApiKey,
          tgaSandbox: settings!.tgaSandbox,
          tgaFacilityId: settings!.tgaFacilityId,
          tgaIlKodu: settings!.tgaIlKodu,
          tgaIlceKodu: settings!.tgaIlceKodu,
          tgaOdaSayisi: settings!.tgaOdaSayisi,
          tgaYatakSayisi: settings!.tgaYatakSayisi,
        },
        reportMonth,
        stats,
        null
      )
    : null;

  const alreadySent = submissions.find((s) => s.reportMonth === reportMonth && s.status === "GONDERILDI");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">TGA Aylık İstatistik Bildirimi</h1>
      <p className="mt-1 text-sm text-ink-soft">
        2026/1 sayılı Bakanlık Genelgesi ile tüm konaklama tesisleri için zorunlu hale gelen, Turizm Geliştirme
        Ajansı&apos;na (TGA) yapılan aylık istatistik bildirimi. Gerçek, resmi bir API kullanılır — tahmini bir
        entegrasyon değildir.
      </p>

      <div className="mt-5">
        <MuhasebeNav />
      </div>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok] ?? "Kaydedildi."}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {/* AYARLAR */}
      <section className="card mt-5 overflow-hidden p-0">
        <div className={`flex items-center justify-between gap-3 px-5 py-4 ${settings?.tgaEnabled ? "bg-brand-50" : "bg-slate-50"}`}>
          <div>
            <h2 className="font-extrabold tracking-tight">TGA entegrasyonu</h2>
            <p className="text-xs text-ink-soft">tesis-entegrasyon.tga.gov.tr üzerinden çalışır.</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              settings?.tgaEnabled ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {settings?.tgaEnabled ? "Açık" : "Kapalı"}
          </span>
        </div>

        <form action={updateTgaSettings} className="grid gap-3 p-5 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="tgaEnabled" defaultChecked={settings?.tgaEnabled} className="h-4 w-4" />
            TGA bildirimini etkinleştir
          </label>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="tgaSandbox" defaultChecked={settings?.tgaSandbox ?? true} className="h-4 w-4" />
            Test ortamı — gerçek TGA hesabınız hazır olana kadar işaretli bırakın
          </label>

          <label className="text-xs font-bold sm:col-span-2">
            API Key
            <input
              name="tgaApiKey"
              placeholder={settings?.tgaApiKey ? "•••••••• (kayıtlı — değiştirmek için yazın)" : "TGA'dan aldığınız API anahtarı"}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            İl kodu
            <input name="tgaIlKodu" defaultValue={settings?.tgaIlKodu ?? "25"} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            İlçe kodu
            <input name="tgaIlceKodu" defaultValue={settings?.tgaIlceKodu ?? "2045"} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Bakanlık belgesindeki oda sayısı
            <input name="tgaOdaSayisi" type="number" min={0} defaultValue={settings?.tgaOdaSayisi ?? 0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Bakanlık belgesindeki yatak sayısı
            <input name="tgaYatakSayisi" type="number" min={0} defaultValue={settings?.tgaYatakSayisi ?? 0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <div className="sm:col-span-2">
            <button className="btn-primary">Kaydet</button>
          </div>
        </form>

        {settings?.tgaFacilityId && (
          <div className="border-t border-line bg-brand-50/30 px-5 py-3 text-xs text-ink-soft">
            Tesis kimliği (sabit, değişmez): <code className="text-brand-700">{settings.tgaFacilityId}</code>
          </div>
        )}

        <div className="border-t border-line bg-gold-50/50 px-5 py-4 text-xs text-ink-soft">
          API anahtarınız yoksa{" "}
          <a href="https://tga.gov.tr/tesis-entegrasyon" target="_blank" rel="noopener" className="font-bold text-brand-600 hover:underline">
            tga.gov.tr/tesis-entegrasyon
          </a>{" "}
          adresinden tesisinizi (vergi no, Bakanlık belge no ile) kaydedip API anahtarı talep edin. İl/ilçe
          kodu, oda/yatak sayısı Bakanlık belgenizdeki resmi rakamlarla birebir aynı olmalıdır.
        </div>
      </section>

      {/* AY SECICI VE ONIZLEME */}
      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-extrabold tracking-tight">Rapor önizleme</h2>
        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold">
            Rapor ayı
            <input type="month" name="ay" defaultValue={reportMonth} className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <button className="btn-outline">Hesapla</button>
        </form>

        {alreadySent && (
          <p className="mb-4 rounded-xl bg-brand-50 p-3 text-xs font-semibold text-brand-700">
            Bu dönem daha önce {alreadySent.sentAt ? fmtDate(alreadySent.sentAt) : ""} tarihinde gönderilmiş. Tekrar
            gönderirseniz TGA tarafında öncekinin yerine geçer (TGA'nın kendi kuralı).
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="text-xs text-ink-soft">Açık gün sayısı</div>
            <div className="mt-1 text-xl font-extrabold">{stats.daysInMonth}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-ink-soft">Toplam satılan oda-gece</div>
            <div className="mt-1 text-xl font-extrabold">{stats.totalRoomNights}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-ink-soft">Dönem cirosu (TL, referans)</div>
            <div className="mt-1 text-xl font-extrabold">{fmtMoney(stats.totalRevenue)}</div>
          </div>
        </div>

        {Object.keys(stats.byNationality).length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-ink-soft">
                  <th className="pb-2">Uyruk</th>
                  <th className="pb-2 text-right">Giriş (h.içi/h.sonu)</th>
                  <th className="pb-2 text-right">Geceleme (h.içi/h.sonu)</th>
                  <th className="pb-2 text-right">Oda-gece (h.içi/h.sonu)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byNationality).map(([iso, m]) => (
                  <tr key={iso} className="border-t border-line">
                    <td className="py-2 font-bold">{iso}</td>
                    <td className="py-2 text-right">
                      {m.haftaici_toplam_giris_yapan_misafir} / {m.haftasonu_toplam_giris_yapan_misafir}
                    </td>
                    <td className="py-2 text-right">
                      {m.haftaici_toplam_geceleme} / {m.haftasonu_toplam_geceleme}
                    </td>
                    <td className="py-2 text-right">
                      {m.haftaici_toplam_satilan_oda_gece} / {m.haftasonu_toplam_satilan_oda_gece}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">Bu ayda kayıtlı hareket yok — tesis kapalı olarak gönderilir.</p>
        )}

        {preview && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-bold text-brand-600">Gönderilecek ham veriyi gör (JSON)</summary>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] text-slate-100">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </details>
        )}

        <form action={sendTgaReportAction} className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="reportMonth" value={reportMonth} />
          <label className="text-xs font-bold">
            Aylık ortalama oda fiyatı (KDV/kahvaltı hariç, net EURO)
            <input
              name="aylikOrtalamaFiyat"
              type="number"
              min={0}
              step={0.01}
              placeholder="Örn. 45.00"
              className="mt-1 w-56 rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
              disabled={stats.daysInMonth === 0}
            />
          </label>
          <button className="btn-primary" disabled={!tgaReady}>
            {tgaReady ? `${reportMonth} raporunu TGA'ya gönder` : "Önce ayarları tamamlayın"}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-ink-soft">
          EURO tutarını hesaplarken ilgili ayın son iş gününe ait TCMB döviz satış kuru kullanılmalıdır — bu tek
          değeri TGA&apos;nın kendi kuralları gereği elle girmenizi öneririz.
        </p>
      </section>

      {/* GECMIS */}
      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Gönderim geçmişi</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz gönderim yapılmadı.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Dönem</th>
                <th className="pb-2">Durum</th>
                <th className="pb-2">Gönderim tarihi</th>
                <th className="pb-2">Detay</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-2.5 font-bold">{s.reportMonth}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        s.status === "GONDERILDI" ? "bg-brand-50 text-brand-600" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {s.status === "GONDERILDI" ? "Gönderildi" : "Hata"}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-ink-soft">{s.sentAt ? fmtDate(s.sentAt) : "—"}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{s.requestId ?? s.errorMessage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
