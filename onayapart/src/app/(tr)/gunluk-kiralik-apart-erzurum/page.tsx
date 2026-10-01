import type { Metadata } from "next";
import LandingTemplate, { LandingContent } from "@/features/content/components/LandingTemplate";
import { hreflangAlternates } from "@/shared/i18n/config";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Günlük Kiralık Apart Erzurum — Onay Apart Rezidans",
  description:
    "Erzurum'da günlük kiralık apart daire: Yakutiye merkezde eşyalı 1+0, 1+1 ve 2+1 daireler. Otel konforunda, mutfaklı konaklama. 0530 652 70 88",
  alternates: { canonical: "/gunluk-kiralik-apart-erzurum", languages: hreflangAlternates("/gunluk-kiralik-apart-erzurum") },
};

const content: LandingContent = {
  path: "/gunluk-kiralik-apart-erzurum",
  h1: "Erzurum'da günlük kiralık apart daire",
  intro:
    "İş seyahati, sağlık ziyareti veya kısa şehir molası için otel odasından daha geniş, mutfaklı ve ekonomik bir alternatif. Onay Apart Rezidans'ta günlük konaklamalarda faturalar, internet ve temizlik fiyata dahildir.",
  bullets: [
    { title: "Mutfaklı konaklama", text: "Ankastre mutfak ve mutfak gereçleriyle kendi yemeğinizi hazırlayabilirsiniz." },
    { title: "Merkezi konum", text: "Yakutiye Muratpaşa'da, çarşı ve toplu ulaşım duraklarına yürüme mesafesinde." },
    { title: "Anında müsaitlik", text: "Telefonla arayın, boş dairemizi aynı gün içinde teslim edelim." },
  ],
  body: [
    {
      heading: "Günlük apart mı, otel mi?",
      text: "Erzurum'da bir gece kalacaksanız otel odası yeterli olabilir; ancak birkaç gün kalacaksanız apart daire hem daha geniş hem daha ekonomiktir. Mutfağınız olduğu için her öğün dışarıda yemek zorunda kalmazsınız, çamaşır makinesi sayesinde uzun seyahatlerde valiz yükünüz azalır. Ailece veya grup halinde gelenler için kişi başına düşen maliyet otele göre belirgin biçimde düşer.",
    },
    {
      heading: "Kimler tercih ediyor?",
      text: "Şehir dışından gelen memur ve iş insanları, hastane refakatçileri, kayak sezonunda Palandöken'e gelen gruplar ve kısa süreli ziyaretçiler günlük apart konaklamamızı tercih ediyor. Erken giriş ve geç çıkış talepleriniz için müsaitlik durumuna göre esneklik sağlıyoruz.",
    },
    {
      heading: "Rezervasyon ve giriş",
      text: "Günlük konaklamalarda rezervasyon telefon veya WhatsApp üzerinden yapılır. Girişte kimlik ibrazı yasal zorunluluktur ve kimlik bildirimi tarafımızca yapılır. Giriş saatimiz 14.00, çıkış saatimiz 12.00'dir; daire müsaitse esnetilebilir.",
    },
  ],
  faqs: [
    {
      q: "Erzurum günlük kiralık apart fiyatları ne kadar?",
      a: "Fiyat daire tipine ve sezona göre değişir. Kayak sezonu ve yoğun dönemlerde fiyatlar farklılık gösterebilir; güncel fiyat için 0530 652 70 88 numaralı hattımızı arayın.",
    },
    {
      q: "Tek gecelik konaklama kabul ediyor musunuz?",
      a: "Evet, müsaitlik durumuna göre tek gecelik konaklama kabul edilmektedir.",
    },
    {
      q: "Havlu ve nevresim veriliyor mu?",
      a: "Evet. Tüm dairelerimiz temiz nevresim ve havlu ile teslim edilir, uzun konaklamalarda düzenli olarak değiştirilir.",
    },
  ],
};

export default function Page() {
  return <LandingTemplate content={content} />;
}
