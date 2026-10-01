import Image from "next/image";

const PALETTES = [
  ["#175037", "#268159"],
  ["#0c3324", "#1c6045"],
  ["#1c6045", "#7fc4a4"],
  ["#11402d", "#4e9c76"],
];

/** Fotograf yuklenmemis daireler icin marka renginde yer tutucu uretir. */
export function placeholder(number: number, label: string, index = 0) {
  const [a, b] = PALETTES[index % PALETTES.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>
<rect width='800' height='600' fill='url(#g)'/>
<g fill='none' stroke='rgba(255,255,255,.18)' stroke-width='2'><rect x='60' y='120' width='300' height='220' rx='10'/><rect x='420' y='200' width='320' height='140' rx='10'/><line x1='0' y1='420' x2='800' y2='420'/></g>
<text x='40' y='500' fill='rgba(255,255,255,.95)' font-family='Manrope,Arial' font-size='40' font-weight='700'>Oda ${number}</text>
<text x='40' y='545' fill='rgba(255,255,255,.75)' font-family='Manrope,Arial' font-size='26'>${label}</text>
<text x='620' y='545' fill='rgba(255,255,255,.55)' font-family='Manrope,Arial' font-size='20'>ONAY APART</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export default function RoomPhoto({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const isData = src.startsWith("data:");
  if (isData) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />;
  }
  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
  );
}
