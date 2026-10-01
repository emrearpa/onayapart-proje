"use client";

import { useEffect } from "react";

/** Sayfa islenirken beklenmeyen bir hata olursa gosterilir (orn. veritabani gecici olarak ulasilamaz). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Bir sorun oluştu</h1>
      <p className="lede mt-3">Sayfa şu anda görüntülenemiyor. Lütfen birazdan tekrar deneyin.</p>
      {error.digest && <p className="mt-2 text-xs text-ink-soft">Hata kodu: {error.digest}</p>}
      <button onClick={reset} className="btn-primary mt-6">
        Tekrar dene
      </button>
    </main>
  );
}
