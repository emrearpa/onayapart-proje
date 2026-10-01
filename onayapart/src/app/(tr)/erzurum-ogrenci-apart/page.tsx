import type { Metadata } from "next";
import LandingTemplate, { LandingContent } from "@/components/LandingTemplate";
import { hreflangAlternates } from "@/lib/i18n/config";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Erzurum Öğrenci Apart — Dönemlik Kiralık Apart Daire",
  description:
    "Erzurum'da öğrenciler için dönemlik kiralık apart daire. Güvenli, faturalar dahil, çalışma masalı 1+0, 1+1 ve 2+1 daireler. 0530 652 70 88",
  alternates: { canonical: "/erzurum-ogrenci-apart", languages: hreflangAlternates("/erzurum-ogrenci-apart") },
};

const content: LandingContent = {
  path: "/erzurum-ogrenci-apart",
  h1: "Erzurum öğrenci apart: eğitim dönemine özel konaklama",
  intro:
    "Yurt sırası beklemeden, ev arkadaşı bulma derdi olmadan kendi dairenizde kalın. Eğitim dönemi boyunca sabit fiyat, faturalar dahil, 7/24 kameralı güvenlik.",
  bullets: [
    { title: "Dönemlik fiyat", text: "Eğitim dönemi boyunca sabit ücret; ara tatilde daireniz size ait kalır." },
    { title: "Çalışma düzeni", text: "Her dairede çalışma masası ve kesintisiz fiber internet." },
    { title: "Veliye güven", text: "Kameralı giriş, kimlik kaydı ve düzenli temizlik hizmeti." },
  ],
  body: [
    {
      heading: "Yurt mu, apart mı?",
      text: "Yurtta giriş çıkış saatleri, ortak alan yoğunluğu ve sınırlı çalışma imkânı vardır. Apart dairede kendi programınıza göre yaşar, sınav döneminde istediğiniz saatte çalışırsınız. Mutfağınız olduğu için beslenme masrafınız da düşer. İki veya üç arkadaş 2+1 dairelerimizde kaldığında kişi başı maliyet yurt seviyesine yaklaşır.",
    },
    {
      heading: "Güvenlik ve aile ile iletişim",
      text: "Binamızda 7/24 kamera sistemi ve giriş kontrolü bulunur. Konaklayan her öğrencinin kimlik kaydı tutulur, yasal bildirimler yapılır. Velilerimizle iletişim kanalımız açıktır; acil durumlarda aileye ulaşılır.",
    },
    {
      heading: "Dönem başında yer ayırtın",
      text: "Eylül ve Şubat dönemlerinde daireler hızla dolar. Dönem başlamadan önce yer ayırtmak için arayın; kaporayla dairenizi güvenceye alabilirsiniz.",
    },
  ],
  faqs: [
    {
      q: "Öğrenci konaklamasında fiyat nasıl belirleniyor?",
      a: "Eğitim dönemi boyunca sabit aylık ücret uygulanır ve faturalar bu ücrete dahildir. Güncel fiyat için bizi arayın.",
    },
    {
      q: "Arkadaşımla birlikte kalabilir miyim?",
      a: "Evet. 1+1 dairelerimiz iki kişi, 2+1 dairelerimiz üç-dört kişi için uygundur; maliyet paylaşıldığında kişi başı ücret düşer.",
    },
    {
      q: "Kız ve erkek öğrenciler aynı katta mı kalıyor?",
      a: "Kat ve daire düzenlemesi talep ve müsaitliğe göre ayrı planlanmaktadır. Detay için bizimle görüşün.",
    },
  ],
};

export default function Page() {
  return <LandingTemplate content={content} />;
}
