import { getPublishedRoomPaths } from "@/features/rooms/queries";
import { staticParams } from "@/features/site/locale";
import RoomTypeView, { roomTypeMetadata } from "@/features/site/views/RoomTypeView";

export const revalidate = 300;

type Props = { params: { tip: string } };

export const generateStaticParams = () =>
  staticParams(async () => (await getPublishedRoomPaths()).types.map((type) => ({ tip: type.slug })));

export const generateMetadata = ({ params }: Props) => roomTypeMetadata(params.tip);

export default function Page({ params }: Props) {
  return <RoomTypeView slug={params.tip} />;
}
