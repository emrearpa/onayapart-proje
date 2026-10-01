import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { addMonths, dayDiff, fmtMoney, overlaps } from "@/shared/lib/dates";
import { checked, num, optStr, parseDate, positiveNum, safeReturnPath, str } from "@/shared/lib/form";
import { normalizePhone } from "@/shared/lib/phone";
import { deleteUpload, isExternalUrl, readUpload, saveUpload } from "@/shared/lib/storage";
import { escapeHtml, fillPlaceholders, slugify, textToHtml } from "@/shared/lib/text";
import { locales, parseEnabledLocales } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("form yardimcilari", () => {
  it("metin alanlari kirpilir, bos alan null olur", () => {
    const fd = form({ ad: "  Ali  ", bos: "   " });
    assert.equal(str(fd, "ad"), "Ali");
    assert.equal(optStr(fd, "bos"), null);
    assert.equal(str(fd, "yok"), "");
  });

  it("gecersiz sayi veritabanina NaN olarak gitmez", () => {
    const fd = form({ a: "12.5", b: "abc", c: "-3", d: "" });
    assert.equal(num(fd, "a"), 12.5);
    assert.equal(num(fd, "b"), 0);
    assert.equal(num(fd, "d", 7), 7);
    assert.equal(positiveNum(fd, "c"), 0);
  });

  it("onay kutusu ve tarih", () => {
    assert.equal(checked(form({ x: "on" }), "x"), true);
    assert.equal(checked(form({ x: "true" }), "x"), true);
    assert.equal(checked(form({}), "x"), false);
    assert.equal(parseDate("2026-10-01")?.getFullYear(), 2026);
    assert.equal(parseDate("gecersiz"), null);
    assert.equal(parseDate(""), null);
  });

  it("geri donus adresi yalnizca site ici yol olabilir", () => {
    assert.equal(safeReturnPath("/panel/odalar/205", "/panel"), "/panel/odalar/205");
    assert.equal(safeReturnPath("/panel/odalar?x=1", "/panel"), "/panel/odalar");
    assert.equal(safeReturnPath("https://kotu.example", "/panel"), "/panel");
    assert.equal(safeReturnPath("//kotu.example", "/panel"), "/panel");
    assert.equal(safeReturnPath("/panel/../../x://y", "/panel"), "/panel");
    assert.equal(safeReturnPath("", "/panel"), "/panel");
  });
});

describe("metin yardimcilari", () => {
  it("telefon her yazim biciminde ayni numaraya iner", () => {
    for (const raw of ["0530 652 70 88", "+90 530 652 70 88", "905306527088", "530-652-7088", "00905306527088"]) {
      assert.equal(normalizePhone(raw), "905306527088");
    }
    assert.equal(normalizePhone(""), "");
  });

  it("slug Turkce karakterleri cevirir", () => {
    assert.equal(slugify("Çamaşır Makinesi"), "camasir-makinesi");
    assert.equal(slugify("IŞIK & Gölge"), "isik-golge");
    assert.equal(slugify("!!!", "yedek"), "yedek");
  });

  it("yer tutucular doldurulur, bilinmeyen oldugu gibi kalir", () => {
    assert.equal(fillPlaceholders("Merhaba {ad}, {oda} {x}", { ad: "Ali", oda: "205" }), "Merhaba Ali, 205 {x}");
  });

  it("HTML kacislanir", () => {
    assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    assert.equal(textToHtml("a<b\nc"), "a&lt;b<br>c");
  });
});

describe("tarih ve para", () => {
  it("cikis gunu yeni giris ile cakismaz", () => {
    const d = (day: number) => new Date(2026, 9, day);
    assert.equal(overlaps(d(1), d(5), d(5), d(8)), false);
    assert.equal(overlaps(d(1), d(5), d(4), d(8)), true);
    assert.equal(overlaps(d(1), d(5), d(2), d(3)), true);
  });

  it("gun farki ve ay ekleme", () => {
    assert.equal(dayDiff(new Date(2026, 0, 1), new Date(2026, 0, 31)), 30);
    assert.equal(addMonths(new Date(2026, 0, 15), 2).getMonth(), 2);
  });

  it("para bicimi", () => {
    assert.equal(fmtMoney(1250.5), "1.250,50 ₺");
    assert.equal(fmtMoney(0), "—");
  });
});

describe("diller", () => {
  it("acik diller metni ayristirilir", () => {
    assert.deepEqual(parseEnabledLocales("en, de,xx"), ["en", "de"]);
    assert.deepEqual(parseEnabledLocales("none"), []);
    assert.deepEqual(parseEnabledLocales(""), ["en", "ar", "fa", "ru"]);
  });

  it("her sozluk Turkce ile ayni anahtarlari tasir ve bos deger icermez", () => {
    const reference = getDictionary();
    for (const locale of locales) {
      const dict = getDictionary(locale);
      for (const [section, entries] of Object.entries(reference)) {
        for (const key of Object.keys(entries)) {
          const value = (dict as Record<string, Record<string, string>>)[section]?.[key];
          assert.ok(value && value.trim(), `${locale}.${section}.${key} eksik`);
        }
      }
    }
  });
});

describe("dosya deposu", () => {
  let dir: string;
  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "onayapart-test-"));
    process.env.UPLOAD_DIR = dir;
  });
  after(() => rm(dir, { recursive: true, force: true }));

  it("izinli dosya kaydedilir, okunur ve silinir", async () => {
    const saved = await saveUpload("odalar", new File([new Uint8Array([1, 2, 3])], "Salon Fotoğrafı.JPG"), "205");
    assert.ok(typeof saved !== "string");
    assert.match(saved.storedName, /^205-\d+-[0-9a-f]{12}\.jpg$/);
    assert.equal(saved.mimeType, "image/jpeg");

    const read = await readUpload("odalar", saved.storedName);
    assert.deepEqual(Array.from(read!.bytes), [1, 2, 3]);

    await deleteUpload("odalar", saved.storedName);
    assert.equal(await readUpload("odalar", saved.storedName), null);
  });

  it("izinsiz tur ve fazla buyuk dosya reddedilir", async () => {
    assert.equal(await saveUpload("odalar", new File(["<script>"], "kotu.html")), "BAD_TYPE");
    assert.equal(await saveUpload("odalar", new File(["x"], "belge.pdf")), "BAD_TYPE");
    assert.equal(await saveUpload("odalar", new File([new Uint8Array(9 * 1024 * 1024)], "dev.png")), "TOO_LARGE");
    assert.ok(typeof (await saveUpload("firma", new File(["x"], "belge.pdf"))) !== "string");
  });

  it("klasor disina cikan adlar okunamaz", async () => {
    for (const name of ["../../.env", "..\\..\\.env", "/etc/passwd", "a/b.jpg", ""]) {
      assert.equal(await readUpload("firma", name), null);
    }
  });

  it("harici adres ayirt edilir", () => {
    assert.equal(isExternalUrl("https://drive.google.com/x"), true);
    assert.equal(isExternalUrl("1700000000-abc.pdf"), false);
  });
});
