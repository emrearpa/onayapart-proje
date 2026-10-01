# Onay Apart Rezidans — onayapart.com

Erzurum Yakutiye'deki Onay Apart Rezidans için tanıtım sitesi ve arka ofis (ERP) yönetim paneli.
Tek proje, tek veritabanı: paneldeki her değişiklik siteye yansır.

## Kurulum (5 dakika)

Bilgisayarında Node.js 18+ kurulu olmalı. Ayrıca bir PostgreSQL veritabanı bağlantısı gerekir — en hızlısı
[neon.tech](https://neon.tech)'ten ücretsiz bir tane açmak (kredi kartı istemez, 2 dakika sürer). Detaylı adımlar
aşağıdaki **"Ücretsiz demo yayını"** bölümünde.

```bash
npm install          # paketleri kurar
cp .env.example .env # ayar dosyasını oluşturur — sonra .env içindeki DATABASE_URL'i kendi Postgres bağlantınla değiştir
npm run setup        # veritabanını kurar + 22 daireyi yükler
npm run dev          # http://localhost:3000
```

Panel: http://localhost:3000/panel — şifre `.env` dosyasındaki `PANEL_PASSWORD` (varsayılan: onay2026).
**Yayına almadan önce bu şifreyi mutlaka değiştir.**

## Kullanılan teknolojiler

| Katman | Seçim | Neden |
|---|---|---|
| Arayüz | Next.js 14 (React + TypeScript) | Sayfalar sunucuda üretilir, Google için en hızlı ve en okunaklı yapı |
| Stil | Tailwind CSS | Marka renkleri tek yerden yönetiliyor (`tailwind.config.ts`) |
| Veritabanı | Prisma + SQLite (geliştirme) / PostgreSQL (yayın) | Kurulum kolay, yayında ölçeklenir |
| Panel | Next.js Server Actions | Ayrı bir arka uç sunucusu gerekmiyor |

## Klasör yapısı

```
prisma/schema.prisma      Veri modeli (oda, rezervasyon, tahsilat, gider, talep)
prisma/seed.ts            Başlangıç verisi: 3 oda tipi, 22 daire
src/lib/site.ts           Telefon, adres, olanaklar — işletme bilgileri burada
src/lib/queries.ts        Müsaitlik hesabı ve panel özetleri
src/app/                  Sayfalar
  page.tsx                Ana sayfa
  odalar/                 Oda listesi → tip → tek daire sayfası
  gunluk-.../ aylik-.../  SEO açılış sayfaları
  panel/                  ERP paneli (şifre korumalı, Google'a kapalı)
src/components/           Arayüz parçaları
```

## Site adresleri

| Adres | İçerik |
|---|---|
| `/` | Ana sayfa — oda tipleri, olanaklar, konum, SSS |
| `/odalar` | Tüm daireler |
| `/odalar/1-1-apart-daire` | Oda tipi sayfası |
| `/odalar/1-1-apart-daire/oda-205` | Tek dairenin kendi sayfası |
| `/gunluk-kiralik-apart-erzurum` | Günlük konaklama açılış sayfası |
| `/aylik-kiralik-apart-erzurum` | Aylık konaklama açılış sayfası |
| `/erzurum-ogrenci-apart` | Öğrenci konaklaması açılış sayfası |
| `/sss`, `/iletisim` | Destek sayfaları |
| `/sitemap.xml`, `/robots.txt` | Otomatik üretilir |

## Panelden yönetilenler (artık geliştirici gerekmiyor)

Oda tipleri ve daireler tamamen panelden yönetilir — kod değiştirmeye gerek yok:

- **Oda tipleri** (`/panel/tipler`): yeni tip ekle (örn. 3+1), isim/açıklama/SEO metnini düzenle, kullanılmayan tipi sil.
  Yeni tip oluşturunca günlük/haftalık/aylık/dönemlik fiyat satırları otomatik açılır.
- **Daireler** (`/panel/odalar`): yeni daire ekle, tip/kat/m²/yatak düzeni gibi bilgileri düzenle, sil.
  Her dairede "Dairede neler var?" bölümünü kutucuklarla işaretlersin (Wi-Fi, otopark, balkon vb.) — hangi daire
  hangi olanağa sahipse sadece o işaretlenir, sitede o dairenin kendi sayfasında öyle görünür.
- **Fotoğraflar** (`/panel/odalar/[numara]`): bilgisayardan dosya yükle veya bir görsel adresi yapıştır, istediğin
  fotoğrafı sil. Fotoğraf yoksa site marka renginde bir görsel gösterir, hiçbir zaman boş kalmaz.
- **Site içeriği** (`/panel/icerik`): telefon, WhatsApp, adres, ana sayfanın başlık/açıklama metni, "Dairede neler
  var?" olanaklar listesi ve sıkça sorulan sorular — hepsi burada. Bu ekrandaki her değişiklik siteyi kullanan tüm
  sayfalara (header, footer, WhatsApp linkleri, JSON-LD verisi dahil) otomatik yansır.

Günlük/aylık/öğrenci konaklama sayfalarındaki (SEO açılış sayfaları) uzun tanıtım metinleri şimdilik kodun içinde
kalıyor — bunlar her sayfaya özel, arama motoru için özenle yazılmış metinler olduğundan genel içerik ekranına
katmadım. Değiştirmek istersen bana söylemen yeterli.

## Müşteri kaydı, sözleşme, müşteriler ve müşteri paneli

- **Rezervasyon oluştururken** artık kimlik bilgileri de alınıyor: T.C./pasaport no, doğum tarihi, uyruk, e-posta,
  ikamet adresi. Aynı telefon numarasıyla daha önce kayıt açılmışsa yeni bir müşteri oluşturmaz, mevcut müşteriyi
  günceller — böylece bir müşterinin tüm geçmişi tek yerde toplanır.
- **Sözleşme otomatik hazırlanır.** Rezervasyonlar tablosundaki veya müşteri detayındaki "İndir" linkine tıklandığında
  taraf bilgileri, oda ve konaklama detayları, genel şartlar ve imza alanlarını içeren bir PDF anında oluşturulup
  indirilir. Bu, **başlangıç şablonu** olarak yazılmıştır — hukuki bağlayıcılığı garanti etmek için bir avukata
  gösterip onaylatmanı öneririm, ben avukat değilim.
- **Müşteriler** (`/panel/musteriler`): her müşterinin tüm konaklama geçmişi (hangi oda, hangi tarihte), borç/alacak
  durumu, kimlik bilgileri ve müşteri paneline giriş kodu tek ekranda.
- **Bakım talepleri** (`/panel/bakim-talepleri`): hem sizin girdiğiniz hem müşterilerin kendi panelinden gönderdiği
  arıza/bakım talepleri burada toplanır; "Tamamlandı işaretle" ile kapatılır. Açık talepler ayrıca gösterge panelinde
  de görünür.
- **Gösterge panelinde tahsilat uyarısı**: aylık/dönemlik/kurumsal konaklaması olan ve ödeme günü (giriş tarihinin
  ayın kaçına denk geldiği) yaklaşan veya geçmiş olup hâlâ bakiyesi olan müşteriler turuncu bir kutuda listelenir.
- **Müşteri paneli** (`onayapart.com/musteri`): müşteri, rezervasyonda verdiği telefon numarası ve kendisine verilen
  6 haneli giriş koduyla girer (kod, Müşteriler ekranındaki detay sayfasında görünür/yenilenebilir). Kendi
  rezervasyonlarını, bakiyesini, sözleşmesini görür ve "televizyon bozuk" gibi bir bakım talebi oluşturabilir.

**Bilinmesi gereken bir sınırlama:** müşteri paneli girişinde telefon numarası, rezervasyon açılırken girilen haliyle
**birebir aynı** yazılmalı (boşluklu/boşluksuz fark eder). Müşteriye numarasını nasıl kaydettiyseniz o şekilde
söylemeniz gerekiyor; istersen bunu daha esnek hale getirebiliriz.

## Konaklama tipleri ve yıllık ödeme planı

Sistemde 6 konaklama tipi var: Günlük, Haftalık, Aylık, Öğrenci dönemlik, **Yıllık**, Kurumsal. Öğrenci dönemliği
kaldırmadım — Erzurum öğrenci apart sayfası ve fiyatlandırma ona bağlı; kaldırmamı istersen söylemen yeterli.

**Yıllık** konaklamada girilen toplam bedel otomatik olarak 12 eşit taksite bölünür. Giriş tarihinin ayın kaçına denk
geldiği esas alınır: her ay o gün geldiğinde (veya geçtiğinde), o taksit hâlâ ödenmemişse gösterge panelindeki
"Tahsilat gereken müşteriler" kutusunda **"Yıllık taksit"** etiketiyle görünür. Birden fazla ay atlanmışsa, birikmiş
eksik tutarın tamamı tek seferde gösterilir. Sözleşme metnine de bu ödeme planını açıklayan bir madde eklendi.

Mevcut projenizde bu güncellemeyi almak için `npm run setup`'ı tekrar çalıştırın — bu, her oda tipine "Yıllık" fiyat
satırını ekler (var olan verilerinize dokunmaz, sadece eksik olanı tamamlar).

## Ön Muhasebe ve Personel

- **Ön Muhasebe** (`/panel/muhasebe`): kasa ve banka/POS hesapları (istediğiniz kadar ekleyebilirsiniz), gelir-gider
  kaydı girme (fatura, kira, bakım-onarım, vergi, diğer), rezervasyon tahsilatlarının otomatik işlendiği "son
  hareketler" defteri, kredi kartıyla tahsil edilen tutarın ayrı gösterildiği kart, ve son 12 ayın gelir/gider/kâr-zarar
  tablosu — hepsi tek ekranda.
- **Personel** (`/panel/personel`): çalışan kaydı, maaş bilgisi, "Maaş öde" butonu ile ödeme girişi. Her maaş ödemesi
  otomatik olarak Ön Muhasebe defterinde gider olarak görünür, ayrıca çalışanın kendi geçmişinde de listelenir.
- Rezervasyon tahsilatı alırken (Rezervasyonlar ekranındaki "Tahsilat gir" formu) artık hangi kasaya/hesaba girdiğini
  de seçiyorsunuz; bu sayede kasa ve banka bakiyeleri gerçek zamanlı ve doğru kalır.

**Önemli sınır:** Bu modül işletme içi takip ve raporlama için tasarlandı — e-fatura, e-defter, KDV/muhtasar
beyannameleri gibi resmi mükellefiyetlerin yerine geçmez. Resmi muhasebe kayıtlarınız için mali müşavirinizle
çalışmaya devam etmeniz gerekiyor; bu ekran onun işini kolaylaştıracak bir ön hazırlık/özet niteliğindedir.

## Özlük dosyası ve sınırlı yetkili kullanıcılar

- **Özlük dosyası** (`/panel/personel/[id]`, yalnızca tam admin girişiyle): her personelin T.C. kimlik no, doğum
  tarihi, adres gibi kişisel bilgilerini tutar; kimlik fotokopisi, diploma, sağlık raporu, iş sözleşmesi gibi işe
  başvuru evraklarını tarayıp yükleyebilirsiniz. Bu dosyalar `public/` klasörünün dışında, `private-uploads/`
  içinde saklanır ve yalnızca admin girişi doğrulanarak `/api/ozluk/...` üzerinden açılabilir — tahmin edilebilir bir
  linkle dışarıdan erişilemez.
- **Sınırlı yetkili kullanıcılar**: aynı sayfadan, bir personele panelin **yalnızca seçtiğiniz bölümlerini**
  görebileceği kendi kullanıcı adı/şifresini tanımlayabilirsiniz. Örneğin tamir-bakım işlerine bakan birine sadece
  "Bakım talepleri" yetkisi verirseniz, o kişi kendi kullanıcısıyla giriş yaptığında yalnızca o ekranı görür; müşteri
  bilgilerine, muhasebeye veya diğer bölümlere erişemez. Giriş ekranındaki "Personel girişi" bölümünden, kendilerine
  verdiğiniz kullanıcı adı ve şifreyle giriş yaparlar.
- Tüm sınırlı yetkili kullanıcıların genel listesi **Kullanıcılar** ekranında (`/panel/kullanicilar`, yalnızca tam
  admin) görülebilir; yetki değiştirme veya şifre sıfırlama ilgili personelin özlük dosyası sayfasından yapılır.
- Güvenlik notu: özlük dosyası ve kullanıcı yetki yönetimi, bir personele "Personel" yetkisi verilmiş olsa bile
  **sadece tam admin girişiyle** açılır — böylece sınırlı yetkili bir kullanıcı kendine veya başkasına fazladan yetki
  tanımlayamaz. Personel listesindeki maaş ödeme gibi günlük işlemler ise "Personel" yetkisi verilen kullanıcılarla
  paylaşılabilir.

## Ön Muhasebe — sayfa yapısı

`/panel/muhasebe` artık tek bir uzun sayfa değil, üstteki **5 büyük renkli butonla** ayrı ekranlara bölündü:

- **İşlem Yap** (`/islem`, yeşil) — fatura, kira, bakım-onarım gibi gelir/gider kayıtlarını buradan girersiniz.
- **Kasa Hareketleri** (`/kasa`, altın sarısı) — nakit kasa hesaplarınızın bakiyesi ve dönem içi tüm hareketleri.
- **Banka Hareketleri** (`/banka`, lacivert) — banka/POS hesaplarınızın aynısı.
- **Pos İşlemleri** (`/pos`, mor) — sadece kredi kartıyla yapılan tahsilat ve ödemeler, ayrı bir listede.
- **Rapor** (`/rapor`, koyu yeşil) — tarih aralığı seçici, KPI özetleri, aylık gelir/gider grafiği, gider kategori
  pastası, kasa/banka dönem özeti, tüm hareketler listesi ve son 12 ayın kâr/zarar tablosu. Bu sayfada **"PDF olarak
  indir"** ve **"Excel (CSV) olarak indir"** butonları var — seçtiğiniz tarih aralığına göre tam bir rapor dosyası
  iner. Kasa, Banka, Pos ve Hesap ekstresi sayfalarının her birinde de kendi verisini indiren bir Excel (CSV) linki
  bulunur; CSV dosyaları Türkçe Excel'de doğrudan açılır (noktalı virgül ayraç, virgüllü ondalık, Türkçe karakter
  desteği ile). Mali müşavirinize göndermek veya kendi arşivinizde tutmak için bu dosyaları kullanabilirsiniz.

Ana sayfa (`/panel/muhasebe`) bu 5 butonun altında sade bir özet gösterir: bu ayın gelir/gider/kâr-zarar kartları,
kasa/banka bakiyeleri ve son 10 hareket. Detaya girmek istediğinizde ilgili butona tıklamanız yeterli. Yeni kasa/banka
hesabı eklemek hâlâ ana sayfada.

**Hesap ekstresi** (`/panel/muhasebe/ekstre`) ayrı bir yardımcı sayfa olarak kaldı: tek bir hesabın devir bakiyesi,
dönem içi tüm hareketleri ve her satırda yürüyen bakiyesiyle dönem sonu bakiyesini gösterir; Kasa/Banka sayfalarındaki
"Detaylı ekstre" linkinden açılır.

## Bilgilendirme (WhatsApp)

`/panel/bilgilendirme` ekranından müşterilere tekli veya toplu mesaj gönderebilir, ödeme günü gelenlere hatırlatma
yapabilirsiniz. Mesaj şablonlarında `{ad}`, `{oda}`, `{tutar}`, `{tarih}`, `{kod}` yer tutucuları her müşteri için
otomatik doldurulur. Tüm gönderimler kayıt altına alınır.

**WhatsApp gönderimi hakkında dürüst açıklama — bunu bilmeniz önemli:**

Sistem iki modda çalışır:

1. **Yarı otomatik (varsayılan):** "Gönder" dediğinizde WhatsApp hazır mesajla açılır, siz tek tıkla yollarsınız.
   Kurulum gerektirmez, hemen çalışır. Toplu gönderimde mesajlar hazırlanıp kaydedilir ama her birini elle
   göndermeniz gerekir.
2. **Tam otomatik:** Bilgilendirme ekranındaki API ayarlarına Meta'dan aldığınız Phone Number ID ve Access Token
   bilgilerini girerseniz, sistem mesajları kendi kendine gönderir.

Tam otomatik mod için **Meta'dan WhatsApp Business API hesabı açmanız gerekir** (ücretli, başvuru ve doğrulama
süreci var). Ayrıca Meta'nın kuralı gereği, müşteri size son 24 saat içinde yazmadıysa serbest metin mesaj
gönderilemez — bu durumda önceden Meta'ya onaylattığınız bir **şablon (template)** kullanmak gerekir. Onaylı
şablonlarınız olduğunda kodu şablon gönderimine çevirmemiz gerekir; bunu birlikte yaparız.

**Ödeme hatırlatması:** Aylık, dönemlik, yıllık ve kurumsal konaklamalarda ödeme günü gelmiş/geçmiş ve borcu olan
müşteriler Bilgilendirme ekranında listelenir. Tek tek veya "Tümüne gönder" ile hatırlatma yapabilirsiniz. Aynı
müşteriye aynı ay içinde ikinci kez hatırlatma gitmez (sistem gönderim kaydına bakarak engeller).


`prisma/seed.ts` içindeki 3 tip / 22 daire yalnızca **örnek başlangıç verisi**. Gerçek daire numaralarını, tiplerini
ve fotoğraflarını panelden gireceğin için bu listeyi bana vermen gerekmiyor — istersen `npm run db:seed` hiç
çalıştırmadan da boş başlayıp her şeyi panelden ekleyebilirsin.

**Önemli not — fotoğraf yükleme:** Dosya yükleme, kalıcı diski olan bir sunucuda (kendi VPS'in) sorunsuz çalışır.
Vercel gibi sunucusuz barındırmalarda yüklenen dosyalar kalıcı olmayabilir; o durumda "görsel adresi yapıştır"
seçeneğini kullan ya da bana haber ver, Cloudflare R2 gibi kalıcı bir görsel deposuna bağlayalım.

## Giriş ekranı

`/panel/giris` artık tek bir kart yerine canlı bir karşılama ekranı: koyu yeşil zemin üzerinde sıcak bir altın parlama,
Admin/Personel arasında akıcı geçiş yapan bir sekme anahtarı, ve altında misafirleri kendi girişlerine (`/musteri/giris`)
yönlendiren ayrı, vurgulu bir kart. Bir personel şifresini yanlış girerse sayfa otomatik olarak Personel sekmesinde
açılır, hatayı orada gösterir.

## WiFi bilgisi

Müşteri detay sayfasında (`/panel/musteriler/[id]`) artık bir **WiFi bilgisi** alanı var — ağ adı (SSID) ve şifreyi
o misafire özel olarak girip kaydedebilirsiniz. Kaydettiğinizde bu bilgi otomatik olarak müşterinin kendi panelinde
(`/musteri`) üstte, altın renkli bir kartla gösterilir. İkisi de boşsa bu kart hiç görünmez.

## Panel tasarımı

Gösterge paneli ve Ön Muhasebe artık gerçek grafiklerle çalışıyor (recharts kütüphanesi ile, native derleme
gerektirmeyen saf JS bir paket — kuruluma ekstra onay adımı getirmez):

- **Gösterge paneli**: son 14 günün gelir trendini gösteren bir alan grafiği, ikonlu ve trend yüzdeli özet kartlar,
  renk kodlu oda durum takvimi.
- **Ön Muhasebe**: son 6 ayın gelir/gider çubuk grafiği, gider kategorilerinin dağılımını gösteren pasta grafiği,
  ödeme yöntemi (nakit/kart/havale) çubukları.
- **Müşteriler** ve **Bakım talepleri** ekranlarına özet kartları eklendi.
- Tüm büyük tablolarda satır üzerine gelince hafif renk vurgusu var.

Renk kullanımı işlevsel: yeşil = gelir/sağlıklı durum, kırmızı = gider/risk, altın sarısı = dikkat gerektiren durum
— süs amaçlı değil, veriyi okumayı kolaylaştırmak için.

## Demirbaşlar

Her dairenin kendi detay sayfasında (`/panel/odalar/[numara]`) artık bir **Demirbaşlar** bölümü var: televizyon,
buzdolabı, yatak gibi eşyaları isim/adet/not olarak ekleyip düzenleyebilir, silebilirsiniz. Bu liste odaya özeldir —
her daire farklı demirbaşlara sahip olabilir.

O daireye bir rezervasyon açıldığında, otomatik üretilen sözleşmeye **"Odada Bulunan Demirbaşlar"** başlığıyla bu
liste eksiksiz eklenir; misafir demirbaşları eksiksiz teslim aldığını kabul eden bir cümleyle birlikte. Bir daire
için henüz demirbaş girilmemişse sözleşmede bu açıkça belirtilir, boş bırakılmaz.

## Ücretsiz demo yayını (domain almadan, müşteriye göstermek için)

Bu proje artık PostgreSQL kullanacak şekilde hazır (`prisma/schema.prisma`). Vercel (ücretsiz Hobby planı) + Neon
(ücretsiz Postgres) ile alan adı almadan, kredi kartı vermeden, `senin-projen.vercel.app` gibi gerçek bir linkle
yayına alabilirsin. Adımlar:

**1) Ücretsiz Postgres veritabanı aç (Neon)**
- [neon.tech](https://neon.tech) adresine git, ücretsiz hesap aç (GitHub/Google ile de girebilirsin)
- "Create a project" de, bir proje adı ver (örn. `onayapart`)
- Oluşturunca sana bir **connection string** verir, `postgresql://...` ile başlayan uzun bir satır — onu kopyala

**2) Bağlantı bilgisini projene yaz**
- Proje klasöründeki `.env` dosyasını aç, `DATABASE_URL="..."` satırındaki değeri Neon'dan kopyaladığın connection
  string ile değiştir
- `PANEL_PASSWORD` değerini de gerçek bir şifreyle değiştir (demo olsa da tahmin edilmesi kolay bir şey bırakma)

**3) Veritabanını Neon üzerinde kur**
Terminalde proje klasöründe:
```
npm run setup
```
Bu, tabloları Neon'daki veritabanında oluşturur ve örnek verileri (oda tipleri, olanaklar, mesaj şablonları vb.)
yükler.

**4) Vercel'e yükle**
- [vercel.com](https://vercel.com) adresine git, ücretsiz hesap aç
- Bilgisayarına Vercel'in komut satırı aracını kur: terminalde `npm install -g vercel` yaz
- Aynı terminalde `vercel login` yaz, açılan tarayıcı sekmesinden hesabını onayla
- Proje klasöründeyken `vercel` yaz, çıkan soruları varsayılan cevaplarla geç (Enter'a basman çoğunlukla yeterli)
- İlk yükleme bittiğinde sana bir link verir (örn. `onayapart-xyz.vercel.app`) — ama siteye girmeden önce 5. adımı
  yap, yoksa veritabanı bağlantısı olmadığı için hata verir

**5) Ortam değişkenlerini Vercel'e tanıt**
- Vercel'in web panelinde projene gir → **Settings → Environment Variables**
- `.env` dosyandaki üç satırı (`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `PANEL_PASSWORD`) burada da tek tek ekle
  (`NEXT_PUBLIC_SITE_URL` için şimdilik Vercel'in sana verdiği `.vercel.app` adresini yazabilirsin)
- Ekledikten sonra terminalde tekrar `vercel --prod` yaz, bu son hâliyle canlıya alır

**6) Müşteriye göster**
Vercel'in verdiği `https://....vercel.app` linkini paylaş. Panel için `/panel/giris`, müşteri paneli için
`/musteri/giris`.

**Bilmen gereken iki sınır:**
- Vercel'in ücretsiz Hobby planı *kişisel/ticari olmayan kullanım* için — yani bu, müşteriye gösterip onay almak
  için mükemmel, ama proje gerçekten paralı/canlı bir işletme olarak kullanılmaya başlayınca (ödeme alınan bir
  hizmet haline gelince) Vercel'in Pro planına ($20/ay) geçmen gerekir. Domain bağladığında da bu tamamen sorunsuz
  çalışır, sadece plan ismi değişir.
- Vercel'de sunucu dosya sistemine kalıcı yazma yok — yani oda fotoğrafı veya personel evrakı **dosya olarak
  yüklersen** demo sırasında görünür ama bir süre sonra (yeniden dağıtımda) kaybolabilir. Bunun için panelde her
  iki yerde de **"görsel/dosya adresi yapıştır"** seçeneği var; bir görseli önce bir yere (Google Drive, Imgur vb.)
  yükleyip linkini yapıştırırsan kalıcı olur. Gerçek lansmanda bunun yerine kalıcı bir depo (Cloudflare R2 gibi)
  bağlarız, o zaman dosya yükleme de sorunsuz çalışır.

## Kendi sunucunda (VPS) yayına alma

Alan adını bağlayıp uzun vadeli çalıştırmak istediğinde:

1. `DATABASE_URL`'i PostgreSQL bağlantısıyla değiştir (Neon'u kullanmaya devam edebilir ya da kendi Postgres'ini
   kurabilirsin)
2. `NEXT_PUBLIC_SITE_URL` = `https://onayapart.com`
3. `PANEL_PASSWORD` değerini güçlü bir şifreyle değiştir
4. `npm run build && npm start` ile çalıştır (bir process manager, örn. `pm2`, önerilir)
5. Alan adını yönlendir, SSL sertifikasını aç
6. Bu ortamda sunucu diski kalıcı olduğu için dosya yükleme (oda fotoğrafı, personel evrakı) sorunsuz çalışır

## Yayın sonrası SEO görevleri

- [ ] Google Search Console'a siteyi ekle, `sitemap.xml` adresini gönder
- [ ] Google Business Profile'ı aç: kategori "Apart Otel", adres ve telefon siteyle **harfi harfine aynı**
- [ ] İşletme profiline haftalık fotoğraf yükle
- [ ] Misafirlerden düzenli yorum iste — Erzurum'da harita sonuçları organik sonuçtan çok trafik getirir
- [ ] Yandex Webmaster'a da ekle
- [ ] Gerçek fotoğraflar yüklendikten sonra her odanın `alt` metnini kontrol et

## İşlem geçmişi (log sistemi)

`/panel/gecmis` — sadece tam admin girişiyle görülebilir, "Personel" yetkisi verilmiş olsa bile personel bu sayfaya
giremez. Rezervasyon oluşturma/durum değiştirme, tahsilat, fiyat değişikliği, daire silme, muhasebe kaydı ekleme/
silme, personel maaş ödemesi, kullanıcı yetkisi değiştirme/şifre sıfırlama/aktif-pasif etme ve online ödeme ayarı
değişikliği gibi **hassas işlemler** kaydedilir — kim (Admin ya da hangi personel adı), ne zaman, ne yaptı şeklinde.
Not: bu, her tıklamayı değil, para/yetki/fiyat/rezervasyon gibi önemli değişiklikleri kapsar; kapsamlı bir "her şey
loglansın" sistemi değildir.

## SMS ve e-posta bildirimi

WhatsApp'a ek olarak artık **SMS (NetGSM)** ve **e-posta (Resend)** kanalları da var, `/panel/bilgilendirme`
sayfasının altında ayrı ayrı açık/kapalı anahtarlarıyla:

- **E-posta**: [resend.com](https://resend.com)'dan ücretsiz bir API anahtarı alıp panele girin. Bir "gönderen"
  e-posta adresi de gerekir (kendi domaininizi Resend'e doğrulatmanız önerilir, aksi halde bazı e-posta sağlayıcıları
  gönderileri spam'e atabilir).
- **SMS**: [netgsm.com.tr](https://www.netgsm.com.tr)'den abonelik açıp panelinizden ayrıca bir **API şifresi**
  oluşturun (normal giriş şifreniz değildir) ve bir **başlık (gönderici adı)** başvurusu yapıp onaylatın — onaysız
  başlıkla gönderim çalışmaz.
- Her ikisi de açtığınızda: bir rezervasyon oluşturulduğunda misafire otomatik onay e-postası ve SMS'i gider (e-posta/
  telefon bilgisi varsa). Ayrıca Bilgilendirme sayfasından tek kişiye manuel e-posta veya SMS de gönderebilirsiniz.
- Kapalıyken hiçbir şey değişmez, sistemin geri kalanı normal çalışmaya devam eder.

**Bilgi**: Türkiye'de ticari/pazarlama amaçlı SMS'ler için İYS (İleti Yönetim Sistemi) onayı gerekir; rezervasyon
onayı gibi **bilgilendirme amaçlı** mesajlar genelde bu kapsamın dışındadır, ama gönderim hacminiz büyüdükçe NetGSM
ile bu konuyu netleştirmenizi öneririz — ben hukuk danışmanı değilim.

## Takvimde sürükle-bırak

Gösterge panelindeki oda durum takviminde artık bir rezervasyonun **başlangıç hücresini tutup başka bir gün veya
odaya sürükleyebilirsiniz**. Bıraktığınızda sistem otomatik olarak:

- Yeni tarih/odada çakışma olup olmadığını kontrol eder (hem kendi rezervasyonlarınıza hem Booking.com/Airbnb'den
  senkronize olan harici rezervasyonlara karşı)
- Çakışma yoksa rezervasyonu taşır, süresini (kaç gece olduğunu) korur
- Çakışma varsa taşımayı iptal edip kırmızı bir uyarı gösterir, hiçbir şey bozulmaz
- Başarılı her taşıma işlem geçmişine de kaydedilir

## Online ödeme (iyzico)

`/panel/muhasebe` ana sayfasında **"Online ödeme (iyzico)"** kartı var — açık/kapalı anahtarıyla tamamen isteğe
bağlı. Açtığınızda, müşteri panelindeki (`/musteri`) her rezervasyon satırında bakiyesi olan müşteriler için
**"Kredi kartıyla öde"** butonu belirir. Kapalıyken bu buton hiç görünmez, müşteri panelinde hiçbir değişiklik olmaz.

**Nasıl çalışır:**
- Misafir "Kredi kartıyla öde" dediğinde, iyzico'nun kendi güvenli (PCI uyumlu) ödeme sayfasına yönlendirilir. Kart
  numarası, CVV gibi bilgiler **hiçbir zaman bizim sunucumuza gelmez** — bu hem en güvenli hem tek doğru yöntemdir.
- Ödeme tamamlanınca misafir otomatik olarak müşteri paneline geri döner. Sistem ödemeyi iyzico'dan tekrar sorgulayıp
  doğrular (yönlendirmeye asla güvenilmez — bu, sahteciliğe karşı zorunlu bir adımdır), başarılıysa otomatik olarak
  bir tahsilat kaydı oluşturur ve seçtiğiniz kasa/banka hesabına işler.
- Aynı ödeme iki kez işlenmez (çift tahsilat koruması dahili olarak yapılır).

**Kurulum:**
1. [iyzico.com](https://www.iyzico.com)'dan ücretsiz bir **test (sandbox)** hesabı açın — kredi kartı veya vergi
   levhası istemez, dakikalar içinde API Key ve Secret Key alırsınız.
2. Bu anahtarları `/panel/muhasebe` sayfasındaki forma girin, "Test modu" kutucuğunu işaretli bırakın, kaydedin.
3. iyzico'nun test kartlarıyla (dokümantasyonlarında verilir) uçtan uca deneyin.
4. Gerçek ödeme almaya hazır olduğunuzda iyzico'da **gerçek işyeri hesabı** başvurusu yapın (vergi levhası, ticaret
   sicil gazetesi gibi belgeler istenir — bu işletmenin kendisinin tamamlaması gereken bir süreçtir). Onaylandığında
   gerçek API anahtarlarınızı girip "Test modu" kutusunu kaldırın.

**Kapsam notu:** Şu an misafir, kendi müşteri panelinden **var olan bir rezervasyonun bakiyesini** ödeyebiliyor.
Sitedeki oda sayfalarından hesap açmadan doğrudan "rezervasyon yap ve öde" şeklinde tam bir online rezervasyon akışı
bu kapsamda değil — bu, mevcut "rezervasyonları personel açar" iş akışının kökten değişmesini gerektiren, çok daha
büyük ayrı bir proje.

## Rezervasyon açarken birden fazla kişiyi tek seferde kaydetme

`/panel/rezervasyonlar`'daki "Rezervasyonu kaydet" formunun altına artık **"+ Bir kişi daha ekle"** butonu eklendi.
Odaya birden fazla kişi giriş yapacaksa, ana kiracının bilgilerini doldurduktan sonra bu butona istediğiniz kadar
basıp her ek kişinin adını, kimlik/pasaport bilgisini, doğum tarihini, uyruğunu ve isterseniz ek ücretini aynı
ekranda girebilirsiniz — "Rezervasyonu kaydet" dediğinizde hepsi tek seferde, birlikte kaydedilir. Ek ücret
girdiyseniz toplam tutara otomatik eklenir. Bu alan tamamen isteğe bağlı — boş bırakırsanız eskisi gibi tek kişilik
rezervasyon açılır, ek kişileri istediğiniz zaman Müşteriler sayfasından da ekleyebilirsiniz.

## Müşteri yorumları (Google'dan elle seçilmiş)

`/panel/icerik` sayfasının altında yeni bir **"Müşteri yorumları"** bölümü var. Google Haritalar'daki gerçek
yorumlarınızdan beğendiklerinizi (genelde 5 yıldızlı olanları) kopyalayıp buraya yapıştırıyorsunuz — ad, yıldız
sayısı, yorum metni. Kaydettiğinizde ana sayfada "Misafirlerimiz ne diyor?" başlığıyla, yıldızlı kartlar halinde
otomatik görünür.

**Neden otomatik API bağlantısı yok, bilerek**: Google'ın herkese açık API'si tek seferde en fazla 5 yorum veriyor
ve bunları yıldıza göre filtreleyemiyorsunuz — yani "sadece 5 yıldızlıları getir" diye otomatik bir bağlantı
güvenilir çalışmaz, gelen 5 yorumun hiçbiri 5 yıldızlı olmayabilir. Gerçekten tüm yorumlara erişip filtreleyebilen
yol (Google Business Profile API) OAuth kurulumu ve doğrulanmış işletme sahipliği gerektiren, epey ağır bir süreç.
Bu yüzden en güvenilir ve bozulma riski sıfır olan yolu seçtik: siz hangi yorumun görüneceğine karar veriyorsunuz.
Bir yorumu geçici olarak kaldırmak isterseniz silmeden "Sitede yayında" kutucuğunu kaldırabilirsiniz.

## Para birimi biçimi

Tüm tutarlar (muhasebe, rezervasyonlar, müşteri paneli, PDF sözleşme/raporlar dahil — tek bir ortak fonksiyondan
geldiği için her yerde aynı anda düzeldi) artık **20.000,00 ₺** biçiminde: binlik ayraç nokta, ondalık ayraç virgül,
her zaman iki hane kuruş, ve ₺ sembolü garanti görünür. Önceden bazı sunucu ortamlarında para birimi sembolü
sessizce "TRY" yazısına dönüşebiliyordu ve kuruş hiç gösterilmiyordu — ikisini de düzelttim. Sözleşme/rapor
PDF'lerinde kullanılan yazı tipinin (DejaVu Sans) ₺ karakterini desteklediğini de ayrıca doğruladım.

## Müşteri paneli girişi artık kod değil, telefon + T.C. kimlik no

Daha önce misafire ayrı bir 6 haneli giriş kodu üretip iletmeniz gerekiyordu. Artık **gerek yok** — misafir kendi
telefon numarası ve T.C. kimlik numarasıyla (rezervasyon açılırken zaten aldığımız bilgiler) doğrudan giriş yapıyor.

- Telefonu **nasıl yazarsa yazsın** kabul edilir: `+905536732772`, `+90 553 673 27 72`, `0553 673 27 72`,
  `05536732772`, `5536732772`, `553 673 27 72` — hepsi aynı numara olarak tanınır (zaten var olan telefon
  normalleştirme mantığını kullanıyoruz, WhatsApp/SMS'te de aynısı çalışıyor).
- Panelde (rezervasyon oluşturma ve müşteri düzenleme formlarında) telefon alanı artık sabit bir **+90** etiketiyle
  geliyor, geri kalanını yazarken otomatik olarak `553 673 27 72` şeklinde gruplanıyor — hem daha temiz görünüyor
  hem yanlış yazım riskini azaltıyor.
- Eski kod sistemi (portalCode alanı) veritabanında duruyor ama artık hiçbir yerde kullanılmıyor — silme riski
  almamak için kaldırmadım, sadece işlevsiz bıraktım.
- Bir müşterinin panele girebilmesi için **T.C. kimlik numarasının kayıtlı olması şart** — girilmemişse müşteri
  detay sayfasında bunu belirten bir uyarı çıkar.

## Firma evraklarını WhatsApp/e-posta ile gönderme

`/panel/evraklar`'da her evrakın yanına artık iki küçük gönderim kutusu eklendi — telefon numarası girip
"💬 Gönder" ile WhatsApp'tan, ya da e-posta adresi girip "✉️ Gönder" ile e-postayla, o evrakı **dışarıya**
(muhasebeci, resmi kurum, iş ortağı gibi panel hesabı olmayan biri) gönderebilirsiniz.

Teknik bir detay: bu paylaşımlar için ayrı, panel girişi gerektirmeyen bir link kullanıyoruz — çünkü gönderdiğiniz
kişi panel kullanıcınız değil, mevcut "İndir" linki onlar için açılmazdı. Güvenlik, tıpkı bir Google Drive paylaşım
linki gibi, linkin kendisinin tahmin edilemez olmasından geliyor; bu linki sadece siz oluşturup gönderdiğiniz için
erişilebilir.

E-posta gönderimi çalışması için Bilgilendirme sayfasındaki e-posta ayarlarının (Resend API anahtarı) açık ve
doğru girilmiş olması gerekiyor — kapalıysa gönderim başarısız olur ve size açıkça söyler.

## Ana sayfa ve oda tipi kartlarına gerçek fotoğraf

Daha önce bina dış cephesi ve oda tipi kartları (1+0/1+1/2+1) sadece yeşil gradyan + yazıyla gösteriliyordu.
Artık ikisine de gerçek fotoğraf ekleyebilirsiniz:

- **Ana sayfa hero fotoğrafı**: `/panel/icerik`'te "Bina dış cephe fotoğrafı" alanına bir görsel adresi (link)
  yapıştırın — bina fotoğrafı hem Türkçe hem tüm dil sayfalarında görünür. Boş bırakırsanız eski yer tutucu kalır.
- **Oda tipi kartı fotoğrafı**: `/panel/tipler`'da her oda tipinin düzenleme formunda "Tanıtım kartı fotoğrafı"
  alanı var — doldurursanız ana sayfadaki 1+0/1+1/2+1 kartlarında kod yazısı yerine o fotoğraf görünür.

İkisi de aynı yöntemle çalışıyor: dosyayı bir görsel barındırma servisine (Google Drive paylaşım linki, imgur.com
vb.) yükleyip doğrudan görselin adresini yapıştırıyorsunuz — daha önce anlattığım Vercel'in kalıcı disk sınırı
burada da geçerli, gerçek dosya yükleme için Blob kurulumu ayrı bir adım.

## Kurum içi iş takibi (yeni bölüm)

Panelde yeni bir sayfa: **İş Takibi** (`/panel/is-takibi`). Bir yönetici bir personele (ya da genel olarak, kişi
seçmeden) bir not/talimat bırakabilir — örn. "1. kat üst ışık arızası, tamir ettirilsin". İsteğe bağlı bir son
tarih de eklenebilir (ertesi güne bırakmak gibi).

- İlgili personel notu görüp **yanıt yazabilir** ("bakıldı, parça lazım" gibi) — bir not altında birden fazla
  yanıt birikebilir, tam bir konuşma geçmişi oluşur
- Durum üç aşamalı: **Açık → Devam ediyor → Tamamlandı** — tek tıkla değiştirilir
- Tamamlanan işler ayrı bir bölümde arşivlenir, gerekirse "Yeniden aç" ile geri açılabilir
- Bu, oda/rezervasyonla ilgili **Bakım talepleri**nden tamamen ayrı bir sistem — daha genel kurum içi
  talimat/görev takibi için

## 5 yeni dil + açık/kapalı dil sistemi

Site artık toplam **9 ek dil** destekliyor: İngilizce, Arapça, Farsça, Rusça (öncekiler) + **Almanca, Fransızca,
İspanyolca, Azerice, Gürcüce** (yeni). Her biri için gerçek, elle yazılmış tam çeviri var — genel site metinleri,
talep formu, oda detayları ve üç SEO iniş sayfasının (günlük/aylık/öğrenci) hepsi.

**Hangi dillerin açık olacağını artık siz seçiyorsunuz**: `/panel/icerik` sayfasında "Sitenin dilleri" bölümünde 9
dilin hepsi kutucuklu listelenir. İşaretlemediğiniz bir dil:
- Dil geçiş menüsünde hiç görünmez
- Site haritasında (sitemap) listelenmez
- Birisi o dile doğrudan linkle girmeye çalışsa bile "sayfa bulunamadı" gösterir — yani gerçekten kapalı

Bu, ürünleştirme planınız için önemli: yeni bir firmaya kurulum yaparken artık kod değiştirmenize gerek yok, o
firma panelden hangi dilleri istediğini kendisi seçer (örn. bir Antalya oteli Almanca+Rusça ister, siz
Arapça+Farsça istersiniz — aynı kod tabanı, farklı seçimler).

**Dürüst bir not**: Türkçe sayfalardaki (`/`, `/odalar` vb.) hreflang etiketleri hâlâ varsayılan 4 dile göre sabit
— bu sayfalar statik metadata kullanıyor, anlık veritabanı sorgusu atamıyorlar. Etkisi çok küçük: gerçek dil
sayfaları (`/de`, `/fr` vb.) doğru şekilde açık/kapalı kontrolüne uyuyor, sadece Türkçe sayfadan bu dillere giden
"bu dil de var" işareti bazen güncel dil seçiminizi tam yansıtmayabilir. İleride isterseniz bunu da tam
otomatikleştirebilirim.

**Kritik bir hatayı da bu sırada yakaladım**: Oda/kat/müsaitlik gibi küçük kelimeler bazı sayfalarda sadece ilk 4
dile göre yazılmıştı (kodda "eğer İngilizce değilse, Rusça değilse, Arapça değilse, Farsça yaz" mantığı vardı) —
yeni 5 dilde bu kelimeler yanlışlıkla Farsça çıkacaktı. Projeyi taradım, 8 dosyada 24 yeri düzelttim, artık hepsi
doğru dilde.

## Firma Evrakları (yeni bölüm)

Panelde yeni bir sayfa: **Firma Evrakları** (`/panel/evraklar`, sol menüde "Personel" biraz aşağısında). Vergi
levhası, ruhsat, sözleşme, sigorta poliçesi gibi işletmenizin önemli evraklarını tarayıp buraya kaydedin —
ihtiyaç olduğunda "İndir" ile açıp kullanabilirsiniz.

- Her evraka başlık, isteğe bağlı kategori (Vergi, Ruhsat, Sözleşme gibi serbest metin), not ve **son geçerlilik
  tarihi** ekleyebilirsiniz — süresi dolmuş ya da 30 gün içinde dolacak evraklar sayfanın üstünde kırmızı/sarı
  uyarı olarak çıkar, unutmazsınız.
- **Personel özlük dosyalarından tamamen ayrı bir sistem** — bunlar işletmenin kendi resmi evrakları, kimlik/sağlık
  raporu gibi kişisel veri içermiyor.
- Dosya yükleme, personel özlük dosyalarındaki ile birebir aynı yöntemle çalışır: kalıcı disk gerektiren bir
  barındırmada (VPS) doğrudan yükleme kalıcı olur. Vercel gibi sunucusuz barındırmada ise dosyayı bir bulut
  deposuna (Google Drive, Dropbox vb.) yükleyip linkini "dosya adresi" alanına yapıştırmanız en güvenilir yöntem —
  sayfada bu da açıkça belirtiliyor.
- Kimin bu sayfaya erişebileceğini, personel kullanıcı yetkilerinden ("Firma Evrakları" yetkisi) ayrı ayrı
  belirleyebilirsiniz — istemezseniz sadece siz görürsünüz.

## İki oda yönetimi düzeltmesi

**Yeni odalar artık otomatik yayında**: "Yeni daire ekle" formunda "Sitede hemen yayınla" seçeneği yoktu, bu
yüzden eklediğiniz her oda varsayılan olarak "Gizli" kaydediliyor, siteye hiç çıkmıyordu. Artık form varsayılan
olarak işaretli gelen bu seçenekle geliyor — eklediğiniz oda direkt yayında olur. İsterseniz kutucuğu kapatıp
daha sonra manuel yayına alabilirsiniz (örn. fotoğraflar hazır olana kadar beklemek isterseniz).

**Odalar listesine de "Sil" eklendi**: Daha önce bir odayı silmek için önce "Düzenle / Foto"ya tıklayıp detay
sayfasına girmeniz gerekiyordu — silme orada, listede yoktu. Artık liste sayfasında da her satırın sonunda "Sil"
linki var, detay sayfasına girmenize gerek kalmadan doğrudan silebilirsiniz. (Hatırlatma: bir odanın geçmiş veya
aktif rezervasyon kaydı varsa — mali kayıtlarınız kaybolmasın diye — silme kasıtlı olarak reddedilir; o durumda
"Gizle" ile siteden kaldırabilirsiniz, oda panelde geçmiş kaydıyla birlikte durur.)

## Gösterge panelinde oda tipine göre 3 sütun

"Odaların şu anki durumu" bölümü artık oda tipine göre (1+0, 1+1, 2+1 gibi — sisteme kaç tip eklediyseniz o kadar
sütun otomatik oluşur) ayrı sütunlara bölündü. Her sütunda o tipin müsait daireleri üstte, **alt alta** listelenir
(dolu odaların arasına karışmadan); dolu/meşgul olanlar altında ayrı bir başlık altında. Her müsait odanın yanında
yine WhatsApp'tan gönderme kutusu var.

## Odayı tek tıkla WhatsApp'tan gönderme

Müşteri telefonda "bu daireyi görmek istiyorum" derse, artık personel numarasını girip **anında** o dairenin
genel sayfasının linkini WhatsApp'tan gönderebiliyor — üç ayrı yerden:

- **Gösterge panelinde** (`/panel`), "Odaların şu anki durumu" kartlarının her birinde artık küçük bir telefon
  alanı ve 💬 butonu var — hangi odaya bakıyorsanız, kartın üstünden direkt gönderebilirsiniz
- **Odalar listesinde** (`/panel/odalar`), her satırda aynı widget
- **Oda detay sayfasında** (`/panel/odalar/[numara]`) da aynısı, biraz daha büyük ve açıklamalı halde

Mesaj otomatik olarak "Merhaba! İlgilendiğiniz daireyi buradan inceleyebilirsiniz: [link] — Oda X · [tip adı]"
şeklinde hazırlanır. Bilgilendirme sayfasındaki WhatsApp API açıksa doğrudan gönderilir; kapalıysa (varsayılan),
WhatsApp hazır mesajla açılır, siz sadece "Gönder"e basarsınız. Gönderilen her mesaj, diğer WhatsApp
gönderimleri gibi kayıt altında tutulur.

**Önemli — site adresi hakkında**: Bu linklerin doğru adresi göstermesi için `NEXT_PUBLIC_SITE_URL` ortam
değişkeninin hem yerel `.env` dosyanızda hem de Vercel'in proje ayarlarında güncel olması gerekir (şu an
`https://onayapart.vercel.app`, gerçek domain bağlanınca değişecek). Bu bir ortam değişkeni ayarı, kodda hiçbir
yerde site adresi sabit yazılı değil — `NEXT_PUBLIC_SITE_URL` her zaman tek doğru kaynak.

## Geçmiş müşteriden hızlı rezervasyon

Bir misafir "daha önce burada kaldım" derse, artık iki yoldan hızlıca yeni rezervasyon açabilirsiniz — bilgilerini
yeniden yazmanıza gerek kalmadan:

1. **Rezervasyonlar sayfasında telefonla ara**: Yeni rezervasyon formunun üstünde "Daha önce kalmış mı?" kutusu
   var — telefon numarasını (hangi formatta yazarsanız yazın) girip "Ara ve doldur" dediğinizde, bulunursa isim,
   telefon, kimlik bilgisi, doğum tarihi, uyruk ve adres otomatik doluyor; siz sadece daire ve tarihi seçiyorsunuz.
2. **Müşteri detayından**: `/panel/musteriler/[isim]` sayfasının en üstünde artık "+ Yeni rezervasyon oluştur"
   butonu var — doğrudan o müşterinin bilgileriyle doldurulmuş rezervasyon formuna gider.

Doldurulan bilgiler her zaman düzenlenebilir — misafirin adresi/telefonu değiştiyse formda güncelleyip
kaydedebilirsiniz.

## Müşteri sayfasından tahsilat, depozito görünürlüğü ve Muhasebe'de Depozitolar

**Müşteri sayfasından doğrudan tahsilat**: `/panel/musteriler/[isim]`'de bir rezervasyonun kalan bakiyesi varsa
(borç bittiyse hiç görünmez), artık "Kalan borç için tahsilat yap" bölümü otomatik açılıyor — Rezervasyonlar
sayfasına gitmenize gerek kalmadan, oradan doğrudan ödeme girebilir, nakit seçip fatura talebi de açabilirsiniz.

**Depozito artık görünüyor**: Rezervasyon açılırken girdiğiniz depozito tutarı önceden hiçbir yerde
gösterilmiyordu, sadece kaydediliyordu. Artık hem müşteri detayındaki her rezervasyonun özet satırında (💰 rozeti)
hem açılmış halinde bakiyenin yanında görünüyor.

**Muhasebe → Depozitolar** (yeni, 8. buton): Depozito alınmış tüm rezervasyonları müşteri müşteri listeler —
toplam ne kadar depozito tutuluyor, kimde ne kadar, hangi rezervasyonda. Bu tutarlar rezervasyonun toplam
bedeline dahil değil, ayrı bir takip listesi olarak tutuluyor.

## Hız iyileştirmeleri — "bizden kaynaklanan" sorunlar düzeltildi

Site yavaşlığı şikayeti üzerine kod tarafında bulduğum ve düzelttiğim gerçek sorunlar (ücretsiz Neon/Vercel
planının doğal gecikmeleri hariç, sadece bizim kontrolümüzdeki kısım):

- **`/panel/icerik`, `/panel/menu`, `/panel/tipler`**: Çeviri sistemi kurulurken her SSS/olanak/menü ürünü/oda tipi
  için **ayrı ayrı** veritabanı sorgusu atılıyordu (10 SSS + 15 olanak = 25 ayrı gidiş-geliş gibi). Artık hepsi
  **tek bir toplu sorguda** çekiliyor.
- **`getAccounts()`** (kasa/banka bakiyeleri — hemen hemen her muhasebe sayfasında ve rezervasyon ödeme formunda
  çağrılıyor): Her hesap için 3 ayrı toplam sorgusu atıyordu. Artık hesap sayısı ne olursa olsun sabit 3 sorguda
  hepsi birden hesaplanıyor.
- **`getAccountSummaries()`** (kasa/banka hareket özeti sayfaları): Aynı sorunun aynı düzeltmesi.
- **Aylık kâr-zarar raporu** (`/panel/muhasebe/rapor`): 12 aylık rapor için 36 ayrı sorgu atılıyordu (ay başına 3
  sorgu × 12 ay). Artık tüm dönem tek seferde çekilip aylara JavaScript içinde bölünüyor — 36 sorgu yerine 3.

Bunların dışında kalan yavaşlık (özellikle siteye uzun süre kimse girmediğinde ilk açılışın yavaş olması) Neon'un
ücretsiz planının veritabanını uykuya alması ve panel sayfalarının bilerek her zaman taze veri çekmesi (personel
eski veriye bakmasın diye) — bunlar kod hatası değil, ücretsiz altyapının doğal sınırları.

## Rezervasyon ve personel bazlı işlem geçmişi

**Personel detayında kendi işlem geçmişi**: `/panel/personel/[isim]` sayfasında, panel hesabı olan bir personelin
altında artık **"İşlem geçmişi"** bölümü var — o kişinin panelden bugüne kadar yaptığı son 50 işlem (rezervasyon
oluşturma, ödeme alma, durum değiştirme vb.) burada listeleniyor. "Tam işlem geçmişinde aç" linkiyle
`/panel/gecmis`'e, doğrudan o kişi seçili halde gidebilirsiniz.

**Müşteri detayında rezervasyon bazlı geçmiş**: `/panel/musteriler/[isim]` sayfasında her rezervasyonu açtığınızda,
en altta artık **"İşlem geçmişi — girişten çıkışa kim ne yaptı"** bölümü var. O rezervasyonla ilgili yapılan her
işlem (kim oluşturdu, kim durumu değiştirdi, kim ödeme aldı, kim ek misafir/oda servisi ekledi, kim fatura talebi
açtı) kronolojik sırayla, kim yaptığıyla birlikte görünür. Bunun çalışması için işlem geçmişi kayıtlarına hangi
rezervasyonla ilgili olduğu bilgisi de eklendi — eski kayıtlarda bu bilgi olmadığı için (geçmişe dönük
eklenemez), sadece bu güncellemeden sonraki işlemler rezervasyon bazlı görünür.

## Nakit ödemede fatura talebi, kurumsal fatura, personel seçimi, çoklu fatura talebi

**Nakit ödemede fatura sorusu**: Rezervasyonlar sayfasında bir ödeme eklerken "Nakit" seçtiğinizde, formun altında
otomatik olarak **"Fatura kesilsin mi?"** sorusu ve bir tutar alanı çıkar. İşaretleyip tutar girerseniz (boş
bırakırsanız ödemenin tamamı), talep otomatik olarak Muhasebe → Faturalar sayfasındaki bekleyen listeye düşer.
Müşteri toplam ödemenin sadece bir kısmı için fatura istiyorsa (örn. 20.000 TL'nin 5.000 TL'si), o tutarı ayrıca
girebilirsiniz — bir rezervasyona artık birden fazla fatura talebi açılabiliyor, hepsi ayrı ayrı takip edilir.

**Kurumsal fatura**: Rezervasyon oluşturma formunda "Kurumsal müşteri — fatura firmaya kesilecek" kutucuğunu
işaretlerseniz firma unvanı, vergi no, vergi dairesi ve firma adresi alanları açılır. Bu bilgiler Faturalar
sayfasında ilgili talebin yanında mor bir "Kurumsal" rozetiyle görünür.

**Rezervasyonu alan personel — zorunlu**: Rezervasyon oluştururken artık "Rezervasyonu alan personel" seçilmesi
şart, boş bırakılamaz. Rezervasyon listesinde her kaydın altında kimin aldığı görünür (👤 simgesiyle).

**Rezervasyon notu**: Rezervasyon formuna isteğe bağlı bir not alanı eklendi (örn. "geç giriş yapacak"), listede
rezervasyonun altında italik olarak görünür.

## İşlem geçmişinde kişi bazlı filtre

`/panel/gecmis` sayfasında artık "Admin/Personel" genel filtresinin yanında, kayıtlı personelin isimlerini listeleyen
bir açılır liste var — belirli bir kişiyi seçip **sadece onun yaptığı işlemleri** görebilirsiniz.

## Gösterge panelinde müsait/dolu odalar ayrı bölümlerde

Ana panelin "Odaların şu anki durumu" bölümü artık ikiye ayrıldı: yeşil çerçeveli **"Müsait odalar"** üstte, hemen
görülüyor; "Dolu / meşgul odalar" (dolu, harici, temizlikte, bakımda — hepsi kendi rengiyle) altında ayrı bir
kutuda. Boş odayı bulmak için artık dolu odaların arasından geçmenize gerek yok.

## Çoklu dil desteği (İngilizce / Arapça / Farsça / Rusça) — tamamlandı

Site artık 4 ek dilde de yayınlanıyor: `/en`, `/ar`, `/fa`, `/ru` — Türkçe sayfalar (`/`, `/odalar` vb.) hiç
değişmedi, URL'leri aynı kaldı, mevcut SEO'ya dokunulmadı.

**Tüm sayfalar 4 dilde de hazır:**
- Ana sayfa, oda listesi, oda tipi detayı, tekil oda detayı, restoran menüsü, SSS, iletişim
- Günlük / aylık / öğrenci SEO iniş sayfalarının üçü de — gerçek, elle yazılmış tanıtım metinleriyle (makine
  çevirisi değil)
- Doğru `<html lang dir>` (Arapça/Farsça sağdan sola akıyor), her sayfada karşılıklı hreflang etiketleri (Türkçe
  sayfa da diğer 4 dile işaret ediyor, onlar da birbirlerine ve Türkçe'ye), site haritasında (sitemap) hepsi yer
  alıyor
- Header'da sağ üstte TR / EN / AR / FA / RU dil geçiş linkleri, üst menüde tüm sayfalara erişim

**Panelden girilen içerik artık uçtan uca çevrilebiliyor** — `/panel/icerik`, `/panel/tipler`, `/panel/menu` ve
`/panel/odalar/[numara]` sayfalarında ilgili her alanın altında "🌐 Diğer dillerdeki çeviriler" diye açılan bir
bölüm var. Personel 4 dilde ayrı kutucuklara kendi çevirisini giriyor; boş bırakılırsa o dilde otomatik Türkçesi
gösterilir (hiçbir zaman boş kalmaz). Bağlanan içerik tipleri:
- Oda tipleri (isim, kısa tanıtım, açıklama, kapasite, özellikler)
- Tekil oda bilgileri (yatak düzeni, cephe)
- Restoran menüsü (kategori adları, ürün adı/içeriği)
- SSS (soru/cevap) ve Olanaklar (etiket)
- Ana sayfa tanıtım metni (üst rozet, başlık, açıklama)

Google yorumları (Testimonial) bilerek çevrilmiyor — gerçek bir müşterinin sözünü çevirmek özgünlüğünü
bozabileceği için orijinal dilinde kalıyor.

**Teknik not**: Next.js'in resmi çoklu-dil desenini kullandım — tüm mevcut Türkçe sayfaları `(tr)` adında bir
"route group" klasörüne taşıdım. Bu klasör adı URL'de hiç görünmez, sadece dosya organizasyonu için var; `/odalar`
hâlâ `/odalar`. Panel ve müşteri paneli de bu Türkçe grubun içinde kaldı — onlar zaten hep Türkçe kalacak. Çeviri
verisi tek bir esnek tabloda (`Translation`) tutuluyor — ileride yeni bir içerik tipini buna bağlamak, her tabloya
ayrı kolon eklemekten çok daha az iş.

## Üç küçük ama önemli düzeltme

**Misafir panelinde menü artık daha güvenilir görünüyor**: Önceden sadece rezervasyon durumu tam olarak "Giriş
yaptı" ise sipariş bölümü çıkıyordu — personel bu durumu her zaman elle değiştirmeyebileceği için bölüm bazen hiç
görünmüyordu. Artık **bugünün tarihi giriş-çıkış aralığındaysa** (iptal/tamamlanmış olmadıkça) sipariş bölümü
görünür, durum etiketine bakılmaksızın.

**Çıkış yapınca müşteri panel erişimi otomatik kapanıyor**: Bir rezervasyonu "Çıkış Yaptı" (eski adıyla
"Tamamlandı") yaptığınızda, o müşterinin **başka aktif/gelecek rezervasyonu yoksa** giriş kodu otomatik geçersiz
hale gelir — `/musteri/giris`'ten tekrar giriş yapamaz. Başka bir aktif rezervasyonu varsa dokunulmaz. Müşteri
detayındaki "Yeni kod oluştur" butonuyla istediğiniz an erişimi tekrar açabilirsiniz (örn. yeni bir rezervasyon
açtığınızda). "Tamamlandı" durumunun görünen adı da artık daha anlaşılır olsun diye **"Çıkış Yaptı"** oldu (arka
plandaki veri aynı kalıyor, sadece ekrandaki yazı değişti).

**Gösterge panelinde anlık oda durumu**: KPI kartlarının hemen altında artık her dairenin **şu anki** durumunu
(Müsait/Dolu/Temizlikte/Bakımda) gösteren küçük, renkli bir pano var — 14 günlük takvime inmeden, sadece bugünü tek
bakışta görürsünüz.

## Misafir kendi panelinden sipariş verebiliyor (onaylı akış)

Sipariş formu artık **sizin panelde oluşturduğunuz kategorilere göre gruplu**: misafir "Çorbalar", "Ana Yemekler",
"İçecekler" gibi başlıklar altında ürünleri görür, istediği kadarını işaretler (checkbox), her biri için isteğe
bağlı adet girer, tek seferde "Seçtiklerimi sipariş ver" der — tek tek ürün seçip tekrar tekrar göndermesine gerek
yok.

Misafir kendi panelinde (`/musteri`), **şu an odada kalıyorsa** (giriş yapmış durumdaysa) ve restoran menüsü
açıksa, doğrudan menüden ürün seçip sipariş verebiliyor. Ama bu sipariş **otomatik olarak hesaba yansımıyor** —
personel onaylamadan rezervasyon tutarı değişmiyor:

- Misafir sipariş verir → durumu **"Bekliyor"**
- Personel `/panel/musteriler/[id]` sayfasında ilgili rezervasyonun içinde siparişi görür, **"Onayla"** derse tutar
  o an rezervasyona işlenir; **"Reddet"** derse hiçbir zaman işlenmez, kayıt sadece geçmiş için kalır
- Misafir kendi panelinden siparişlerinin durumunu (Bekliyor/Onaylandı/Reddedildi) görebilir
- Gösterge panelinde, onay bekleyen bir sipariş varsa mor renkli ayrı bir bildirim şeridi çıkar — personel oradan
  direkt ilgili müşterinin sayfasına gidip onaylayabilir

Personelin panelden kendi girdiği oda servisi kayıtları (misafir aramadan, resepsiyonun girdiği) bu onay adımından
geçmez, girildiği an direkt hesaba işlenir — onay akışı sadece misafirin kendi verdiği siparişler için geçerlidir.

## Çıkış → Temizlik otomasyonu

Bir rezervasyonun durumunu **"Tamamlandı"** (çıkış) yaptığınızda artık otomatik olarak:
- O daire **"Temizlikte"** durumuna geçer (müsaitlik gösterge/rozetlerinde de yansır)
- Kat hizmetleri için otomatik bir **temizlik görevi** açılır

**Kat görevlisi tarafı:** Sınırlı yetkili bir kullanıcıya sadece "Bakım talepleri" yetkisi verirseniz, panele girdiğinde
otomatik olarak o sayfaya yönlendirilir (ana gösterge paneline erişemez). Bu sayfanın en üstünde artık **"Bugün
temizlenecek odalar"** başlıklı, mavi vurgulu ayrı bir bölüm var — kat görevlisi panele girer girmez ilk bunu görür.
"Temizlendi" dediğinde **oda otomatik olarak müsaitliğe döner**, ayrıca bir şey yapmanıza gerek kalmaz. Ana gösterge
panelindeki bildirim şeridinde de artık her görevin türü (Temizlik/Bakım/Arıza) ayrı renkte etiketleniyor.

## Restoran / Menü — açılıp kapatılabilir

Apart bünyesindeki bağımsız restoranınız için tam bir menü sistemi eklendi, **isteğe bağlı** — istemezseniz tek
tıkla kapatabilirsiniz.

**Panelde** (`/panel/menu`, "Restoran Menüsü" yetkisiyle sınırlı personele de verilebilir):
- Kategoriler (Çorbalar, Ana Yemekler, İçecekler vb.) ve her kategorinin altında ürünler — isim, içerik/açıklama,
  fiyat
- Bir ürünü **"Günün Menüsü"** olarak işaretleyebilirsiniz — sitede ayrı, öne çıkan bir bölümde gösterilir
- Sayfanın en üstünde **açık/kapalı anahtarı**: kapalıyken sitedeki `/menu` sayfası, ana sayfadaki restoran bölümü
  ve üst menüdeki "Menü" linki **hiç görünmez** — ama içeriği hazırlamaya devam edebilirsiniz, hazır olunca
  açarsınız.

**Sitede** (açıkken): `/menu` sayfası — üstte Günün Menüsü, altında kategorili tam liste. Ana sayfada da koyu yeşil,
öne çıkan bir restoran tanıtım bölümü (günün menüsü önizlemesiyle) beliriyor.

**Odaya giden yemek/içecek hesabı:** `/panel/musteriler/[id]` sayfasında, her rezervasyonun içinde artık "Ek
misafirler"in yanında bir **"Oda servisi"** bölümü var. Menüden bir ürün seçip adet girerek (ya da menüde yoksa
elle isim/fiyat girerek) hesaba ekliyorsunuz — tutar otomatik olarak rezervasyonun toplam bedeline işleniyor,
müşterinin bakiyesi buna göre güncelleniyor. Silme işlemi de tutarı otomatik geri düşürüyor.

## TGA Aylık İstatistik Bildirimi — gerçek entegrasyon

2026/1 sayılı Bakanlık Genelgesi ile **tüm konaklama tesisleri** (oteller, pansiyonlar, apart oteller dahil) için
Turizm Geliştirme Ajansı'na (TGA) aylık istatistik bildirimi zorunlu hale geldi. KBS ve Uyumsoft'un aksine, bu
sistemin **gerçek, herkese açık ve net bir REST API dokümantasyonu var** (`tesis-entegrasyon.tga.gov.tr/docs`) —
bu yüzden bunu tahmine dayalı değil, resmi dokümana göre kurdum.

`/panel/muhasebe/tga` sayfasında:
- **Açık/kapalı anahtarı** + test/canlı ortam seçimi + API anahtarı girişi
- İstediğiniz ayı seçip **"Hesapla"** dediğinizde, o ayki giriş yapan misafir, geceleme ve satılan oda-gece
  sayılarını (uyruk ve hafta içi/hafta sonu kırılımıyla) kendi verilerinizden otomatik hesaplayıp önizleme olarak
  gösterir — göndermeden önce kontrol edebilirsiniz
- Gönderilecek ham JSON'u da isterseniz açıp görebilirsiniz
- **Ortalama oda fiyatını (EURO, net)** bilerek otomatikleştirmedim — TCMB kurunu esas alan bu hesaplama, yanlış
  giderse düzeltmesi güç bir resmi beyan olduğu için, tek bu değeri elle girmenizi istiyorum
- Gönderim geçmişi ve hata detayları ayrıca kayıt altında tutulur

**Kurulum için gereken**: [tga.gov.tr/tesis-entegrasyon](https://tga.gov.tr/tesis-entegrasyon) adresinden
tesisinizi (vergi no, Bakanlık belge no ile) kaydedip bir API anahtarı almanız gerekiyor — bu, işletmenin kendisinin
tamamlaması gereken resmi bir adım. Aldığınızda panelden girip test ortamında deneyebilir, sonra canlıya
geçebilirsiniz. İl/ilçe kodu ve oda/yatak sayısı alanları Erzurum/Yakutiye için önceden dolu geldi, farklı bir
şehre kurarsanız güncellemeniz gerekir.

## Faturalar (Uyumsoft) — dürüst bir not

`/panel/muhasebe/faturalar` — Onay Apart'ın çalıştığı Uyumsoft'un gerçek bir e-Arşiv/e-Fatura web servisi var
(`efatura.uyumsoft.com.tr`), ama bu **eski nesil bir SOAP web servisi** — iyzico/NetGSM'deki gibi basit, herkese
açık bir REST API değil. Tam teknik şemayı (WSDL, hangi alan hangi formatta) Uyumsoft sadece kayıtlı müşterilerine
veriyor; bunu tahminle kodlamak, resmi bir mali belge söz konusu olduğu için risk almak istemedim.

**Şimdilik kurulu olan**: düzenli bir manuel takip sistemi. Her rezervasyonun faturası "Bekliyor" veya "Kesildi"
durumunda görünür; Uyumsoft portalinden faturayı kestikten sonra numarasını buraya işlersiniz, tutar otomatik
rezervasyon tutarından gelir. Sayfanın üstündeki "Uyumsoft portalına git" linki doğrudan oraya açılır.

**Gerçek otomatik bağlantı için gereken**: Uyumsoft hesabınızdan web servis kullanıcı bilgilerini (portal giriş
şifrenizden farklı, ayrıca oluşturmanız gerekebilir) ve entegrasyon dokümanını/WSDL'ini alıp bana iletin — o zaman
rezervasyon tamamlanınca faturanın otomatik kesilmesini kurarım.

## Bakım talepleri — kalıcı not geçmişi ve dashboard bildirimi

**Not geçmişi:** Her bakım/arıza talebine artık sınırsız sayıda not eklenebilir — tespit edilen arıza, yapılan
işlem, veya sadece bir ilerleme notu ("parça sipariş edildi" gibi). Bir görevi **"Tamamlandı işaretle"** derken
açılan not alanına yazdığınız şey otomatik olarak kapanış notu olarak kaydedilir. Notlar **hiçbir zaman silinmez** —
panelde bir silme butonu yok, sadece ekleme var. Bir talep yeniden açılıp tekrar kapatılsa bile eski notlar kalır,
üstüne yenisi eklenir; böylece bir arızanın tekrar edip etmediğini geçmişten görebilirsiniz.

**Gösterge panelinde bildirim:** Açık bakım/arıza talebi varsa, panelin en üstünde (KPI kartlarından bile önce)
turuncu bir bildirim şeridi çıkar — kaç açık talep olduğunu, ilk birkaçını ve hızlı "Tamamlandı işaretle" butonlarını
gösterir. Açık talep yoksa bu şerit hiç görünmez, panel sade kalır.

## Arama

Zamanla listesi büyüyecek sekiz sayfaya arama kutusu eklendi: **Rezervasyonlar** (isim/telefon/oda no/kod),
**Müşteriler** (isim/telefon), **Envanter** (kalem adı), **Bakım talepleri** (konu/oda no/müşteri adı), **Odalar**
(oda no/tip), **Personel** (ad soyad/pozisyon), **Kullanıcılar** (kullanıcı adı/ad soyad) ve **Talepler**
(isim/telefon/mesaj). Üstteki özet kartları (toplam sayı, bakiye vb.) her zaman tüm kayıtları gösterir, arama sadece
listeyi daraltır — böylece "kaç tane var" sorusuna yanlış cevap vermez.

## Ek misafirler (ekstra ücretli ziyaretçiler)

Bir müşteri kiraladığı dairede kalırken yanına misafir gelirse ve bunun için ekstra ücret alıyorsanız, bunu
`/panel/musteriler/[id]` sayfasındaki **Konaklama geçmişi** bölümünden takip edebilirsiniz. Her rezervasyonun
satırına tıklayıp açtığınızda:

- O rezervasyona kayıtlı ek misafirleri (ad soyad, T.C./pasaport no, uyruk, varsa ücreti) görürsünüz
- Yeni bir ek misafir ekleyebilirsiniz — kimlik bilgileri de dahil, KBS bildirimi için gereken bilgiler
- **Ücret girerseniz, rezervasyonun toplam tutarına otomatik olarak eklenir** — müşterinin bakiyesi buna göre
  güncellenir, ayrıca muhasebeye elle işlemenize gerek kalmaz. Bir ek misafiri silerseniz, ücreti varsa toplam
  tutardan otomatik düşülür.
- Eklenen ek misafirler, o rezervasyonun sözleşme PDF'ine de otomatik olarak işlenir ("Birlikte Kalan Ek Misafirler"
  başlığı altında).

KBS'ye bildirim hâlâ manuel — bu özellik sadece bilgiyi sizin için düzenli tutar, resmi bildirimi hâlâ
gösterge panelindeki KBS portalı linkinden yapmanız gerekir.

## "Bu dairede neler var?" — artık ekle/çıkar

Oda detay sayfasında (`/panel/odalar/[numara]`) bu bölüm artık sabit bir işaretleme listesi değil, doğrudan
düzenlenebilir: mevcut bir özelliği × ile kaldırabilir, listeden yeni bir tane ekleyebilir, ya da hiç var olmayan
bambaşka bir özellik yaratıp (örn. "Jakuzi") direkt bu odaya ekleyebilirsiniz. Her tıklama anında kaydedilir, ayrı
bir "Kaydet" butonuna basmaya gerek yok. Yarattığınız yeni özellik genel katalogda da oluşur, böylece başka
dairelerde de seçilebilir hale gelir.

## Booking.com / Airbnb senkronizasyonu (çift rezervasyon önleme)

Her dairenin detay sayfasında (`/panel/odalar/[numara]`) bir **"Kanal senkronizasyonu"** bölümü var:

- **Dışa aktarım**: her odanın kendine özel bir takvim linki (`/api/ical/[token]/calendar.ics`) var. Bu linki
  Booking.com Extranet'teki veya Airbnb'nin host panelindeki "harici takvim ekle" alanına yapıştırırsanız, panelden
  girdiğiniz rezervasyonlar o platformlarda da otomatik "dolu" görünür.
- **İçe aktarım**: Booking.com/Airbnb'den aldığınız .ics linkini panele yapıştırıp "Ekle ve senkronize et" dediğinizde,
  o platformdaki rezervasyonlar sisteme çekilir. Bundan sonra:
  - Panelden o tarihlerde aynı odaya yeni rezervasyon açmaya çalışırsanız sistem çakışma uyarısı verir
  - Gösterge panelindeki oda takviminde bu tarihler **mor renkte** ve platform adıyla ayrı gösterilir
  - Sitedeki "Müsait/Dolu" rozetleri de bunu yansıtır
- **"Şimdi senkronize et"** butonuyla istediğiniz an anlık günceller. **"Tüm takvimleri senkronize et"** butonu
  (Odalar ve fiyatlar sayfasının üstünde) tüm odaları tek seferde tazeler.
- **Otomatik senkronizasyon**: `vercel.json` içinde her sabah 09:00'da (TRT) otomatik çalışan bir görev tanımlı
  (`/api/cron/sync-calendars`). Vercel'in ücretsiz Hobby planı cron görevlerini günde bir kez çalıştırmaya izin verir;
  daha sık otomatik senkronizasyon isterseniz Vercel Pro'ya geçmeniz gerekir. Güvenlik için isterseniz Vercel'de bir
  `CRON_SECRET` ortam değişkeni tanımlayın, cron isteği bununla doğrulanır (tanımlamazsanız kontrol atlanır).

**Dürüst bir sınır:** Bu iCal tabanlı bir senkronizasyon — gerçek zamanlı değil, siz "şimdi senkronize et" dediğinizde
veya günlük otomatik görev çalıştığında güncellenir. Booking.com'un/Airbnb'nin resmi, anlık iki yönlü API'sine
doğrudan erişim, bu platformların onayladığı sertifikalı "kanal yöneticisi" ortaklarına özeldir; küçük/bağımsız bir
yazılımın doğrudan başvurup alabileceği bir şey değildir. iCal yöntemi, küçük-orta ölçekli PMS'lerin çoğunun
kullandığı, pratikte güvenilir çalışan standart çözümdür.

## KBS (Kimlik Bildirim Sistemi) — dürüst bir not

Otomatik KBS entegrasyonu (rezervasyon oluşunca misafir bilgisinin doğrudan jandarma sistemine gönderilmesi) **bu
sürümde yok** — ve bilerek eklemedim. Araştırdığımda üç gerçek engelle karşılaştım:

1. Entegrasyon için **bağlı bulunduğunuz karakol/jandarmaya şahsen başvurup bir "tesis kodu" almanız** gerekiyor —
   bu işletmenin kendisinin tamamlaması gereken resmi bir süreç.
2. KBS, bağlantı kabul etmeden önce **önceden kayıtlı, sabit bir IP adresi** istiyor. Vercel'in ücretsiz planı sabit
   IP vermiyor — bu özellik gerçekten çalışsın istiyorsanız sabit IP'li bir sunucuya (VPS) geçmeniz gerekir.
3. Web servisin **tam teknik dokümanı (hangi adrese, hangi formatta veri) sadece kayıtlı tesislere veriliyor**,
   herkese açık yayınlanmıyor. Elimde üçüncü şahıs kaynaklardan derlenmiş metod isimleri var ama resmi şema yok —
   bunu tahminle kodlamak, ilk denemede çalışmayan bir entegrasyon riski taşır.

Karakola başvurup tesis kodunuzu ve **resmi teknik dokümanı** aldığınızda bana iletin, o zaman doğru şekilde
bağlarım. Şimdilik gösterge panelindeki "Kimlik bildirimi" kartına **KBS'nin resmi portalına (kbs.pol.tr) giden bir
hızlı link** ekledim — mevcut "Bildirildi/Bekliyor" takip sisteminiz (rezervasyon listesinde) zaten duruyor, personel
oradan durumu işaretleyip resmi portala hızlıca geçebilir.

## Envanter / Stok yönetimi

`/panel/envanter` — havlu, nevresim, temizlik malzemesi, minibar gibi **tüketilen** stok kalemlerinizi **konum
bazlı** takip eder: depoda ne kadar var, kat hizmetlerinde ne kadar var, ayrı ayrı görünür. Bu, oda detayındaki
**Demirbaşlar**dan farklıdır: demirbaş sabit eşyadır (TV, buzdolabı), envanter ise zamanla azalıp yeniden satın
alınan sarf malzemesidir.

**Muhasebeyle otomatik bağlantı**: `/panel/muhasebe/islem` sayfasında gider kategorisi olarak **"Envanter / Stok
Alımı"**nı seçtiğinizde form altında hangi kalemden ne kadar alındığı ve hangi konuma (genelde Depo) gireceği
sorulur. Kaydettiğinizde hem muhasebe gideri hem stok girişi **tek işlemde, otomatik olarak** birlikte işlenir —
ayrıca envanter sayfasına gidip tekrar girmenize gerek kalmaz.

**Üç tür hareket:**
- **Depoya giriş** — satın alınan malzeme depoya eklenir (muhasebeden otomatik de gelebilir, elle de girilebilir)
- **Konumlar arası aktarım** — örn. depodan kat hizmetlerine malzeme verildiğinde; toplam stok değişmez, sadece
  hangi konumda olduğu değişir
- **Çıkış (tüketim)** — kat görevlisi elindeki malzeme bittiğinde/kullanıldığında burada "çıkış" olarak işaretler;
  bu, malzemenin sistemden gerçekten düştüğü hareket

Varsayılan olarak iki konum kuruludur: **Depo** ve **Kat Hizmetleri**. İsterseniz sayfadan yeni konumlar da
ekleyebilirsiniz (örn. kat bazlı depo). Düşük stok uyarısı **depo** miktarına göre hesaplanır (minimum seviyenin
altına düşünce sayfanın üstünde turuncu bir uyarı çıkar).

Her hareket kimin/ne zaman/ne kadar yaptığı bilgisiyle kalıcı olarak tutulur — sadece anlık bir sayı değil, tam bir
geçmiş. Bir çıkış hareketini isteğe bağlı olarak bir daireyle de ilişkilendirebilirsiniz (örn. "Oda 205 için 2 havlu
çıkışı"). "Envanter / Stok" yetkisi sınırlı yetkili personel hesaplarına da (örn. kat hizmetleri/housekeeping) ayrı
ayrı verilebilir — böylece kat görevlisi sadece bu sayfaya girip "çıkış" formunu kullanabilir.

## Sonraki faz

- Online ödeme (iyzico / PayTR)
- Booking.com ve Airbnb takvim senkronizasyonu (iCal)
- Gider ve kâr raporu ekranı
- Sözleşme ve fatura PDF üretimi
- Blog bölümü
