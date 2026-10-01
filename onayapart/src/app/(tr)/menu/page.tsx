import MenuView, { menuMetadata } from "@/features/site/views/MenuView";

export const revalidate = 300;

export const generateMetadata = () => menuMetadata();

export default function Page() {
  return <MenuView />;
}
