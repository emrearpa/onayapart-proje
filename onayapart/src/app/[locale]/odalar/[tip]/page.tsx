import { toLocale, type LocaleParams } from "@/features/site/locale";
import RoomTypeView, { roomTypeMetadata } from "@/features/site/views/RoomTypeView";

export const revalidate = 300;

type Props = LocaleParams<{ tip: string }>;

export const generateMetadata = ({ params }: Props) => roomTypeMetadata(params.tip, toLocale(params.locale));

export default function Page({ params }: Props) {
  return <RoomTypeView slug={params.tip} locale={toLocale(params.locale)} />;
}
