"use client";

import { useState } from "react";

/**
 * Odeme ekleme formu - odeme yontemi "Nakit" secildiginde, "fatura kesilsin mi?"
 * sorusunu ve tutar alanini gosterir. Musteri toplam odemenin sadece bir kismi
 * icin fatura isteyebiliyor, o yuzden tutar odeme miktarindan bagimsiz girilebilir.
 */
export default function PaymentRowForm({
  action,
  reservationId,
  accounts,
}: {
  action: (formData: FormData) => void;
  reservationId: string;
  accounts: { id: string; name: string }[];
}) {
  const [method, setMethod] = useState("NAKIT");
  const [amount, setAmount] = useState("");
  const [invoiceRequested, setInvoiceRequested] = useState(false);

  return (
    <form action={action} className="flex flex-wrap items-center gap-1">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input
        name="amount"
        type="number"
        min={0}
        step={50}
        placeholder="₺"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20 rounded-lg border border-line px-2 py-1.5 text-xs"
      />
      <select
        name="method"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="rounded-lg border border-line px-2 py-1.5 text-xs"
      >
        <option value="NAKIT">Nakit</option>
        <option value="KART">Kart</option>
        <option value="HAVALE">Havale</option>
      </select>
      <select name="accountId" className="rounded-lg border border-line px-2 py-1.5 text-xs">
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold">Ekle</button>

      {method === "NAKIT" && (
        <div className="mt-1.5 flex w-full flex-wrap items-center gap-1.5 rounded-lg bg-gold-50 px-2 py-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gold-700">
            <input
              type="checkbox"
              name="invoiceRequested"
              checked={invoiceRequested}
              onChange={(e) => setInvoiceRequested(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Fatura kesilsin mi?
          </label>
          {invoiceRequested && (
            <input
              name="invoiceAmount"
              type="number"
              min={0}
              step={50}
              max={amount || undefined}
              placeholder="Tutar (varsayilan: tamami)"
              className="w-40 rounded-lg border border-gold-300 px-2 py-1 text-[11px]"
            />
          )}
        </div>
      )}
    </form>
  );
}
