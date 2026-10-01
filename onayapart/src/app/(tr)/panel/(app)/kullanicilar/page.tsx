import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { fmtDate } from "@/shared/lib/dates";
import { PERMISSIONS } from "@/features/auth/permissions";
import SearchBox from "@/shared/components/panel/SearchBox";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const usersAll = await prisma.staffUser.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: true },
  });

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const users = q
    ? usersAll.filter((u) => u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q))
    : usersAll;

  const permLabel = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.label]));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Panele sınırlı yetkiyle giriş yapan tüm personel hesaplarının genel görünümü. Yeni bir kullanıcı oluşturmak
        veya yetkilerini değiştirmek için ilgili personelin detay sayfasına gidin.
      </p>

      <section className="card mt-5 overflow-x-auto p-5">
        {usersAll.length > 0 && (
          <div className="mb-4 flex justify-end">
            <SearchBox placeholder="Kullanıcı adı veya ad soyad ara..." value={q} />
          </div>
        )}
        {usersAll.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Henüz sınırlı yetkili bir kullanıcı yok.{" "}
            <Link href="/panel/personel" className="font-bold text-brand-600">
              Personel ekranından bir çalışana kullanıcı hesabı açabilirsiniz →
            </Link>
          </p>
        ) : users.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen kullanıcı bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Kullanıcı adı</th>
                <th className="pb-2">Ad Soyad</th>
                <th className="pb-2">Yetkiler</th>
                <th className="pb-2">Son giriş</th>
                <th className="pb-2">Durum</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-3 font-semibold">{u.username}</td>
                  <td className="py-3">{u.fullName}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.permissions ? u.permissions.split(",") : []).map((p) => (
                        <span key={p} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                          {permLabel[p] ?? p}
                        </span>
                      ))}
                      {!u.permissions && <span className="text-xs text-ink-soft">Yetki yok</span>}
                    </div>
                  </td>
                  <td className="py-3 text-xs text-ink-soft">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "—"}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        u.isActive ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.employeeId && (
                      <Link href={`/panel/personel/${u.employeeId}`} className="text-xs font-bold text-brand-600 hover:underline">
                        Yönet
                      </Link>
                    )}
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
