import Icon from "@/shared/components/panel/Icon";

export default function PanelLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[42vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-bold text-brand-700 shadow-sm">
        <Icon name="spinner" className="h-5 w-5 animate-spin" />
        Sayfa hazırlanıyor…
      </div>
    </div>
  );
}
