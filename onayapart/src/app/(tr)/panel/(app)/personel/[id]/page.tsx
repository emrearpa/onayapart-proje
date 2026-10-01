import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney, toInputDate } from "@/shared/lib/dates";
import { PERMISSIONS, parsePermissions } from "@/features/auth/permissions";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password";
import {
  updateEmployeeProfile,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  createStaffUserForEmployee,
  updateStaffUserPermissions,
  resetStaffUserPassword,
  toggleStaffUserActive,
} from "@/features/staff/actions";
import { requireAdmin } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "1": "Kaydedildi.",
  evrak: "Evrak yüklendi.",
  "evrak-silindi": "Evrak silindi.",
  "kullanici-eklendi": "Kullanıcı hesabı oluşturuldu.",
  "yetki-guncellendi": "Yetkiler güncellendi.",
  "sifre-guncellendi": "Şifre güncellendi.",
};
const ERRORS: Record<string, string> = {
  eksik: "Ad soyad ve pozisyon zorunludur.",
  evrak: "Başlık ve dosya seçimi zorunludur.",
  "kullanici-eksik": "Kullanıcı adı, ad soyad ve en az bir yetki seçimi zorunludur.",
  "kullanici-cakisma": "Bu kullanıcı adı zaten kullanılıyor.",
  "sifre-kisa": `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`,
  "evrak-buyuk": "Dosya çok büyük (en fazla 15 MB).",
  "evrak-tur": "Bu dosya türü desteklenmiyor (PDF, JPG, PNG, WEBP, Word, Excel).",
};

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; hata?: string };
}) {
  // Ozluk evraklari ve yetki yonetimi hassastir: "Personel" yetkisi olsa bile yalnizca tam admin girer.
  await requireAdmin();
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      staffUser: true,
      transactions: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!employee) notFound();

  const selectedPerms: string[] = parsePermissions(employee.staffUser?.permissions);

  // Bu personelin panel uzerinden yaptigi islemler - StaffUser hesabi varsa gosterilir.
  const activityLogs = employee.staffUser
    ? await prisma.activityLog.findMany({
        where: { actorLabel: employee.fullName },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div>
      <Link href="/panel/personel" className="text-xs font-bold text-brand-600">
        ← Personel listesine dön
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{employee.fullName}</h1>
      <p className="text-sm text-ink-soft">{employee.position}</p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok]}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* KISISEL BILGILER */}
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Kişisel bilgiler</h2>
          <form action={updateEmployeeProfile} className="grid gap-3">
            <input type="hidden" name="id" value={employee.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                Ad Soyad
                <input name="fullName" defaultValue={employee.fullName} required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Pozisyon
                <input name="position" defaultValue={employee.position} required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                Telefon
                <input name="phone" defaultValue={employee.phone ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                E-posta
                <input name="email" type="email" defaultValue={employee.email ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                T.C. Kimlik No
                <input name="idNumber" defaultValue={employee.idNumber ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Doğum tarihi
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={employee.birthDate ? toInputDate(employee.birthDate) : ""}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <label className="text-xs font-bold">
              Adres
              <textarea name="address" defaultValue={employee.address ?? ""} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Aylık maaş (₺)
              <input name="salary" type="number" min={0} step={100} defaultValue={employee.salary} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Not
              <textarea name="note" defaultValue={employee.note ?? ""} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <button className="btn-primary mt-2">Kaydet</button>
          </form>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-extrabold">Son maaş ödemeleri</h3>
            {employee.transactions.length === 0 ? (
              <p className="text-sm text-ink-soft">Henüz ödeme kaydı yok.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {employee.transactions.map((t) => (
                  <li key={t.id} className="flex justify-between border-b border-line pb-1.5">
                    <span className="text-ink-soft">{fmtDate(t.date)}</span>
                    <span className="font-bold">{fmtMoney(t.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* OZLUK EVRAKLARI */}
        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Özlük dosyası — evraklar</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Kimlik fotokopisi, diploma, sağlık raporu, adli sicil, iş sözleşmesi gibi işe başvuru evraklarını buraya
            tarayıp yükleyin. Bu dosyalar herkese açık değildir, yalnızca admin girişiyle görüntülenir.
          </p>

          {employee.documents.length > 0 ? (
            <ul className="mb-5 space-y-2">
              {employee.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                  <div>
                    <a
                      href={`/api/ozluk/${d.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm font-bold text-brand-600 hover:underline"
                    >
                      {d.title}
                    </a>
                    <div className="text-xs text-ink-soft">
                      {d.fileName} · {fmtDate(d.uploadedAt)}
                    </div>
                  </div>
                  <form action={deleteEmployeeDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <button className="text-xs font-bold text-ink-soft hover:text-red-700">Sil</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-5 text-sm text-amber-700">Bu personel için henüz evrak yüklenmedi.</p>
          )}

          <form action={uploadEmployeeDocument} className="space-y-3 border-t border-line pt-4">
            <input type="hidden" name="employeeId" value={employee.id} />
            <label className="block text-xs font-bold">
              Evrak adı
              <input name="title" placeholder="Örn. Kimlik fotokopisi" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="block text-xs font-bold">
              Bilgisayardan dosya yükle (fotoğraf veya PDF)
              <input name="file" type="file" accept="image/*,application/pdf" className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-normal" />
            </label>
            <div className="text-center text-xs text-ink-soft">— veya —</div>
            <label className="block text-xs font-bold">
              Google Drive / Dropbox gibi bir depodan link yapıştır
              <input name="url" placeholder="https://..." className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <button className="btn-primary w-full">Evrakı yükle</button>
          </form>

          <p className="mt-4 text-xs text-ink-soft">
            Not: bilgisayardan dosya yükleme, kalıcı diski olan bir sunucuda (VPS) sorunsuz çalışır. Vercel gibi
            sunucusuz barındırmalarda dosya yükleme kalıcı olmaz — o durumda evrakı önce Google Drive/Dropbox&apos;a
            yükleyip linkini buraya yapıştırın.
          </p>
        </section>
      </div>

      {/* SISTEM KULLANICISI / YETKI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Sistem kullanıcısı ve yetkiler</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Bu personelin panele kendi kullanıcı adı ve şifresiyle, sadece işaretlediğiniz bölümleri görebileceği
          şekilde giriş yapmasını sağlayın. Örneğin bakım personeline yalnızca &quot;Bakım talepleri&quot; yetkisi
          verebilirsiniz.
        </p>

        {!employee.staffUser ? (
          <form action={createStaffUserForEmployee} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input type="hidden" name="fullName" value={employee.fullName} />
            <label className="text-xs font-bold">
              Kullanıcı adı
              <input name="username" placeholder="Örn. mehmet.bakim" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Şifre
              <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-bold">Görebileceği bölümler</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="permissions" value={p.key} className="h-4 w-4" />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sm:col-span-2">
              <button className="btn-primary">Kullanıcı hesabı oluştur</button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4">
              <div>
                <div className="font-extrabold">{employee.staffUser.username}</div>
                <div className="text-xs text-ink-soft">
                  {employee.staffUser.lastLoginAt
                    ? `Son giriş: ${fmtDate(employee.staffUser.lastLoginAt)}`
                    : "Henüz giriş yapmadı"}
                </div>
              </div>
              <form action={toggleStaffUserActive} className="ml-auto">
                <input type="hidden" name="id" value={employee.staffUser.id} />
                <input type="hidden" name="employeeId" value={employee.id} />
                <input type="hidden" name="isActive" value={String(!employee.staffUser.isActive)} />
                <button
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    employee.staffUser.isActive ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {employee.staffUser.isActive ? "Aktif" : "Pasif"}
                </button>
              </form>
            </div>

            <form action={updateStaffUserPermissions}>
              <input type="hidden" name="id" value={employee.staffUser.id} />
              <input type="hidden" name="employeeId" value={employee.id} />
              <fieldset>
                <legend className="mb-2 text-xs font-bold">Görebileceği bölümler</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PERMISSIONS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={p.key}
                        defaultChecked={selectedPerms.includes(p.key)}
                        className="h-4 w-4"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className="btn-primary mt-3">Yetkileri kaydet</button>
            </form>

            <form action={resetStaffUserPassword} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <input type="hidden" name="id" value={employee.staffUser.id} />
              <input type="hidden" name="employeeId" value={employee.id} />
              <label className="text-xs font-bold">
                Yeni şifre belirle
                <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="mt-1 w-56 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <button className="btn-outline">Şifreyi güncelle</button>
            </form>
          </div>
        )}
      </section>

      {employee.staffUser && (
        <section className="card mt-5 overflow-x-auto p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">İşlem geçmişi</h2>
          <p className="mb-4 text-sm text-ink-soft">
            {employee.fullName} panelden bugüne kadar ne yaptı — son 50 kayıt.{" "}
            <Link href={`/panel/gecmis?kisi=${encodeURIComponent(employee.fullName)}`} className="font-bold text-brand-600 hover:underline">
              Tam işlem geçmişinde aç →
            </Link>
          </p>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-ink-soft">Henüz kayıtlı bir işlem yok.</p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-ink-soft">
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2">İşlem</th>
                  <th className="pb-2">Detay</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.id} className="border-t border-line">
                    <td className="py-2 text-xs text-ink-soft">{fmtDate(log.createdAt)}</td>
                    <td className="py-2 font-semibold">{log.action}</td>
                    <td className="py-2 text-xs text-ink-soft">{log.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
