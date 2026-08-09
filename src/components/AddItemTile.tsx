export function AddItemTile({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={label}
      className="no-print flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-[2.5px] border-dashed border-black/40 bg-white text-black/40 transition hover:border-black hover:text-black"
    >
      <span className="font-display text-4xl leading-none">+</span>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}
