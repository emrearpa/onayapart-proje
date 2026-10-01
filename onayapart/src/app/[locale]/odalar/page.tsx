import { toLocale, type LocaleParams } from "@/features/site/locale";
import RoomsView, { roomsMetadata } from "@/features/site/views/RoomsView";

export const revalidate = 300;

export const generateMetadata = ({ params }: LocaleParams) => roomsMetadata(toLocale(params.locale));

export default function Page({ params }: LocaleParams) {
  return <RoomsView locale={toLocale(params.locale)} />;
}
