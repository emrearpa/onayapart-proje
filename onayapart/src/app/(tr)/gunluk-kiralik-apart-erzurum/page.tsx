import LandingTemplate from "@/features/content/components/LandingTemplate";
import { landingMetadata } from "@/features/content/landing";
import { dailyLanding } from "@/features/content/landing/daily";

export const revalidate = 600;

export const generateMetadata = () => landingMetadata(dailyLanding);

export default function Page() {
  return <LandingTemplate page={dailyLanding} />;
}
