// Baslangic verisi. Tekrar calistirmak guvenlidir: var olan kayitlara dokunmaz,
// yalnizca eksik olanlari tamamlar. Kurulumdan sonra her sey panelden yonetilir.
//
//   npm run db:seed

import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_ID } from "../src/features/content/defaults";
import { DEFAULT_RATES } from "../src/features/reservations/constants";

const prisma = new PrismaClient();

const ROOM_TYPES = [
  {
    code: "1+0",
    slug: "1-0-studyo-apart",
    name: "1+0 Stüdyo Apart",
    tagline: "Tek kişilik konaklama için ekonomik stüdyo daire",
    description:
      "Yatak ve oturma alanının tek hacimde çözüldüğü, ısıtması kolay ve pratik stüdyo dairelerimiz. Tek başına kalan çalışanlar ve öğrenciler için en ekonomik seçenek.",
    seoTitle: "Erzurum 1+0 Stüdyo Apart Daire",
    seoText:
      "Erzurum'da tek kişilik apart daire arayanlar için stüdyo tipi dairelerimiz; ankastre mutfak nişi, duşakabinli banyo ve çalışma masası ile eksiksiz bir konaklama sunar. Yakutiye merkezde, çarşıya ve toplu ulaşıma yürüme mesafesindedir.",
    minM2: 28,
    maxM2: 32,
    capacity: "1–2 kişi",
    features: ["Tek hacimde yatak ve oturma alanı", "Ankastre mutfak nişi", "Duşakabinli banyo", "Çalışma masası", "Gardırop ve ayakkabılık"],
    rooms: [101, 102, 103, 104, 201, 202, 203, 204],
    beds: "1 çift kişilik yatak",
  },
  {
    code: "1+1",
    slug: "1-1-apart-daire",
    name: "1+1 Apart Daire",
    tagline: "Ayrı yatak odalı, en çok tercih edilen daire tipimiz",
    description:
      "Salonu ve yatak odası ayrı, mutfağı tam donanımlı dairelerimiz. Çiftler, iş seyahatleri ve uzun dönem konaklamalar için en dengeli seçenek.",
    seoTitle: "Erzurum 1+1 Apart Daire",
    seoText:
      "Erzurum 1+1 apart daire arayanlar için salonu ve yatak odası ayrılmış, eşyalı ve beyaz eşyalı dairelerimiz. Çamaşır makinesi, ankastre mutfak ve doğalgaz ısıtma standarttır; aylık kiralamada faturalar dahildir.",
    minM2: 45,
    maxM2: 55,
    capacity: "2–3 kişi",
    features: ["Ayrı yatak odası", "Salon ve açık mutfak", "Çamaşır makinesi", "Yemek masası", "Balkon (seçili dairelerde)"],
    rooms: [105, 106, 205, 206, 301, 302, 303, 304],
    beds: "1 çift kişilik yatak + 1 çekyat",
  },
  {
    code: "2+1",
    slug: "2-1-apart-daire",
    name: "2+1 Apart Daire",
    tagline: "Aileler ve gruplar için geniş daire",
    description:
      "İki yatak odası ve geniş salonuyla kalabalık gruplara uygun dairelerimiz. Aileler, kayak grupları ve birlikte kalan öğrenciler için kişi başı en ekonomik çözüm.",
    seoTitle: "Erzurum 2+1 Apart Daire",
    seoText:
      "Erzurum'da aile veya grup konaklaması için 2+1 apart dairelerimiz; iki yatak odası, geniş salon ve tam donanımlı mutfak içerir. Palandöken kayak sezonunda gelen gruplar için ekipman saklama imkânı sağlanır.",
    minM2: 70,
    maxM2: 85,
    capacity: "4–5 kişi",
    features: ["İki ayrı yatak odası", "Geniş salon", "Tam donanımlı mutfak", "Ebeveyn ve misafir banyo düzeni", "Aileler ve gruplar için uygun"],
    rooms: [107, 207, 305, 306, 401, 402],
    beds: "2 çift kişilik yatak + 1 çekyat",
  },
];

const ACCOUNTS = [
  { name: "Kasa", type: "KASA", sort: 1 },
  { name: "Banka Hesabı", type: "BANKA", sort: 2 },
];

const INVENTORY_LOCATIONS = [
  { name: "Depo", type: "DEPO", sort: 1 },
  { name: "Kat Hizmetleri", type: "PERSONEL", sort: 2 },
];

// {ad} {oda} {tutar} {tarih} {kod} yer tutuculari gonderim aninda doldurulur.
const MESSAGE_TEMPLATES = [
  {
    key: "odeme-hatirlatma",
    name: "Aylık ödeme hatırlatması",
    body: "Merhaba {ad}, {oda} numaralı dairenizin {tarih} tarihli aylık ödeme günü gelmiştir. Ödenecek tutar: {tutar}. Bilginize sunar, iyi günler dileriz.",
  },
  {
    key: "hosgeldiniz",
    name: "Hoş geldiniz mesajı",
    body: "Merhaba {ad}, hoş geldiniz. {oda} numaralı daireniz hazırdır. Herhangi bir ihtiyacınızda bize ulaşabilirsiniz. İyi konaklamalar dileriz.",
  },
  { key: "genel-duyuru", name: "Genel duyuru", body: "Merhaba {ad}, bilgilendirme: " },
  {
    key: "bakim-bilgilendirme",
    name: "Bakım bilgilendirmesi",
    body: "Merhaba {ad}, {oda} numaralı dairenizle ilgili ilettiğiniz talep için ekibimiz yönlendirilmiştir. En kısa sürede ilgilenip size bilgi vereceğiz.",
  },
];

const AMENITIES = [
  ["wifi", "Ücretsiz fiber Wi-Fi"],
  ["heat", "Doğalgaz ısıtma"],
  ["kitchen", "Ankastre mutfak"],
  ["laundry", "Çamaşır makinesi"],
  ["lift", "Asansör"],
  ["cam", "7/24 kameralı güvenlik"],
  ["clean", "Haftalık temizlik"],
  ["park", "Otopark imkânı"],
  ["tv", "Smart TV"],
  ["bed", "Nevresim ve havlu değişimi"],
  ["water", "24 saat sıcak su"],
  ["student", "Öğrenciye dönemlik fiyat"],
];

const FAQS = [
  {
    question: "Günlük kiralık apart daire fiyatları ne kadar?",
    answer: "Fiyatlar oda tipine, konaklama süresine ve sezona göre değişir. Güncel fiyat ve müsaitlik için bize telefon veya WhatsApp üzerinden ulaşabilirsiniz.",
    homepage: true,
  },
  {
    question: "Öğrenciler için dönemlik kiralama yapıyor musunuz?",
    answer: "Evet. Öğrencilerimiz için eğitim dönemine özel aylık ve dönemlik fiyatlandırma uygulanır; internet ve faturalar fiyata dahildir.",
    homepage: true,
  },
  {
    question: "Apart dairelerde mutfak ve çamaşır makinesi var mı?",
    answer: "Tüm dairelerimiz eşyalı ve beyaz eşyalıdır. Ankastre mutfak, buzdolabı, çamaşır makinesi ve mutfak gereçleri dairede hazır bulunur.",
    homepage: true,
  },
  {
    question: "Rezervasyon nasıl yapılır, depozito alınıyor mu?",
    answer: "Telefon veya WhatsApp üzerinden müsaitlik teyidi alınır. Uzun süreli konaklamalarda standart depozito uygulanır.",
    homepage: true,
  },
  { question: "Giriş ve çıkış saatleri nedir?", answer: "Giriş 14.00, çıkış 12.00'dir. Daire müsaitse erken giriş veya geç çıkış talebiniz karşılanabilir.", homepage: false },
  { question: "Otopark var mı?", answer: "Bina çevresinde misafirlerimiz için otopark imkânı sağlanmaktadır; yoğun dönemlerde önceden bilgi vermenizi rica ederiz.", homepage: false },
  { question: "Evcil hayvan kabul ediliyor mu?", answer: "Evcil hayvan kabulü daire ve dönem bazında değerlendirilir. Lütfen rezervasyon öncesinde bize bildirin.", homepage: false },
  { question: "Kimlik bildirimi yapılıyor mu?", answer: "Evet. Konaklayan tüm misafirlerimizin kimlik bildirimi yasal zorunluluk gereği tarafımızca yapılır.", homepage: false },
];

async function seedSettings() {
  await prisma.siteSetting.upsert({ where: { id: SITE_SETTINGS_ID }, update: {}, create: { id: SITE_SETTINGS_ID, ...DEFAULT_SITE_SETTINGS } });
  await prisma.integrationSetting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
}

async function seedAccounting() {
  if ((await prisma.account.count()) === 0) await prisma.account.createMany({ data: ACCOUNTS });
  for (const location of INVENTORY_LOCATIONS) {
    await prisma.inventoryLocation.upsert({ where: { name: location.name }, update: {}, create: location });
  }
}

async function seedContent() {
  for (const [i, template] of MESSAGE_TEMPLATES.entries()) {
    await prisma.messageTemplate.upsert({ where: { key: template.key }, update: {}, create: { ...template, sort: i + 1 } });
  }
  for (const [i, [icon, label]] of AMENITIES.entries()) {
    await prisma.amenity.upsert({ where: { icon }, update: {}, create: { icon, label, sort: i + 1 } });
  }
  // SSS panelden serbestce duzenlenir; yalnizca tablo tamamen bossa ornek sorular yuklenir.
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({ data: FAQS.map((faq, i) => ({ ...faq, sort: i + 1 })) });
  }
}

async function seedRooms() {
  for (const [typeIndex, { rooms, beds, features, ...fields }] of ROOM_TYPES.entries()) {
    const data = { ...fields, features: features.join("\n"), sort: typeIndex + 1 };
    // Var olan tipin panelde duzenlenmis metinleri korunur.
    const type = await prisma.roomType.upsert({ where: { code: fields.code }, update: {}, create: data });

    for (const rate of DEFAULT_RATES) {
      await prisma.rate.upsert({
        where: { typeId_stayType: { typeId: type.id, stayType: rate.stayType } },
        update: {},
        create: { ...rate, typeId: type.id, price: 0 }, // 0 = sitede "fiyat icin arayin"
      });
    }

    for (const [i, number] of rooms.entries()) {
      await prisma.room.upsert({
        where: { number },
        update: {},
        create: {
          number,
          floor: Math.floor(number / 100),
          m2: fields.minM2 + (i % 3) * 2,
          beds,
          view: i % 2 ? "Cadde cephesi" : "Arka cephe, sessiz",
          typeId: type.id,
        },
      });
    }
  }

  // Takvim disa aktarim anahtari sonradan eklendi; eski dairelerde bos olabilir.
  const withoutToken = await prisma.room.findMany({ where: { icalExportToken: null }, select: { id: true } });
  for (const room of withoutToken) {
    await prisma.room.update({ where: { id: room.id }, data: { icalExportToken: randomUUID() } });
  }
}

async function main() {
  console.log("Başlangıç verisi yükleniyor...");
  await seedSettings();
  await seedAccounting();
  await seedContent();
  await seedRooms();

  const [types, rooms] = await Promise.all([prisma.roomType.count(), prisma.room.count()]);
  console.log(`Tamamlandı: ${types} oda tipi, ${rooms} daire.`);
  console.log("Fiyatlar 0 olarak bırakıldı; /panel > Odalar ve fiyatlar ekranından girin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
