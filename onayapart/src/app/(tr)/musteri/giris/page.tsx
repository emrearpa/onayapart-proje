import { redirect } from "next/navigation";
import { getGuestId } from "@/features/auth/guards";
import { guestLogin } from "@/features/guests/portal-actions";

export const metadata = { title: "Müşteri Girişi" };

const ERRORS: Record<string, string> = {
  "cok-deneme": "Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
};
const DEFAULT_ERROR = "Telefon veya kimlik numarası hatalı. Bilgilerinizi bilmiyorsanız işletmeyi arayın.";

export default async function GuestLoginPage({ searchParams }: { searchParams: { hata?: string } }) {
  if (await getGuestId()) redirect("/musteri");

  return (
    <main className="grid min-h-screen place-items-center bg-brand-900 px-5">
      <form action={guestLogin} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold text-white">
            OA
          </span>
          <div className="font-extrabold leading-tight">
            ONAY APART
            <span className="block text-[11px] font-medium text-ink-soft">Müşteri paneli</span>
          </div>
        </div>

        <p className="mt-5 text-sm text-ink-soft">
          Rezervasyonunuzda kayıtlı telefon numaranızı ve kimlik (T.C. ya da pasaport) numaranızı girin. Ayrıca bir
          kod almanıza gerek yok.
        </p>

        <label className="mt-5 block text-sm font-bold" htmlFor="phone">
          Telefon numarası
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          autoFocus
          placeholder="05xx xxx xx xx"
          className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Nasıl yazarsanız yazın (boşluklu/boşluksuz, başında 0 ya da +90 olsun olmasın) fark etmez.
        </p>

        <label className="mt-4 block text-sm font-bold" htmlFor="tcNo">
          Kimlik numarası
        </label>
        <input
          id="tcNo"
          name="tcNo"
          required
          maxLength={20}
          autoComplete="off"
          placeholder="T.C. kimlik no ya da pasaport no"
          className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm tracking-wide"
        />

        {searchParams.hata && (
          <p className="mt-3 text-sm font-semibold text-red-700">{ERRORS[searchParams.hata] ?? DEFAULT_ERROR}</p>
        )}

        <button className="btn-primary mt-5 w-full">Giriş yap</button>
      </form>
    </main>
  );
}
