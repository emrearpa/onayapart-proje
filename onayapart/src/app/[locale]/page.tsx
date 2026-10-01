import { toLocale, type LocaleParams } from "@/features/site/locale";
import HomeView, { homeMetadata } from "@/features/site/views/HomeView";

export const revalidate = 300;

export const generateMetadata = ({ params }: LocaleParams) => homeMetadata(toLocale(params.locale));

export default function Page({ params }: LocaleParams) {
  return <HomeView locale={toLocale(params.locale)} />;
}
