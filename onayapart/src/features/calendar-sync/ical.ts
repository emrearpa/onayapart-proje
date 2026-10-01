// Basit, bagimsiz bir iCal (.ics) okuyucu/yazici. Booking.com ve Airbnb'nin
// urettigi/kabul ettigi standart, tum-gun (VALUE=DATE) etkinlik formatina
// odaklanir - disaridan bir kutuphane eklemeden calisir.

export type IcsEvent = { uid: string; start: Date; end: Date; summary: string };

function unfoldLines(text: string): string[] {
  // ics standardinda uzun satirlar bir sonraki satira bosluk/tab ile devam eder.
  const raw = text.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

/** "DTSTART;VALUE=DATE:20261015" gibi bir satirdan sadece deger kismini (20261015...) ayirir. */
function valueOf(line: string): string {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1).trim();
}

function parseIcsDate(value: string): Date | null {
  const v = value.trim();
  // Tum gun: YYYYMMDD
  const dateOnly = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // Zaman damgali: YYYYMMDDTHHMMSS(Z)
  const withTime = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (withTime) {
    const [, y, m, d] = withTime;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}

/** Bir .ics metnindeki tum VEVENT'leri (UID, baslangic, bitis, aciklama) cikarir. */
export function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldLines(text);
  const events: IcsEvent[] = [];

  let inEvent = false;
  let uid = "";
  let start: Date | null = null;
  let end: Date | null = null;
  let summary = "";

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      uid = "";
      start = null;
      end = null;
      summary = "";
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (inEvent && uid && start) {
        // DTEND verilmemis tum-gun etkinlik standartta tek gun surer.
        const fallbackEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        events.push({ uid, start, end: end && end > start ? end : fallbackEnd, summary });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("UID")) uid = valueOf(line);
    else if (line.startsWith("DTSTART")) start = parseIcsDate(valueOf(line));
    else if (line.startsWith("DTEND")) end = parseIcsDate(valueOf(line));
    else if (line.startsWith("SUMMARY")) summary = valueOf(line);
  }

  return events;
}

function toIcsDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Rezervasyonlardan Booking.com/Airbnb'nin ice aktarabilecegi bir .ics metni uretir. */
export function buildIcs(events: IcsEvent[], calendarName: string): string {
  const now = new Date();
  const stamp =
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}` +
    `T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Onay Apart//ERP//TR", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${calendarName}`];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(e.start)}`,
      `DTEND;VALUE=DATE:${toIcsDate(e.end)}`,
      `SUMMARY:${e.summary.replace(/[\r\n]/g, " ")}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
