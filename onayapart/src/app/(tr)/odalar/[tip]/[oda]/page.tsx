import { roomSlug } from "@/features/rooms/paths";
import { getPublishedRoomPaths } from "@/features/rooms/queries";
import { staticParams } from "@/features/site/locale";
import RoomView, { roomMetadata } from "@/features/site/views/RoomView";

export const revalidate = 300;

type Props = { params: { tip: string; oda: string } };

export const generateStaticParams = () =>
  staticParams(async () =>
    (await getPublishedRoomPaths()).rooms.map((room) => ({ tip: room.type.slug, oda: roomSlug(room.number) }))
  );

export const generateMetadata = ({ params }: Props) => roomMetadata(params.tip, params.oda);

export default function Page({ params }: Props) {
  return <RoomView typeSlug={params.tip} roomSlug={params.oda} />;
}
