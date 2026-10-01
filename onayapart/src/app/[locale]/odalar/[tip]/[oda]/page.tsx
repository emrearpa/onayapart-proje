import { toLocale, type LocaleParams } from "@/features/site/locale";
import RoomView, { roomMetadata } from "@/features/site/views/RoomView";

export const revalidate = 300;

type Props = LocaleParams<{ tip: string; oda: string }>;

export const generateMetadata = ({ params }: Props) => roomMetadata(params.tip, params.oda, toLocale(params.locale));

export default function Page({ params }: Props) {
  return <RoomView typeSlug={params.tip} roomSlug={params.oda} locale={toLocale(params.locale)} />;
}
