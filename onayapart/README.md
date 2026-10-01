# Onay Apart Rezidans

Apart otel için tanıtım sitesi ve arka ofis (ERP) yönetim paneli. Tek uygulama, tek veritabanı:
panelde yapılan her değişiklik siteye anında yansır.

- **Site** — oda tipleri, tek tek daire sayfaları, müsaitlik, SEO açılış sayfaları, 9 dilde çeviri, talep formu
- **Panel** (`/panel`) — rezervasyon, müşteri, ön muhasebe, personel, envanter, bakım, evrak, menü, bilgilendirme, site içeriği
- **Müşteri paneli** (`/musteri`) — misafirin rezervasyonları, bakiyesi, sözleşmesi, online ödeme, oda servisi, bakım talebi

Özelliklerin ayrıntılı anlatımı: [docs/ozellik-notlari.md](docs/ozellik-notlari.md)

## Teknolojiler

| Katman | Seçim |
|---|---|
| Uygulama | Next.js 14 (App Router, Server Components, Server Actions) · TypeScript · Node.js ≥ 18.18 |
| Arayüz | Tailwind CSS (marka renkleri `tailwind.config.ts` içinde) |
| Veritabanı | PostgreSQL + Prisma |
| Belgeler | pdf-lib (sözleşme ve rapor PDF'leri) |
| Entegrasyonlar | iyzico, WhatsApp Cloud API, NetGSM, Resend, TGA, Booking/Airbnb iCal — hepsi panelden açılıp kapatılır |

## Kurulum (yerel geliştirme)

```bash
npm install
cp .env.example .env      # değerleri doldurun (aşağıdaki tabloya bakın)
npm run setup             # tabloları oluşturur + başlangıç verisini yükler
npm run dev               # http://localhost:3000
```

Panel: `http://localhost:3000/panel` — şifre `.env` içindeki `PANEL_PASSWORD`.

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | evet | PostgreSQL bağlantısı |
| `NEXT_PUBLIC_SITE_URL` | evet | Sitenin yayındaki tam adresi (`https://alanadiniz.com`, sonunda `/` yok) |
| `PANEL_PASSWORD` | evet | Panel admin şifresi (en az 10 karakter). Değişince tüm oturumlar kapanır |
| `SESSION_SECRET` | evet | Oturum çerezlerini imzalayan anahtar, en az 32 karakter (`openssl rand -hex 32`) |
| `CRON_SECRET` | önerilir | Takvim senkron ucunun anahtarı. Yayında tanımlı değilse uç kapalıdır |
| `UPLOAD_DIR` | hayır | Yüklenen dosyaların klasörü (varsayılan `./private-uploads`) |

Sunucu açılırken eksik ya da zayıf ayarlar günlüğe `[ayar]` önekiyle yazılır.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` / `build` / `start` | Geliştirme sunucusu / üretim derlemesi / üretim sunucusu |
| `npm run check` | Tür denetimi + lint + testler (yayın öncesi tek komut) |
| `npm test` | Birim testleri (`tests/`) |
| `npm run db:migrate` | Bekleyen veritabanı değişikliklerini uygular (yayında bunu kullanın) |
| `npm run db:seed` | Başlangıç verisi; tekrar çalıştırmak güvenlidir, var olan kayıtlara dokunmaz |
| `npm run setup` | `db:migrate` + `db:seed` |

## Klasör yapısı (özellik bazlı)

Kod teknik türe göre değil, **işe göre** gruplanır. Bir özelliğe ait sorgu, işlem (server action),
bileşen ve sabitler aynı klasördedir; `app/` yalnızca adresleri bu özelliklere bağlar.

```
src/
├─ app/                      Yalnızca rotalar (ince dosyalar)
│  ├─ (tr)/                  Türkçe site, /panel ve /musteri
│  │  ├─ panel/(app)/        Oturum gerektiren panel sayfaları
│  │  └─ musteri/(portal)/   Oturum gerektiren müşteri paneli
│  ├─ [locale]/              Çeviri sitesi (/en, /ar, /de ...)
│  ├─ api/                   Dosya indirme, dışa aktarma, ödeme dönüşü, cron, sağlık kontrolü
│  └─ media/                 Yüklenen oda fotoğraflarının sunumu
├─ features/                 Her klasör bir iş alanı
│  ├─ auth/                  Oturum token'ı, şifre, izinler, yetki kontrolleri (guards)
│  ├─ rooms/                 Oda tipleri, daireler, müsaitlik, fotoğraf, demirbaş
│  ├─ reservations/          Rezervasyon, tahsilat, ek misafir, oda servisi, sözleşme
│  ├─ guests/                Müşteri kartı ve müşteri paneli işlemleri
│  ├─ accounting/            Kasa/banka, gelir-gider, raporlar, CSV/PDF, fatura, TGA
│  ├─ inventory/ staff/ documents/ maintenance/ menu/ leads/
│  ├─ messaging/             WhatsApp, SMS, e-posta gönderimi ve şablonlar
│  ├─ payments/              iyzico
│  ├─ calendar-sync/         Booking/Airbnb iCal içe-dışa aktarım
│  ├─ integrations/          Entegrasyon ayarları (tek satır)
│  ├─ content/               Site ayarları, SSS, yorumlar, çeviriler, SEO açılış metinleri
│  ├─ site/                  Herkese açık sitenin çerçevesi ve sayfa görünümleri (views)
│  ├─ dashboard/ audit/      Gösterge paneli özeti, işlem geçmişi
└─ shared/                   Özelliklerden bağımsız yapı taşları
   ├─ lib/                   db, env, form, tarih, metin, telefon, dosya deposu, http
   ├─ components/            Genel bileşenler (panel ikonları, arama kutusu ...)
   └─ i18n/                  Dil listesi ve sözlükler (tr + 9 dil)
```

Bir özellik klasöründe tipik dosyalar: `queries.ts` (okuma), `actions.ts` (yazma, `"use server"`),
`constants.ts` (saf veri), `components/`.

**Kurallar**

- `shared/` hiçbir özelliğe bağımlı olmaz; özellikler `shared/` ve birbirini kullanabilir.
- Türkçe ve çeviri sayfaları aynı görünümü (`features/site/views`) kullanır; fark yalnızca `locale` parametresidir.
- Arayüz metinleri `shared/i18n/dictionaries` içindedir. Yeni bir anahtar eklendiğinde bütün dillere eklenmesi
  derleme sırasında zorunlu tutulur.
- İşletmeye özgü veri (telefon, adres, oda tipleri, fiyat, SSS, menü, olanaklar) koda yazılmaz; panelden yönetilir.

## Güvenlik modeli

- **Oturum**: giriş sonrası `HttpOnly` + `Secure` + `SameSite=Lax`, HMAC imzalı ve süreli bir çerez yazılır.
  Çerezde şifre ya da tahmin edilebilir kimlik bulunmaz.
- **Üç katmanlı yetki**: `middleware.ts` imzayı doğrular → her panel sayfası → her server action kendi başında
  `requirePanel("izin")` / `requireAdmin()` / `requireGuest()` çağırır. Yeni bir action yazarken ilk satır bu olmalıdır;
  server action'lar herhangi bir adrese POST edilerek çağrılabildiği için middleware tek başına yeterli değildir.
- **Personel izinleri** her istekte veritabanından okunur: yetkisi alınan ya da pasife çekilen kullanıcı anında etkilenir.
- **Giriş denemeleri** IP başına sınırlandırılır (15 dakikada 8 deneme).
- **Yüklemeler** tür ve boyut denetiminden geçer, rastgele adla `UPLOAD_DIR` altına yazılır; özlük ve firma
  evrakları yalnızca yetki kontrolünden geçen API uçlarından okunur.

## Yayına alma

Her yöntemde ortak sıra: **ortam değişkenleri → `db:migrate` → `build` → `start`**.
Site **HTTPS** üzerinden yayınlanmalıdır (oturum çerezleri yalnızca HTTPS'te gönderilir).

> Sayfalar derleme sırasında veritabanından okunarak üretilir; bu yüzden `DATABASE_URL` derleme anında da
> erişilebilir olmalıdır.

### Vercel + yönetilen PostgreSQL (Neon, Supabase ...)

1. Depoyu Vercel'e bağlayın; *Root Directory* olarak bu klasörü seçin.
2. Ortam değişkenlerini girin (yukarıdaki tablo).
3. *Build Command*: `prisma migrate deploy && npm run build`
4. İlk yayından sonra bir kez başlangıç verisini yükleyin: kendi bilgisayarınızda `.env` içine üretim
   `DATABASE_URL`'ini yazıp `npm run db:seed`.

`vercel.json` takvim senkronunu her gün 06:00 (UTC) çalıştırır. Vercel diski kalıcı değildir: fotoğraf ve evrak
için panelde "adres (link)" alanını kullanın ya da kalıcı diskli bir sunucu tercih edin.

### Kendi sunucunuz (VPS) — Node + PM2 + Nginx

```bash
git clone <depo> && cd onayapart
npm ci
cp .env.example .env && nano .env        # UPLOAD_DIR'i kalıcı bir klasöre verin
npm run setup                            # ilk kurulumda; sonraki güncellemelerde: npm run db:migrate
npm run build
pm2 start npm --name onayapart -- start  # 3000 portunda dinler
pm2 save && pm2 startup
```

Nginx (TLS'i certbot ile ekleyin):

```nginx
server {
  server_name alanadiniz.com;
  client_max_body_size 16m;                      # fotoğraf/evrak yüklemeleri
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;   # üzerine yazın; giriş sınırlaması bu IP'ye göre çalışır
  }
}
```

Takvim senkronu için cron:

```cron
0 6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://alanadiniz.com/api/cron/sync-calendars
```

Güncelleme: `git pull && npm ci && npm run db:migrate && npm run build && pm2 restart onayapart`

### Docker

`docker-compose.yml` PostgreSQL ve uygulamayı birlikte çalıştırır; adımlar dosyanın başında yazılıdır.
Yüklenen dosyalar `uploads`, veritabanı `db-data` volume'ünde kalıcıdır. Sağlık kontrolü: `GET /api/health`.

### Daha önce `prisma db push` ile kurulmuş bir veritabanınız varsa

Tablolar zaten mevcut olduğundan ilk migration'ı "uygulanmış" olarak işaretleyin (veri değişmez):

```bash
npx prisma migrate resolve --applied 20261001000000_init
```

Sonrasında şema değişiklikleri için `npx prisma migrate dev --name <ad>` ile migration üretilir, yayında
`npm run db:migrate` çalıştırılır.

### Yayın öncesi kontrol listesi

- [ ] `PANEL_PASSWORD` güçlü, `SESSION_SECRET` ve `CRON_SECRET` rastgele üretilmiş
- [ ] `NEXT_PUBLIC_SITE_URL` gerçek alan adı
- [ ] Site HTTPS'te açılıyor, `/api/health` `{"status":"ok"}` dönüyor
- [ ] Panel → Site içeriği: telefon, adres, ana sayfa metni ve fotoğrafı girildi
- [ ] Panel → Odalar ve fiyatlar: fiyatlar ve daire fotoğrafları girildi
- [ ] Veritabanı ve `UPLOAD_DIR` için düzenli yedek kuruldu
- [ ] `https://alanadiniz.com/sitemap.xml` Google Search Console'a eklendi

## Bilinen sınırlar

- Tutarlar veritabanında ondalıklı sayı (`Float`) olarak tutulur; işletme içi ön muhasebe için yeterlidir, resmi
  muhasebe kaydının yerine geçmez.
- Giriş denemesi sayacı bellek içindedir: tek sunucuda tam çalışır, sunucusuz (çok örnekli) ortamda örnek başınadır.
- Dışarıya paylaşılan evrak linki (`/api/evrak-paylasim/...`) giriş gerektirmez; güvenliği adresin tahmin
  edilemezliğine dayanır. Hassas evrak için panel içi görüntülemeyi kullanın.
- Sözleşme metni bir başlangıç şablonudur; hukuki geçerlilik için bir avukata onaylatılmalıdır.
