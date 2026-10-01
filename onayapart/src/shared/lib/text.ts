const TURKISH_ASCII: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

/** "Çamaşır Makinesi" -> "camasir-makinesi". Sonuc bos kalirsa fallback kullanilir. */
export function slugify(text: string, fallback = ""): string {
  const slug = text
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => TURKISH_ASCII[ch])
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Duz metni e-posta govdesi icin guvenli HTML'e cevirir. */
export function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

/** Sablon metnindeki {ad} {oda} gibi yer tutuculari doldurur; bilinmeyen anahtar oldugu gibi kalir. */
export function fillPlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
