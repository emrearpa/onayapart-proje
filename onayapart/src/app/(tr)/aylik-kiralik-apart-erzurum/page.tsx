import LandingTemplate from "@/features/content/components/LandingTemplate";
import { landingMetadata } from "@/features/content/landing";
import { monthlyLanding } from "@/features/content/landing/monthly";

export const revalidate = 600;

export const generateMetadata = () => landingMetadata(monthlyLanding);

export default function Page() {
  return <LandingTemplate page={monthlyLanding} />;
}
