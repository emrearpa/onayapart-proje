import RoomsView, { roomsMetadata } from "@/features/site/views/RoomsView";

export const revalidate = 300;

export const generateMetadata = () => roomsMetadata();

export default function Page() {
  return <RoomsView />;
}
