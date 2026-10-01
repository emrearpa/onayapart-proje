"use client";

import { useState } from "react";

type Option = { key: string; label: string };
type Item = { id: string; name: string; unit: string };
type Location = { id: string; name: string; type: string };

export default function CategoryWithInventoryFields({
  expenseCategories,
  incomeCategories,
  items,
  locations,
}: {
  expenseCategories: Option[];
  incomeCategories: Option[];
  items: Item[];
  locations: Location[];
}) {
  const [category, setCategory] = useState("DIGER");
  const isEnvanter = category === "MALZEME";
  const depo = locations.find((l) => l.type === "DEPO") ?? locations[0];

  return (
    <>
      <label className="text-xs font-bold">
        Kategori
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
        >
          <optgroup label="Gider kategorileri">
            {expenseCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Gelir kategorileri">
            {incomeCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {isEnvanter && (
        <div className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-3 sm:col-span-2 sm:grid-cols-3 xl:col-span-3">
          <p className="text-xs font-bold text-brand-700 sm:col-span-3">
            📦 Hangi stok kalemi alınıyor? Kaydettiğinizde stok otomatik olarak işlenir.
          </p>
          {items.length === 0 ? (
            <p className="text-xs text-ink-soft sm:col-span-3">
              Önce Envanter sayfasından en az bir stok kalemi eklemelisiniz, yoksa stok otomatik işlenmez.
            </p>
          ) : (
            <>
              <label className="text-xs font-bold">
                Kalem
                <select name="inventoryItemId" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Miktar
                <input name="inventoryQuantity" type="number" min={0} step={1} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Hangi konuma girsin
                <select name="inventoryLocationId" defaultValue={depo?.id} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      )}
    </>
  );
}
