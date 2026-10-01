"use client";

import { useState } from "react";

/**
 * Rezervasyon olusturma formunun icine gomulu, dinamik "ek misafir" satirlari.
 * Ayri bir <form> degil - ayni ust formun icinde render olur, tum alanlar ayni
 * `name` ile tekrarlanir (formData.getAll ile satir sirasina gore okunur).
 */
export default function ExtraGuestFields() {
  const [rows, setRows] = useState<number[]>([]);
  const [nextId, setNextId] = useState(0);

  function addRow() {
    setRows((r) => [...r, nextId]);
    setNextId((n) => n + 1);
  }
  function removeRow(id: number) {
    setRows((r) => r.filter((x) => x !== id));
  }

  return (
    <div className="border-t border-line pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold">
          Odada kalacak başka kişi var mı?
          <span className="ml-1 font-normal text-ink-soft">— isteğe bağlı, aynı anda ekleyebilirsiniz</span>
        </h3>
      </div>

      {rows.length > 0 && (
        <div className="mb-3 space-y-2">
          {rows.map((id) => (
            <div key={id} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2 xl:grid-cols-4">
              <input name="eg_name" placeholder="Ad Soyad" className="rounded-lg border border-line px-3 py-2 text-xs" />
              <select name="eg_idType" defaultValue="TC" className="rounded-lg border border-line px-3 py-2 text-xs">
                <option value="TC">T.C. Kimlik No</option>
                <option value="PASAPORT">Pasaport No</option>
              </select>
              <input name="eg_idNumber" placeholder="Kimlik/pasaport no" className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input name="eg_birthDate" type="date" className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input name="eg_nationality" placeholder="Uyruk" defaultValue="T.C." className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input name="eg_phone" placeholder="Telefon (isteğe bağlı)" className="rounded-lg border border-line px-3 py-2 text-xs" />
              <input name="eg_fee" type="number" min={0} step={50} placeholder="Ek ücret ₺ (varsa)" className="rounded-lg border border-line px-3 py-2 text-xs" />
              <button
                type="button"
                onClick={() => removeRow(id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
              >
                Bu kişiyi kaldır
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
      >
        + Bir kişi daha ekle
      </button>
      <p className="mt-2 text-[11px] text-ink-soft">
        Ek ücret girerseniz toplam tutara otomatik eklenir. Bu kişileri sonradan da Müşteriler sayfasından
        ekleyebilirsiniz, burada girmeniz şart değil.
      </p>
    </div>
  );
}
