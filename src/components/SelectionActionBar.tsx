"use client";

import { ComicButton } from "@/components/ComicButton";
import { useLocale } from "@/lib/i18n";

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
  const { t } = useLocale();
  if (count === 0) return null;
  return (
    <div className="no-print fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border-[2.5px] border-black bg-white px-4 py-2 shadow-comic-lg">
      <span className="text-xs font-bold uppercase tracking-wide">
        {count} {count > 1 ? t("selection.selectedPlural") : t("selection.selected")}
      </span>
      <ComicButton onClick={onDuplicate} title={t("selection.duplicateTitle")}>
        {t("selection.duplicate")}
      </ComicButton>
      <ComicButton onClick={onCopy} title={t("selection.copyTitle")}>
        {t("selection.copy")}
      </ComicButton>
      <ComicButton onClick={onDelete} title={t("selection.deleteTitle")}>
        {t("selection.delete")}
      </ComicButton>
      <button type="button" onClick={onClear} title={t("selection.clearTitle")} className="text-xs font-bold opacity-50 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}
