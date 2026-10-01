import LandingTemplate from "@/features/content/components/LandingTemplate";
import { landingMetadata } from "@/features/content/landing";
import { studentLanding } from "@/features/content/landing/student";

export const revalidate = 600;

export const generateMetadata = () => landingMetadata(studentLanding);

export default function Page() {
  return <LandingTemplate page={studentLanding} />;
}
