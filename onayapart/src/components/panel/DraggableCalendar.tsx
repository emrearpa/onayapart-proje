"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveReservation } from "@/app/(tr)/panel/actions";

type Cell = {
  date: Date;
  state: "DOLU" | "HARICI" | "BAKIM" | "TEMIZLIK" | "BOS";
  guest: string | null;
  reservationId: string | null;
  isStart: boolean;
};
type Row = { room: { id: string; number: number }; cells: Cell[] };

const CELL_CLASS: Record<Cell["state"], string> = {
  DOLU: "bg-brand-600 text-white",
  HARICI: "bg-violet-500 text-white",
  TEMIZLIK: "bg-gold-200 text-gold-700",
  BAKIM: "bg-danger-200 text-danger-700",
  BOS: "bg-white border border-line",
};

function fmtShort(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}
function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DraggableCalendar({ rows, days }: { rows: Row[]; days: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  function handleDrop(targetRoomId: string, targetDate: Date) {
    if (!dragging) return;
    const reservationId = dragging;
    setDragging(null);

    startTransition(async () => {
      const result = await moveReservation(reservationId, targetRoomId, toDateInput(targetDate));
      if (result.ok) {
        setBanner({ type: "ok", text: "Rezervasyon taşındı." });
        router.refresh();
      } else {
        setBanner({ type: "error", text: result.error ?? "Taşıma başarısız oldu." });
      }
      setTimeout(() => setBanner(null), 4000);
    });
  }

  return (
    <div>
      <p className="mb-2 text-xs text-ink-soft">
        Bir rezervasyonun başlangıç hücresini tutup başka bir gün/odaya sürükleyerek taşıyabilirsiniz.
      </p>

      {banner && (
        <div
          className={`mb-2 rounded-lg px-3 py-2 text-xs font-bold ${
            banner.type === "ok" ? "bg-brand-50 text-brand-700" : "bg-danger-50 text-danger-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className={`overflow-x-auto ${isPending ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[820px] border-separate border-spacing-[2px] text-xs">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-ink-soft">Oda</th>
              {rows[0]?.cells.map((c, i) => (
                <th key={i} className="text-[11px] font-semibold text-ink-soft">
                  {fmtShort(c.date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.room.id}>
                <td className="whitespace-nowrap pr-3 text-xs font-bold">{row.room.number}</td>
                {row.cells.map((c, i) => {
                  const isDraggable = c.isStart && c.state === "DOLU" && Boolean(c.reservationId);
                  return (
                    <td key={i}>
                      <div
                        draggable={isDraggable}
                        onDragStart={() => c.reservationId && setDragging(c.reservationId)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(row.room.id, c.date)}
                        title={c.guest ?? ""}
                        className={`grid h-7 place-items-center overflow-hidden rounded-md px-1 text-[10px] font-semibold transition ${
                          CELL_CLASS[c.state]
                        } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                      >
                        {c.isStart && c.guest ? c.guest.split(" ")[0] : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
