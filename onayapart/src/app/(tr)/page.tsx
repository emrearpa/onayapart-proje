import HomeView, { homeMetadata } from "@/features/site/views/HomeView";

export const revalidate = 300;

export const generateMetadata = () => homeMetadata();

export default function Page() {
  return <HomeView />;
}
