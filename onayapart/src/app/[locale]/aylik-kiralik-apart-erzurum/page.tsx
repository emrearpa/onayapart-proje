import { notFound } from "next/navigation";
import LandingTemplate from "@/features/content/components/LandingTemplate";
import { landingMetadata } from "@/features/content/landing";
import { monthlyLanding } from "@/features/content/landing/monthly";
import { isLocale } from "@/shared/i18n/config";

export const revalidate = 600;

type Props = { params: { locale: string } };

export const generateMetadata = ({ params }: Props) => landingMetadata(monthlyLanding, params.locale);

export default function Page({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  return <LandingTemplate page={monthlyLanding} locale={params.locale} />;
}
