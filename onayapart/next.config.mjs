/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Panelde daire fotograflari icin harici bir gorsel adresi (link) yapistirilabiliyor;
    // hangi siteden geleceni onceden bilemedigimiz icin tum https adreslerine izin veriyoruz.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
};
export default nextConfig;
