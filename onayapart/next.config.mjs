const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Panel ve musteri paneli kisisel veri gosterir; ara sunucularda/tarayicida onbelleklenmez.
const privateHeaders = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Docker/VPS icin kendi basina calisan cikti (bkz. Dockerfile). Vercel'de gerekmez.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  images: {
    formats: ["image/avif", "image/webp"],
    // Yalnizca kendi sunucumuzdaki gorseller optimize edilir; harici adresler
    // SmartImage ile dogrudan kaynagindan yuklenir (bkz. shared/components/SmartImage).
  },
  experimental: {
    // Fotograf/evrak yuklemeleri server action ile gelir; varsayilan sinir 1 MB'tir.
    serverActions: { bodySizeLimit: "16mb" },
    // PDF'lerde kullanilan yazi tipleri calisma aninda diskten okunur; derleme ciktisina dahil edilir.
    outputFileTracingIncludes: {
      "/api/sozlesme/[id]": ["./assets/fonts/**"],
      "/api/muhasebe/rapor-pdf": ["./assets/fonts/**"],
    },
    instrumentationHook: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/panel/:path*", headers: privateHeaders },
      { source: "/musteri/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
