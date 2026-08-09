export function UndoRedoDock({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="no-print flex items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Annuler (Ctrl+Z)"
        className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-black bg-white text-lg font-bold shadow-comic-sm transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
      >
        ↺
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Rétablir (Ctrl+Maj+Z)"
        className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-black bg-white text-lg font-bold shadow-comic-sm transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
      >
        ↻
      </button>
    </div>
  );
}
