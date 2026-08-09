export function ItemCardShell({
  onRemove,
  selected = false,
  onToggleSelect,
  cornerNotch,
  children,
}: {
  onRemove: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** extra button anchored to the bottom-right corner (e.g. the optical lens-body notch) */
  cornerNotch?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`print-page relative rounded-xl border-[2.5px] bg-white p-4 shadow-comic ${
        selected ? "border-black ring-2 ring-black ring-offset-2" : "border-black"
      }`}
    >
      {onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          title="Sélectionner"
          className={`no-print absolute -left-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-black text-xs font-bold shadow-comic-sm ${
            selected ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
          }`}
        >
          {selected ? "✓" : ""}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        title="Retirer cet appareil"
        className="no-print absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-xs font-bold shadow-comic-sm hover:bg-black hover:text-white"
      >
        ✕
      </button>
      {children}
      {cornerNotch}
    </div>
  );
}
