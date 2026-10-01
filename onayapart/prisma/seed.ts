import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TYPES = [
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
    features: [
      "Tek hacimde yatak ve oturma alanı",
      "Ankastre mutfak nişi",
      "Duşakabinli banyo",
      "Çalışma masası",
      "Gardırop ve ayakkabılık",
    ].join("\n"),
    sort: 1,
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
    features: [
      "Ayrı yatak odası",
      "Salon ve açık mutfak",
      "Çamaşır makinesi",
      "Yemek masası",
      "Balkon (seçili dairelerde)",
    ].join("\n"),
    sort: 2,
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
    features: [
      "İki ayrı yatak odası",
      "Geniş salon",
      "Tam donanımlı mutfak",
      "Ebeveyn ve misafir banyo düzeni",
      "Aileler ve gruplar için uygun",
    ].join("\n"),
    sort: 3,
    rooms: [107, 207, 305, 306, 401, 402],
    beds: "2 çift kişilik yatak + 1 çekyat",
  },
];

const RATES = [
  { stayType: "GUNLUK", label: "Günlük", sort: 1 },
  { stayType: "HAFTALIK", label: "Haftalık", sort: 2 },
  { stayType: "AYLIK", label: "Aylık", sort: 3 },
  { stayType: "DONEMLIK", label: "Öğrenci dönemlik", sort: 4 },
  { stayType: "YILLIK", label: "Yıllık", sort: 5 },
];

async function main() {
  console.log("Veriler yükleniyor...");

  const ACCOUNTS = [
    { name: "Kasa", type: "KASA", sort: 1 },
    { name: "Banka Hesabı", type: "BANKA", sort: 2 },
  ];
  for (const a of ACCOUNTS) {
    const existing = await prisma.account.findFirst({ where: { name: a.name } });
    if (!existing) await prisma.account.create({ data: a });
  }

  const INVENTORY_LOCATIONS = [
    { name: "Depo", type: "DEPO", sort: 1 },
    { name: "Kat Hizmetleri", type: "PERSONEL", sort: 2 },
  ];
  for (const l of INVENTORY_LOCATIONS) {
    await prisma.inventoryLocation.upsert({ where: { name: l.name }, update: {}, create: l });
  }

  const TEMPLATES = [
    {
      key: "odeme-hatirlatma",
      name: "Aylık ödeme hatırlatması",
      sort: 1,
      body:
        "Merhaba {ad}, Onay Apart Rezidans'tan yazıyoruz. {oda} numaralı dairenizin {tarih} tarihli aylık ödeme günü gelmiştir. Ödenecek tutar: {tutar}. Bilginize sunar, iyi günler dileriz.",
    },
    {
      key: "hosgeldiniz",
      name: "Hoş geldiniz mesajı",
      sort: 2,
      body:
        "Merhaba {ad}, Onay Apart Rezidans'a hoş geldiniz. {oda} numaralı daireniz hazırdır. Herhangi bir ihtiyacınızda bize ulaşabilirsiniz. İyi konaklamalar dileriz.",
    },
    {
      key: "genel-duyuru",
      name: "Genel duyuru",
      sort: 3,
      body: "Merhaba {ad}, Onay Apart Rezidans'tan bilgilendirme: ",
    },
    {
      key: "bakim-bilgilendirme",
      name: "Bakım bilgilendirmesi",
      sort: 4,
      body:
        "Merhaba {ad}, {oda} numaralı dairenizle ilgili ilettiğiniz talep için ekibimiz yönlendirilmiştir. En kısa sürede ilgilenip size bilgi vereceğiz.",
    },
  ];
  for (const t of TEMPLATES) {
    await prisma.messageTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
  }

  await prisma.integrationSetting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
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
        "Yakutiye Muratpaşa'da, şehir merkezine yürüme mesafesinde tam donanımlı 1+0, 1+1 ve 2+1 apart daireler. Günlük, haftalık, aylık ve öğrenci dönemlik konaklama seçenekleri.",
    },
  });

  const AMENITIES = [
    { icon: "wifi", label: "Ücretsiz fiber Wi-Fi", sort: 1 },
    { icon: "heat", label: "Doğalgaz ısıtma", sort: 2 },
    { icon: "kitchen", label: "Ankastre mutfak", sort: 3 },
    { icon: "laundry", label: "Çamaşır makinesi", sort: 4 },
    { icon: "lift", label: "Asansör", sort: 5 },
    { icon: "cam", label: "7/24 kameralı güvenlik", sort: 6 },
    { icon: "clean", label: "Haftalık temizlik", sort: 7 },
    { icon: "park", label: "Otopark imkânı", sort: 8 },
    { icon: "tv", label: "Smart TV", sort: 9 },
    { icon: "bed", label: "Nevresim ve havlu değişimi", sort: 10 },
    { icon: "water", label: "24 saat sıcak su", sort: 11 },
    { icon: "student", label: "Öğrenciye dönemlik fiyat", sort: 12 },
  ];
  for (const a of AMENITIES) {
    await prisma.amenity.upsert({ where: { icon: a.icon }, update: {}, create: a });
  }

  const FAQS = [
    { q: "Erzurum'da günlük kiralık apart daire fiyatları ne kadar?", a: "Fiyatlar oda tipine (1+0, 1+1, 2+1), konaklama süresine ve sezona göre değişir. Güncel fiyat ve müsaitlik için 0530 652 70 88 numaralı hattımızdan bize ulaşabilirsiniz.", homepage: true },
    { q: "Öğrenciler için dönemlik kiralama yapıyor musunuz?", a: "Evet. Erzurum'da öğrenim gören öğrencilerimiz için eğitim dönemine özel aylık ve dönemlik fiyatlandırma uygulanır; internet ve faturalar fiyata dahildir.", homepage: true },
    { q: "Apart dairelerde mutfak ve çamaşır makinesi var mı?", a: "Tüm dairelerimiz eşyalı ve beyaz eşyalıdır. Ankastre mutfak, buzdolabı, çamaşır makinesi ve mutfak gereçleri dairede hazır bulunur.", homepage: true },
    { q: "Rezervasyon nasıl yapılır, depozito alınıyor mu?", a: "Telefon veya WhatsApp üzerinden müsaitlik teyidi alınır. Uzun süreli konaklamalarda standart depozito uygulanır.", homepage: true },
    { q: "Giriş ve çıkış saatleri nedir?", a: "Giriş 14.00, çıkış 12.00'dir. Daire müsaitse erken giriş veya geç çıkış talebiniz karşılanabilir.", homepage: false },
    { q: "Otopark var mı?", a: "Bina çevresinde misafirlerimiz için otopark imkânı sağlanmaktadır; yoğun dönemlerde önceden bilgi vermenizi rica ederiz.", homepage: false },
    { q: "Evcil hayvan kabul ediliyor mu?", a: "Evcil hayvan kabulü daire ve dönem bazında değerlendirilir. Lütfen rezervasyon öncesinde bize bildirin.", homepage: false },
    { q: "Kimlik bildirimi yapılıyor mu?", a: "Evet. Konaklayan tüm misafirlerimizin kimlik bildirimi yasal zorunluluk gereği tarafımızca yapılır.", homepage: false },
  ];
  for (const [i, f] of FAQS.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: f.q } });
    if (!existing) {
      await prisma.faq.create({ data: { question: f.q, answer: f.a, homepage: f.homepage, sort: i + 1 } });
    }
  }

  for (const t of TYPES) {
    const { rooms, beds, ...data } = t;
    const type = await prisma.roomType.upsert({
      where: { code: t.code },
      update: data,
      create: data,
    });

    for (const r of RATES) {
      await prisma.rate.upsert({
        where: { typeId_stayType: { typeId: type.id, stayType: r.stayType } },
        update: {},
        // price 0 = sitede "Fiyat icin arayin" gosterilir, paneldeN guncellenir
        create: { ...r, typeId: type.id, price: 0 },
      });
    }

    for (const [i, number] of rooms.entries()) {
      await prisma.room.upsert({
        where: { number },
        update: {},
        create: {
          number,
          floor: Math.floor(number / 100),
          m2: t.minM2 + (i % 3) * 2,
          beds,
          view: i % 2 ? "Cadde cephesi" : "Arka cephe, sessiz",
          typeId: type.id,
          condition: "MUSAIT",
        },
      });
    }
  }

  const total = await prisma.room.count();

  // Eski dairelerde icalExportToken bos olabilir (alan sonradan eklendi) - doldur.
  const { randomUUID } = await import("crypto");
  const missingToken = await prisma.room.findMany({ where: { icalExportToken: null }, select: { id: true } });
  for (const r of missingToken) {
    await prisma.room.update({ where: { id: r.id }, data: { icalExportToken: randomUUID() } });
  }
  if (missingToken.length > 0) {
    console.log(`${missingToken.length} dairenin takvim anahtari (icalExportToken) dolduruldu.`);
  }

  console.log(`Tamamlandi: ${TYPES.length} oda tipi, ${total} daire.`);
  console.log("Fiyatlar 0 olarak birakildi; /panel > Odalar & Tipler ekranindan girin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
