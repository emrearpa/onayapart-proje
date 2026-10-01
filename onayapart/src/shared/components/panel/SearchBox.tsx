export default function SearchBox({
  placeholder,
  value,
  paramName = "q",
  hiddenParams,
}: {
  placeholder: string;
  value?: string;
  paramName?: string;
  /** Sayfada korunmasi gereken baska query parametreleri varsa (orn. tarih araligi). */
  hiddenParams?: Record<string, string | undefined>;
}) {
  return (
    <form method="get" className="flex gap-2">
      {hiddenParams &&
        Object.entries(hiddenParams)
          .filter(([, v]) => v)
          .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input
        type="search"
        name={paramName}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="w-full max-w-xs rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
      />
      <button className="btn-outline shrink-0">Ara</button>
      {value && (
        <a href="?" className="shrink-0 self-center text-xs font-bold text-ink-soft hover:text-red-700">
          Temizle
        </a>
      )}
    </form>
  );
}
