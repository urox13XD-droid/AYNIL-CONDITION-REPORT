"use client";

import { useLocale } from "@/lib/i18n";
import { ReportKind } from "@/lib/types";

const ORDER: ReportKind[] = ["optical", "filter", "monitoring", "camera"];

export function ReportTabs({
  active,
  onChange,
  sessionBar,
}: {
  active: ReportKind;
  onChange: (k: ReportKind) => void;
  /** shared-session status/join content, pinned to the right of this row */
  sessionBar?: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="no-print flex items-center gap-2 overflow-x-auto border-b-[3px] border-black bg-white px-4 py-2.5 sm:flex-wrap">
      {ORDER.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`shrink-0 rounded-lg border-[2.5px] border-black px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            active === k ? "bg-black text-white shadow-comic-sm" : "bg-white text-black hover:bg-black/10"
          }`}
        >
          {t(`reportLabel.${k}`)}
        </button>
      ))}
      {sessionBar && <div className="ml-auto flex shrink-0 items-center gap-2">{sessionBar}</div>}
    </div>
  );
}
