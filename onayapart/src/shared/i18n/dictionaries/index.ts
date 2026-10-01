import type { Locale } from "@/shared/i18n/config";
import en from "./en";
import ar from "./ar";
import fa from "./fa";
import ru from "./ru";
import de from "./de";
import fr from "./fr";
import es from "./es";
import az from "./az";
import ka from "./ka";

// en'in yapisini (anahtarlari) referans alip degerleri string'e genisletiyoruz -
// her dilin kendi metinleri farkli literal string oldugu icin `typeof en` ile
// birebir eslesmezler, sadece SEKILLERI ayni olmali.
type Dictionary = { [K in keyof typeof en]: { [F in keyof (typeof en)[K]]: string } };

const dictionaries: Record<Locale, Dictionary> = { en, ar, fa, ru, de, fr, es, az, ka };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
