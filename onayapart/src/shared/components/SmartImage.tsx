import Image, { type ImageProps } from "next/image";

/**
 * next/image sarmalayicisi. Kendi sunucumuzdaki gorseller optimize edilir; panelden
 * yapistirilan harici adresler (ve data: URI'ler) optimize edilmeden, dogrudan
 * kaynagindan yuklenir. Boylece gorsel optimizasyon ucu herhangi bir siteye acik
 * bir vekil (proxy) haline gelmez ve next.config'te alan adi listesi tutmak gerekmez.
 */
export default function SmartImage({ src, alt, ...props }: ImageProps) {
  const isLocal = typeof src !== "string" || src.startsWith("/");
  return <Image src={src} alt={alt} unoptimized={!isLocal} {...props} />;
}
