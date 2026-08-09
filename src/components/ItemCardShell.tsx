export function ItemCardShell({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="print-page relative rounded-xl border-[2.5px] border-black bg-white p-4 shadow-comic">
      <button
        type="button"
        onClick={onRemove}
        title="Retirer cet appareil"
        className="no-print absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-xs font-bold shadow-comic-sm hover:bg-black hover:text-white"
      >
        ✕
      </button>
      {children}
    </div>
  );
}
