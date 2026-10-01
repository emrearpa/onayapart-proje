import ContactView, { contactMetadata } from "@/features/site/views/ContactView";

export const revalidate = 3600;

export const generateMetadata = () => contactMetadata();

export default function Page() {
  return <ContactView />;
}
