"use client";

import { useState } from "react";

type Actions = {
  login: (formData: FormData) => void;
  staffLogin: (formData: FormData) => void;
};

export default function LoginTabs({
  login,
  staffLogin,
  initialTab,
  adminError,
  staffError,
}: Actions & { initialTab: "admin" | "personel"; adminError: boolean; staffError: boolean }) {
  const [tab, setTab] = useState<"admin" | "personel">(initialTab);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
      <div className="flex gap-1 bg-brand-50 p-1.5">
        <button
          type="button"
          onClick={() => setTab("admin")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition ${
            tab === "admin" ? "bg-white text-brand-700 shadow-sm" : "text-brand-600/60 hover:text-brand-600"
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => setTab("personel")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition ${
            tab === "personel" ? "bg-white text-brand-700 shadow-sm" : "text-brand-600/60 hover:text-brand-600"
          }`}
        >
          Personel
        </button>
      </div>

      <div className="relative overflow-hidden">
        <div
          className={`flex w-[200%] transition-transform duration-300 ease-out ${
            tab === "personel" ? "-translate-x-1/2" : "translate-x-0"
          }`}
        >
          {/* ADMIN */}
          <form action={login} className="w-1/2 shrink-0 space-y-4 p-7">
            <div>
              <label className="block text-sm font-bold" htmlFor="password">
                Panel şifresi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoFocus={tab === "admin"}
                className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
                placeholder="••••••••"
              />
            </div>
            {adminError && <p className="text-sm font-semibold text-red-700">Şifre hatalı. Tekrar deneyin.</p>}
            <button className="btn-primary w-full">Panele gir</button>
          </form>

          {/* PERSONEL */}
          <form action={staffLogin} className="w-1/2 shrink-0 space-y-4 p-7">
            <p className="text-xs text-ink-soft">
              Size tanımlanan kullanıcı adı ve şifre ile yalnızca yetkili olduğunuz bölümlere giriş yaparsınız.
            </p>
            <div>
              <label className="block text-xs font-bold" htmlFor="username">
                Kullanıcı adı
              </label>
              <input
                id="username"
                name="username"
                autoFocus={tab === "personel"}
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold" htmlFor="staffPassword">
                Şifre
              </label>
              <input id="staffPassword" name="password" type="password" className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm" />
            </div>
            {staffError && <p className="text-sm font-semibold text-red-700">Kullanıcı adı veya şifre hatalı.</p>}
            <button className="btn-outline w-full">Personel olarak gir</button>
          </form>
        </div>
      </div>
    </div>
  );
}
