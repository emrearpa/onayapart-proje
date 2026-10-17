export default function LocalizedSiteLoading() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-brand-50/50 px-5">
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-bold text-brand-700 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        Sayfa hazırlanıyor…
      </div>
    </main>
  );
}
