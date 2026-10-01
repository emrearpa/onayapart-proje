import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import RoomCard from "@/features/rooms/components/RoomCard";
import LeadForm from "@/features/leads/components/LeadForm";
import { getRoomType, getRooms } from "@/features/rooms/queries";
import { prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import { hreflangAlternates } from "@/shared/i18n/config";

export const revalidate = 300;

type Props = { params: { tip: string } };

export async function generateStaticParams() {
  const types = await prisma.roomType.findMany({ select: { slug: true } });
  return types.map((t) => ({ tip: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const type = await getRoomType(params.tip);
  if (!type) return {};
  return {
    title: `${type.seoTitle} — Onay Apart Rezidans`,
    description: type.seoText.slice(0, 155),
    alternates: { canonical: `/odalar/${type.slug}`, languages: hreflangAlternates(`/odalar/${type.slug}`) },
  };
}

export default async function TypePage({ params }: Props) {
  const type = await getRoomType(params.tip);
  if (!type) notFound();

  const rooms = await getRooms(params.tip);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <nav className="text-xs text-ink-soft">
              <Link href="/odalar" className="hover:text-brand-500">
                Odalarımız
              </Link>{" "}
              / {type.name}
            </nav>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{type.seoTitle}</h1>
            <p className="lede mt-3 max-w-[62ch]">{type.description}</p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {[
                `${type.minM2}–${type.maxM2} m²`,
                type.capacity,
                `${rooms.length} daire`,
              ].map((x) => (
                <span key={x} className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="h2">{type.name} daireleri</h2>
            <p className="lede mt-2">Daireye tıklayın, fotoğraflarını ve tüm detaylarını görün.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((r, i) => (
                <RoomCard key={r.id} room={r} priority={i < 3} />
              ))}
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Daire özellikleri</h2>
                <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                  {type.features.split("\n").map((f) => (
                    <li key={f} className="relative pl-6">
                      <span className="absolute left-0 font-extrabold text-brand-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Konaklama ve fiyat</h2>
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {type.rates.map((r) => (
                      <tr key={r.id} className="border-b border-line">
                        <td className="py-2.5">{r.label}</td>
                        <td className="py-2.5 text-right font-bold">
                          {r.price ? fmtMoney(r.price) : "Arayın"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-12 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">{type.seoTitle} hakkında</h2>
              <p className="mt-3">{type.seoText}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <LeadForm />
          </aside>
        </section>
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
