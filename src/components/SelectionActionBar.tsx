import { ComicButton } from "@/components/ComicButton";

export function SelectionActionBar({
  count,
  onDuplicate,
  onCopy,
  onDelete,
  onClear,
}: {
  count: number;
  onDuplicate: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="no-print fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border-[2.5px] border-black bg-white px-4 py-2 shadow-comic-lg">
      <span className="text-xs font-bold uppercase tracking-wide">{count} sélectionné{count > 1 ? "s" : ""}</span>
      <ComicButton onClick={onDuplicate} title="Dupliquer (Ctrl+D)">
        Dupliquer
      </ComicButton>
      <ComicButton onClick={onCopy} title="Copier (Ctrl+C)">
        Copier
      </ComicButton>
      <ComicButton onClick={onDelete} title="Supprimer la sélection">
        Supprimer
      </ComicButton>
      <button type="button" onClick={onClear} title="Désélectionner" className="text-xs font-bold opacity-50 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}
