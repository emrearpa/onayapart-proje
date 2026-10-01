"use client";

import { useState } from "react";

type Labels = {
  title: string;
  subtitle: string;
  name: string;
  phone: string;
  message: string;
  submit: string;
  sending: string;
  errorMsg: string;
  doneTitle: string;
  doneText: string;
};

const trLabels: Labels = {
  title: "Sizi arayalım",
  subtitle: "Müsaitlik ve fiyat bilgisi için numaranızı bırakın.",
  name: "Adınız soyadınız",
  phone: "Telefon numaranız",
  message: "Tarih ve kişi sayısı (isteğe bağlı)",
  submit: "Talebi gönder",
  sending: "Gönderiliyor",
  errorMsg: "Ad ve telefon alanlarını doldurun, sonra tekrar gönderin.",
  doneTitle: "Talebiniz bize ulaştı.",
  doneText: "En kısa sürede sizi arayacağız. Acele ediyorsanız {phone} numarasından hemen ulaşabilirsiniz.",
};

export default function LeadForm({
  roomNumber,
  phoneDisplay = "0530 652 70 88",
  labels,
}: {
  roomNumber?: number;
  phoneDisplay?: string;
  labels?: Labels;
}) {
  const L = labels ?? trLabels;
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [values, setValues] = useState({ name: "", phone: "", message: "" });

  async function submit() {
    if (!values.name.trim() || !values.phone.trim()) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, roomNumber }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm">
        <p className="font-bold text-brand-700">{L.doneTitle}</p>
        <p className="mt-1 text-ink-soft">{L.doneText.replace("{phone}", phoneDisplay)}</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-extrabold tracking-tight">{L.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{L.subtitle}</p>

      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded-xl border border-line px-4 py-3 text-sm"
          placeholder={L.name}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-line px-4 py-3 text-sm"
          placeholder={L.phone}
          inputMode="tel"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
        <textarea
          className="w-full rounded-xl border border-line px-4 py-3 text-sm"
          rows={3}
          placeholder={L.message}
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
        />
      </div>

      {state === "error" && <p className="mt-3 text-sm font-semibold text-red-700">{L.errorMsg}</p>}

      <button onClick={submit} disabled={state === "sending"} className="btn-primary mt-4 w-full disabled:opacity-60">
        {state === "sending" ? L.sending : L.submit}
      </button>
    </div>
  );
}
