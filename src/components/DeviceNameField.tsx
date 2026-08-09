"use client";

import { useState } from "react";

export interface ComboOption {
  id: string;
  name: string;
}

/** a plain text field that also unfurls a filterable dropdown over itself — free typing stays possible, picking a suggestion just fills it in */
export function DeviceNameField({
  label,
  value,
  onChange,
  onPick,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (option: ComboOption) => void;
  options: ComboOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = query ? options.filter((o) => o.name.toLowerCase().includes(query)) : options;

  return (
    <label className="relative flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        className="rounded-md border-[1.5px] border-black/40 px-2 py-1 text-sm font-semibold outline-none focus:border-black"
      />
      {open && filtered.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="no-print absolute left-0 top-full z-20 mt-1 max-h-48 w-full min-w-48 overflow-y-auto rounded-md border-[1.5px] border-black bg-white shadow-comic-lg"
        >
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onPick(o);
                setOpen(false);
              }}
              className="block w-full truncate px-2 py-1.5 text-left text-xs font-semibold hover:bg-black hover:text-white"
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
