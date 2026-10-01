import { defaultLocale, type AnyLocale, type Locale } from "@/shared/i18n/config";
import tr from "./tr";
import en from "./en";
import ar from "./ar";
import fa from "./fa";
import ru from "./ru";
import de from "./de";
import fr from "./fr";
import es from "./es";
import az from "./az";
import ka from "./ka";

// Turkce sozlugun anahtarlari referans alinir; her dil ayni SEKLI tasimak zorundadir
// (eksik ya da fazla anahtar derleme hatasi verir), degerler serbest metindir.
export type Dictionary = { [K in keyof typeof tr]: { [F in keyof (typeof tr)[K]]: string } };

const dictionaries: Record<AnyLocale, Dictionary> = { tr, en, ar, fa, ru, de, fr, es, az, ka };

/** Dil verilmezse varsayilan dilin (Turkce) sozlugu doner. */
export function getDictionary(locale: Locale | undefined = undefined): Dictionary {
  return dictionaries[locale ?? defaultLocale];
}
