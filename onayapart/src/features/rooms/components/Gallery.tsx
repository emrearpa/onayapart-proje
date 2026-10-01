"use client";

import { useState } from "react";

export default function Gallery({
  photos,
}: {
  photos: { url: string; alt: string }[];
}) {
  const [active, setActive] = useState(0);
  const current = photos[active];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt} className="h-full w-full object-cover" />
      </div>

      {photos.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`${p.alt} fotoğrafını göster`}
              aria-current={i === active}
              className={`overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-brand-500 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
