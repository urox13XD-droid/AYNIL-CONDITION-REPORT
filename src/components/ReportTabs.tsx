import { REPORT_LABELS, ReportKind } from "@/lib/types";

const ORDER: ReportKind[] = ["optical", "filter", "monitoring", "camera"];

export function ReportTabs({ active, onChange }: { active: ReportKind; onChange: (k: ReportKind) => void }) {
  return (
    <div className="no-print flex flex-wrap gap-2 border-b-[3px] border-black bg-white px-4 py-2.5">
      {ORDER.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-lg border-[2.5px] border-black px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            active === k ? "bg-black text-white shadow-comic-sm" : "bg-white text-black hover:bg-black/10"
          }`}
        >
          {REPORT_LABELS[k]}
        </button>
      ))}
    </div>
  );
}
