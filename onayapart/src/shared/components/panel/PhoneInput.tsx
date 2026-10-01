"use client";

import { useState } from "react";

function stripToDigits(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("90") && d.length > 10) d = d.slice(2);
  if (d.startsWith("0") && d.length > 10) d = d.slice(1);
  return d.slice(0, 10);
}

function formatDisplay(d: string): string {
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
  return parts.join(" ");
}

/**
 * +90 onekli, otomatik boslukla bicimlenen telefon girisi (553 673 27 72).
 * Gizli bir input'la gercek degeri ("+905536732772") ayni `name` altinda gonderir,
 * boylece server action tarafinda hicbir degisiklik gerekmez.
 */
export default function PhoneInput({
  name,
  defaultValue = "",
  required,
  className = "",
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [digits, setDigits] = useState(stripToDigits(defaultValue));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="shrink-0 rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm font-bold text-ink-soft">+90</span>
      <input
        type="tel"
        inputMode="numeric"
        value={formatDisplay(digits)}
        onChange={(e) => setDigits(stripToDigits(e.target.value))}
        placeholder="553 673 27 72"
        required={required}
        className="w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
      />
      <input type="hidden" name={name} value={digits ? `+90${digits}` : ""} />
    </div>
  );
}
