import { toLocale, type LocaleParams } from "@/features/site/locale";
import MenuView, { menuMetadata } from "@/features/site/views/MenuView";

export const revalidate = 300;

export const generateMetadata = ({ params }: LocaleParams) => menuMetadata(toLocale(params.locale));

export default function Page({ params }: LocaleParams) {
  return <MenuView locale={toLocale(params.locale)} />;
}
