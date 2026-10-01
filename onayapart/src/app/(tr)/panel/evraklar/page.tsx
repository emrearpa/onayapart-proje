import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import ConfirmButton from "@/components/ConfirmButton";
import { uploadCompanyDocument, deleteCompanyDocument, sendCompanyDocumentWhatsapp, sendCompanyDocumentEmail } from "./actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "evrak-eklendi": "Evrak eklendi.",
  "evrak-silindi": "Evrak silindi.",
  "wa-gonderildi": "Evrak WhatsApp'tan gönderildi.",
  "eposta-gonderildi": "Evrak e-posta ile gönderildi.",
};
const ERRORS: Record<string, string> = {
  "evrak-eksik": "Başlık ve bir dosya (ya da dosya adresi) girmelisiniz.",
  "telefon-eksik": "Bir telefon numarası girin.",
  "eposta-eksik": "Bir e-posta adresi girin.",
  "evrak-bulunamadi": "Evrak bulunamadı.",
  "wa-hata": "WhatsApp mesajı gönderilemedi.",
  "eposta-hata": "E-posta gönderilemedi — Bilgilendirme sayfasından e-posta ayarlarının açık olduğundan emin olun.",
};

export default async function CompanyDocumentsPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const documents = await prisma.companyDocument.findMany({ orderBy: { uploadedAt: "desc" } });

  const today = new Date();
  const soonThreshold = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = documents.filter((d) => d.expiresAt && d.expiresAt > today && d.expiresAt <= soonThreshold);
  const expired = documents.filter((d) => d.expiresAt && d.expiresAt <= today);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Firma Evrakları</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Vergi levhası, ruhsat, sözleşme, sigorta poliçesi gibi işletmenizin önemli evraklarını tarayıp buraya
        kaydedin — ihtiyaç olduğunda indirip kullanabilirsiniz. Personel özlük dosyalarından ayrı, sadece bu
        sayfaya yetkisi olan personel görebilir.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok] ?? "Kaydedildi."}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {expired.length > 0 && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          ⚠️ {expired.length} evrakın süresi dolmuş: {expired.map((d) => d.title).join(", ")}
        </p>
      )}
      {expiringSoon.length > 0 && (
        <p className="mt-4 rounded-xl bg-gold-50 p-4 text-sm font-semibold text-gold-700">
          🕐 {expiringSoon.length} evrakın süresi 30 gün içinde doluyor: {expiringSoon.map((d) => d.title).join(", ")}
        </p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni evrak ekle</h2>
        <form action={uploadCompanyDocument} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Evrak adı
            <input name="title" placeholder="Örn. Vergi Levhası 2026" required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Kategori (isteğe bağlı)
            <input name="category" placeholder="Örn. Vergi, Ruhsat, Sözleşme" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Dosya yükle
            <input name="file" type="file" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            veya dosya adresi (Google Drive, Dropbox linki vb.)
            <input name="url" placeholder="https://..." className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Son geçerlilik tarihi (isteğe bağlı)
            <input name="expiresAt" type="date" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Not (isteğe bağlı)
            <input name="note" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary">Evrakı kaydet</button>
          </div>
        </form>
        <p className="mt-3 text-[11px] text-ink-soft">
          Dosya yükleme, kalıcı disk gerektiren bir barındırmada (VPS) çalışır. Vercel gibi sunucusuz barındırmada
          yüklenen dosyalar kalıcı olmayabilir — bu durumda evrakı bir bulut deposuna (Google Drive, Dropbox vb.)
          yükleyip linkini &quot;dosya adresi&quot; alanına yapıştırın, en güvenilir yöntem budur.
        </p>
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Kayıtlı evraklar ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz evrak eklenmedi.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Evrak</th>
                <th className="pb-2">Kategori</th>
                <th className="pb-2">Son geçerlilik</th>
                <th className="pb-2">Eklenme tarihi</th>
                <th className="pb-2">Gönder</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => {
                const isExpired = d.expiresAt && d.expiresAt <= today;
                const isExpiringSoon = d.expiresAt && !isExpired && d.expiresAt <= soonThreshold;
                return (
                  <tr key={d.id} className="border-t border-line">
                    <td className="py-2.5 font-semibold">
                      {d.title}
                      {d.note && <div className="text-xs font-normal text-ink-soft">{d.note}</div>}
                    </td>
                    <td className="py-2.5 text-xs text-ink-soft">{d.category ?? "—"}</td>
                    <td className="py-2.5 text-xs">
                      {d.expiresAt ? (
                        <span className={isExpired ? "font-bold text-red-700" : isExpiringSoon ? "font-bold text-gold-700" : "text-ink-soft"}>
                          {fmtDate(d.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-xs text-ink-soft">{fmtDate(d.uploadedAt)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-col gap-1.5">
                        <form action={sendCompanyDocumentWhatsapp} target="_blank" className="flex items-center gap-1">
                          <input type="hidden" name="docId" value={d.id} />
                          <input name="phone" type="tel" placeholder="Telefon" className="w-24 rounded-lg border border-line px-2 py-1 text-[11px]" />
                          <button className="whitespace-nowrap rounded-lg bg-[#1f9d55] px-2 py-1 text-[10px] font-bold text-white">
                            💬 Gönder
                          </button>
                        </form>
                        <form action={sendCompanyDocumentEmail} className="flex items-center gap-1">
                          <input type="hidden" name="docId" value={d.id} />
                          <input name="email" type="email" placeholder="E-posta" className="w-24 rounded-lg border border-line px-2 py-1 text-[11px]" />
                          <button className="whitespace-nowrap rounded-lg border border-brand-600 px-2 py-1 text-[10px] font-bold text-brand-600">
                            ✉️ Gönder
                          </button>
                        </form>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <a href={`/api/evrak/${d.id}`} target="_blank" rel="noopener" className="text-xs font-bold text-brand-600 hover:underline">
                          İndir
                        </a>
                        <form action={deleteCompanyDocument}>
                          <input type="hidden" name="id" value={d.id} />
                          <ConfirmButton message={`"${d.title}" silinsin mi?`} className="text-xs font-bold text-red-700 hover:underline">
                            Sil
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
