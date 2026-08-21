"use client";

import { useLocale } from "@/lib/i18n";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  listId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  listId?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId}
        className={`rounded-md border-[1.5px] border-black/40 px-2 py-1 text-sm font-semibold outline-none focus:border-black ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

export function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocale();
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">{t("fields.notes")}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        className="min-h-[2.1rem] resize-none rounded-md border-[1.5px] border-black/40 px-2 py-1 text-sm font-semibold outline-none focus:border-black"
      />
    </label>
  );
}
