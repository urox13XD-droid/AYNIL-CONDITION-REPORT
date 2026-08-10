import { Logo } from "@/components/Logo";
import { MarkableDiagram } from "@/components/MarkableDiagram";
import { ReportHeader, ReportKind, REPORT_TITLES } from "@/lib/types";

const SIGNATURE_DIMS = { width: 170, height: 70 };

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold print:text-[9px]">
      <span className="shrink-0 text-black/70">{label} :</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-md border-b-2 border-black bg-transparent px-1 py-0.5 outline-none focus:bg-black/5 print:border-b print:py-0"
      />
    </label>
  );
}

export function HeaderFields({
  kind,
  header,
  onChange,
}: {
  kind: ReportKind;
  header: ReportHeader;
  onChange: (h: ReportHeader) => void;
}) {
  const set = (patch: Partial<ReportHeader>) => onChange({ ...header, ...patch });

  return (
    <div className="flex flex-col gap-3 border-b-[2.5px] border-black pb-4 print:gap-1 print:border-b print:pb-1.5">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-wide sm:text-3xl print:text-base">{REPORT_TITLES[kind]} *</h1>
        <Logo />
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 print:gap-x-4 print:gap-y-0.5">
        <Field label="Date" value={header.date} onChange={(v) => set({ date: v })} placeholder="jj/mm/aaaa" />
        <Field label="Prod" value={header.prod} onChange={(v) => set({ prod: v })} />
        <Field label="Loueur" value={header.loueur} onChange={(v) => set({ loueur: v })} />
        <Field label="Film" value={header.film} onChange={(v) => set({ film: v })} />
        <Field
          label="Assistant·e / Tel."
          value={header.assistant}
          onChange={(v) => set({ assistant: v })}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold print:text-[9px]">
          <span className="shrink-0 text-black/70">Signature :</span>
          <MarkableDiagram
            shape="rect"
            dims={SIGNATURE_DIMS}
            printFullSize
            value={header.signature}
            onChange={(d) => set({ signature: d })}
            tool="pen"
          />
        </div>
      </div>
      <p className="text-[11px] italic text-black/50 print:text-[7px]">* Remettre une copie (papier ou PDF) au loueur avant le départ</p>
    </div>
  );
}
