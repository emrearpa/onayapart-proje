import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryLabel, isValidCategory } from "@/features/accounting/constants";
import { resolveRange } from "@/features/accounting/date-range";
import { buildIcs, parseIcs } from "@/features/calendar-sync/ical";
import { isSafeCalendarUrl } from "@/features/calendar-sync/sync";
import { buildCalendar } from "@/features/dashboard/queries";
import { DEFAULT_RATES, isPaymentMethod } from "@/features/reservations/constants";
import { currentPeriodKey } from "@/features/reservations/queries";
import { availabilityOf, roomCountFromTypeCode } from "@/features/rooms/availability";
import { roomNumberFromSlug, roomPath } from "@/features/rooms/paths";

const day = (d: number) => new Date(2026, 9, d);

describe("musaitlik", () => {
  const stay = { checkIn: day(10), checkOut: day(15) };

  it("aktif rezervasyon odayi dolu yapar, cikis gunu bosalir", () => {
    assert.equal(availabilityOf("MUSAIT", [{ ...stay, status: "ONAYLI" }], day(12)), "DOLU");
    assert.equal(availabilityOf("MUSAIT", [{ ...stay, status: "ONAYLI" }], day(15)), "MUSAIT");
    assert.equal(availabilityOf("MUSAIT", [{ ...stay, status: "ONAYLI" }], day(9)), "MUSAIT");
  });

  it("iptal ve tamamlanmis rezervasyon odayi tutmaz", () => {
    assert.equal(availabilityOf("MUSAIT", [{ ...stay, status: "IPTAL" }], day(12)), "MUSAIT");
    assert.equal(availabilityOf("MUSAIT", [{ ...stay, status: "TAMAMLANDI" }], day(12)), "MUSAIT");
  });

  it("oncelik: rezervasyon > harici > bakim/temizlik", () => {
    assert.equal(availabilityOf("BAKIM", [{ ...stay, status: "GIRIS_YAPTI" }], day(12), [stay]), "DOLU");
    assert.equal(availabilityOf("BAKIM", [], day(12), [stay]), "HARICI");
    assert.equal(availabilityOf("BAKIM", [], day(12)), "BAKIM");
    assert.equal(availabilityOf("TEMIZLIK", [], day(12)), "TEMIZLIK");
  });

  it("tip kodundan oda sayisi", () => {
    assert.equal(roomCountFromTypeCode("1+0"), 1);
    assert.equal(roomCountFromTypeCode("2+1"), 3);
    assert.equal(roomCountFromTypeCode("3 + 1"), 4);
    assert.equal(roomCountFromTypeCode("Dubleks"), 1);
  });

  it("adres parcasindan oda numarasi", () => {
    assert.equal(roomNumberFromSlug("oda-205"), 205);
    assert.equal(roomNumberFromSlug("oda-"), null);
    assert.equal(roomNumberFromSlug("oda-2a5"), null);
    assert.equal(roomNumberFromSlug("205"), null);
    assert.equal(roomPath({ number: 205, type: { slug: "1-1-apart-daire" } }), "/odalar/1-1-apart-daire/oda-205");
  });
});

describe("gosterge takvimi", () => {
  it("rezervasyon ve harici kayit hucrelere dogru yerlesir", () => {
    const rooms = [{ id: "r1", number: 101, condition: "TEMIZLIK", type: { code: "1+0" } }];
    const reservations = [{ id: "res1", roomId: "r1", checkIn: day(2), checkOut: day(4), guest: { fullName: "Ali Veli" } }];
    const external = [{ roomId: "r1", checkIn: day(5), checkOut: day(6), platform: "BOOKING" }];
    const [row] = buildCalendar(rooms, reservations, day(1), 6, external);

    assert.deepEqual(row.cells.map((c) => c.state), ["TEMIZLIK", "DOLU", "DOLU", "TEMIZLIK", "HARICI", "TEMIZLIK"]);
    assert.equal(row.cells[1].isStart, true);
    assert.equal(row.cells[2].isStart, false);
    assert.equal(row.cells[1].reservationId, "res1");
    assert.equal(row.cells[4].guest, "BOOKING");
  });
});

describe("iCal", () => {
  it("uretilen takvim geri okunabilir", () => {
    const ics = buildIcs([{ uid: "a@x", start: day(10), end: day(15), summary: "Dolu" }], "Oda 101");
    assert.deepEqual(parseIcs(ics), [{ uid: "a@x", start: day(10), end: day(15), summary: "Dolu" }]);
  });

  it("katlanmis satirlar, zaman damgali tarihler ve bitissiz etkinlik okunur", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:uzun-kimlik-",
      " devami@airbnb.com",
      "DTSTART:20261010T140000Z",
      "DTEND:20261012T100000Z",
      "SUMMARY:Reserved",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:tek-gun",
      "DTSTART;VALUE=DATE:20261020",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:kimliksiz etkinlik atlanir",
      "DTSTART;VALUE=DATE:20261020",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseIcs(text);
    assert.equal(events.length, 2);
    assert.equal(events[0].uid, "uzun-kimlik-devami@airbnb.com");
    assert.deepEqual([events[0].start, events[0].end], [day(10), day(12)]);
    assert.deepEqual([events[1].start, events[1].end], [day(20), day(21)]);
  });

  it("takvim adresi yalnizca genel https adresi olabilir", () => {
    assert.equal(isSafeCalendarUrl("https://www.airbnb.com/calendar/ical/1.ics"), true);
    for (const url of ["http://airbnb.com/x.ics", "https://localhost/x", "https://127.0.0.1/x", "https://10.0.0.5/x", "https://192.168.1.1/x", "https://169.254.169.254/latest", "file:///etc/passwd", "bozuk"]) {
      assert.equal(isSafeCalendarUrl(url), false, url);
    }
  });
});

describe("muhasebe", () => {
  it("rapor donemi cozulur", () => {
    const custom = resolveRange("ozel", "2026-03-01", "2026-03-31");
    assert.equal(custom.start.getDate(), 1);
    assert.equal(custom.end.getMonth(), 3); // bitis gunu dahil: 1 Nisan'a kadar
    assert.equal(resolveRange("bilinmeyen").preset, "bu-ay");
    assert.equal(resolveRange("ozel").preset, "bu-ay"); // tarihler verilmediyse varsayilan
  });

  it("kategori etiketi ture gore cozulur", () => {
    assert.equal(categoryLabel("GELIR", "DIGER"), "Diğer Gelir");
    assert.equal(categoryLabel("GIDER", "DIGER"), "Diğer Gider");
    assert.equal(isValidCategory("GELIR", "KIRA"), false);
    assert.equal(isValidCategory("GIDER", "KIRA"), true);
  });

  it("sabitler", () => {
    assert.equal(isPaymentMethod("KART"), true);
    assert.equal(isPaymentMethod("CEK"), false);
    assert.deepEqual(DEFAULT_RATES.map((r) => r.stayType), ["GUNLUK", "HAFTALIK", "AYLIK", "DONEMLIK", "YILLIK"]);
    assert.equal(currentPeriodKey(new Date(2026, 8, 5)), "2026-09");
  });
});
