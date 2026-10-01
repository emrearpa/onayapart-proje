import { toLocale, type LocaleParams } from "@/features/site/locale";
import ContactView, { contactMetadata } from "@/features/site/views/ContactView";

export const revalidate = 3600;

export const generateMetadata = ({ params }: LocaleParams) => contactMetadata(toLocale(params.locale));

export default function Page({ params }: LocaleParams) {
  return <ContactView locale={toLocale(params.locale)} />;
}
