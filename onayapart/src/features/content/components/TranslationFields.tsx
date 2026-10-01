import { locales, localeConfig } from "@/shared/i18n/config";

type Field = { name: string; label: string; type?: "text" | "textarea"; rows?: number };

/**
 * Herhangi bir panel formunun icine gomulebilen, desteklenen tum dillerde ceviri
 * girisi. Ayri bir <form> degil - ayni ust formun icinde render olur, her alan
 * `<locale>_<fieldName>` adiyla gelir (ornegin en_name, ar_description).
 * saveTranslationsFromForm() bu adlandirmayi bekler.
 */
export default function TranslationFields({
  fields,
  existing,
}: {
  fields: Field[];
  existing?: Partial<Record<string, Record<string, string>>>;
}) {
  return (
    <details className="rounded-xl border border-line">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-bold text-brand-600">
        🌐 Diğer dillerdeki çeviriler — isteğe bağlı, boş bırakılan dilde Türkçesi gösterilir
      </summary>
      <div className="space-y-5 border-t border-line p-4">
        {locales.map((locale) => (
          <div key={locale}>
            <h4 className="mb-2 text-xs font-extrabold text-ink-soft">
              {localeConfig[locale].nativeLabel} <span className="font-normal">({localeConfig[locale].label})</span>
            </h4>
            <div className="space-y-2">
              {fields.map((f) => {
                const name = `${locale}_${f.name}`;
                const defaultValue = existing?.[locale]?.[f.name] ?? "";
                return (
                  <label key={name} className="block text-xs font-bold">
                    {f.label}
                    {f.type === "textarea" ? (
                      <textarea
                        name={name}
                        defaultValue={defaultValue}
                        rows={f.rows ?? 2}
                        dir={localeConfig[locale].dir}
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal"
                      />
                    ) : (
                      <input
                        name={name}
                        defaultValue={defaultValue}
                        dir={localeConfig[locale].dir}
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
