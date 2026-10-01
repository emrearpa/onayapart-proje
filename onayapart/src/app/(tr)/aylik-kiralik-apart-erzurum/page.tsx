import type { Metadata } from "next";
import LandingTemplate, { LandingContent } from "@/features/content/components/LandingTemplate";
import { hreflangAlternates } from "@/shared/i18n/config";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Aylık Kiralık Apart Erzurum — Eşyalı Daire",
  description:
    "Erzurum'da aylık kiralık eşyalı apart daire. Faturalar ve internet dahil, depozito ile kısa sürede taşınabilir 1+0, 1+1 ve 2+1 daireler. 0530 652 70 88",
  alternates: { canonical: "/aylik-kiralik-apart-erzurum", languages: hreflangAlternates("/aylik-kiralik-apart-erzurum") },
};

const content: LandingContent = {
  path: "/aylik-kiralik-apart-erzurum",
  h1: "Erzurum'da aylık kiralık eşyalı apart daire",
  intro:
    "Tayin, geçici görev ya da uzun süreli iş için Erzurum'a gelenlere: eşya taşımadan, kontrat ve abonelik derdi olmadan aynı hafta içinde taşınabileceğiniz daireler.",
  bullets: [
    { title: "Faturalar dahil", text: "Doğalgaz, elektrik, su ve internet aylık ücrete dahildir; ayrı abonelik açmanız gerekmez." },
    { title: "Eşya taşımak yok", text: "Beyaz eşya, mobilya ve mutfak gereçleri dairede hazır." },
    { title: "Esnek süre", text: "Bir aydan başlayan, uzatılabilir konaklama." },
  ],
  body: [
    {
      heading: "Boş daire kiralamak yerine apart",
      text: "Erzurum'da boş daire kiralamak depozito, kontrat, abonelik ve eşya masrafı demek. Birkaç aylığına şehirde kalacaksanız bu masrafların hiçbiri geri dönmez. Aylık apart kiralamada tek ödeme yaparsınız; ısınma, internet ve temizlik dahil olduğu için ay sonunda sürpriz fatura çıkmaz.",
    },
    {
      heading: "Erzurum kışına hazır daireler",
      text: "Erzurum'da ısınma en önemli konforlardan biridir. Dairelerimizde doğalgaz ısıtma sistemi bulunur, sıcak su 24 saat kesintisizdir. Kış aylarında ısıtma maliyeti aylık fiyata dahil olduğu için bütçenizi önceden net olarak planlayabilirsiniz.",
    },
    {
      heading: "Kurumsal konaklama",
      text: "Şantiye, proje ve geçici görev ekipleri için kurumsal faturalı, uzun dönem konaklama anlaşmaları yapıyoruz. Birden fazla daire ihtiyacı olan kurumlar için toplu fiyat sunuyoruz.",
    },
  ],
  faqs: [
    {
      q: "Aylık kiralamada depozito alınıyor mu?",
      a: "Evet, uzun süreli konaklamalarda standart bir depozito alınır ve hasar yoksa çıkışta iade edilir.",
    },
    {
      q: "Faturalar fiyata dahil mi?",
      a: "Doğalgaz, elektrik, su ve internet aylık ücrete dahildir. Olağan dışı tüketimlerde durum ayrıca değerlendirilir.",
    },
    {
      q: "Kurumsal fatura kesiyor musunuz?",
      a: "Evet. Kurumsal konaklamalarda faturalandırma yapılır ve sözleşme düzenlenir.",
    },
  ],
};

export default function Page() {
  return <LandingTemplate content={content} />;
}
