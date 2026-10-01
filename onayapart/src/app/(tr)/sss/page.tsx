import FaqView, { faqMetadata } from "@/features/site/views/FaqView";

export const revalidate = 300;

export const generateMetadata = () => faqMetadata();

export default function Page() {
  return <FaqView />;
}
