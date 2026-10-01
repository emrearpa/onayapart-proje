import { toLocale, type LocaleParams } from "@/features/site/locale";
import FaqView, { faqMetadata } from "@/features/site/views/FaqView";

export const revalidate = 300;

export const generateMetadata = ({ params }: LocaleParams) => faqMetadata(toLocale(params.locale));

export default function Page({ params }: LocaleParams) {
  return <FaqView locale={toLocale(params.locale)} />;
}
