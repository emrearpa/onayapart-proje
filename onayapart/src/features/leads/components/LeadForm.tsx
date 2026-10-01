"use client";

import { useState } from "react";

export type LeadFormLabels = {
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

const INPUT = "w-full rounded-xl border border-line px-4 py-3 text-sm";

export default function LeadForm({
  phoneDisplay,
  roomNumber,
  labels,
}: {
  /** Isletmenin guncel telefonu (panelden yonetilir); tesekkur mesajinda gosterilir. */
  phoneDisplay: string;
  roomNumber?: number;
  labels: LeadFormLabels;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setState("sending");
    try {
      const res = await fetch("/api/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roomNumber }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm">
        <p className="font-bold text-brand-700">{labels.doneTitle}</p>
        <p className="mt-1 text-ink-soft">{labels.doneText.replace("{phone}", phoneDisplay)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="text-lg font-extrabold tracking-tight">{labels.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{labels.subtitle}</p>

      <div className="mt-4 space-y-3">
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" aria-label={labels.name} placeholder={labels.name} className={INPUT} />
        <input name="phone" required type="tel" inputMode="tel" maxLength={30} autoComplete="tel" aria-label={labels.phone} placeholder={labels.phone} className={INPUT} />
        <textarea name="message" rows={3} maxLength={1000} aria-label={labels.message} placeholder={labels.message} className={INPUT} />
        {/* Botlar icin tuzak alan: insanlar gormez, doldurulursa talep yok sayilir. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      </div>

      {state === "error" && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {labels.errorMsg}
        </p>
      )}

      <button disabled={state === "sending"} className="btn-primary mt-4 w-full disabled:opacity-60">
        {state === "sending" ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
