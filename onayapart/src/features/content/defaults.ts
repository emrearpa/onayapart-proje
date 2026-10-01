// Ilk kurulumdaki varsayilan site ayarlari. Hem prisma/seed.ts hem de ayar satiri
// hic olusturulmamissa devreye giren guvenlik agi (getSiteSettings) buradan okur.
// Kurulumdan sonra tum degerler panelden (/panel/icerik) yonetilir.

export const SITE_SETTINGS_ID = "main";

export const DEFAULT_SITE_SETTINGS = {
  phoneDisplay: "0530 652 70 88",
  phoneHref: "+905306527088",
  whatsapp: "905306527088",
  addressStreet: "Muratpaşa Mah. Saraybosna Cad. Sabunhane Sk. No: 13",
  addressDistrict: "Yakutiye",
  addressCity: "Erzurum",
  addressPostalCode: "25000",
  heroEyebrow: "Erzurum'un merkezinde apart konaklama",
  heroTitle: "Erzurum apart daire arayanların ilk tercihi: Onay Apart Rezidans",
  heroIntro:
    "Yakutiye Muratpaşa'da, şehir merkezine yürüme mesafesinde tam donanımlı apart daireler. Günlük, haftalık, aylık ve öğrenci dönemlik konaklama seçenekleri.",
} as const;
