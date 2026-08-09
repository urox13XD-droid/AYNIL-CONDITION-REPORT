"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { SelectionActionBar } from "@/components/SelectionActionBar";
import { NotesField, TextField } from "@/components/fields";
import { useItemSelection } from "@/lib/useItemSelection";
import { emptyDiagram, FilterItem, FilterPairLabels, FilterShape, newId, ReportHeader } from "@/lib/types";

function cloneFilterItem(item: FilterItem): FilterItem {
  return { ...item, id: newId("flt"), front: { marks: [...item.front.marks] }, back: { marks: [...item.back.marks] } };
}

const CATEGORIES = ["Neutre 4x4", "Neutre 4x5.6", "Neutre 5x5", "Neutre 6x6", "Polarisant", "Dioptrie", "Autre"] as const;

const DEFAULT_SHAPE: Record<string, FilterShape> = {
  "Neutre 4x4": "rect",
  "Neutre 4x5.6": "rect",
  "Neutre 5x5": "rect",
  "Neutre 6x6": "rect",
  Polarisant: "circle",
  Dioptrie: "circle",
  Autre: "rect",
};

// px-per-inch scale, so a 6x6 filter reads visibly bigger than a 4x4 one and
// a 4x5.6 reads as a portrait rectangle rather than a square
const FILTER_UNIT_PX = 18;
function squareDims(inches: number) {
  const s = inches * FILTER_UNIT_PX;
  return { width: s, height: s };
}
const CATEGORY_DIMS: Record<string, { width: number; height: number }> = {
  "Neutre 4x4": squareDims(4),
  "Neutre 4x5.6": { width: 4 * FILTER_UNIT_PX, height: 5.65 * FILTER_UNIT_PX },
  "Neutre 5x5": squareDims(5),
  "Neutre 6x6": squareDims(6),
  Polarisant: squareDims(4.5),
  Dioptrie: squareDims(4),
  Autre: squareDims(4.5),
};

const ND_GRADES = ["N 0.3", "N 0.6", "N 0.9", "N 1.2", "N 1.5", "N 1.8", "N 2.1"];
const MODEL_SUGGESTIONS: Record<string, string[]> = {
  "Neutre 4x4": ND_GRADES,
  "Neutre 4x5.6": ND_GRADES,
  "Neutre 5x5": ND_GRADES,
  "Neutre 6x6": ND_GRADES,
  Polarisant: ["Polaframe", "Pola Ø 4.5", "Pola Ø 6.6", "Pola"],
  Dioptrie: ["+1/2", "+1", "+2", "+3"],
  Autre: [],
};

export function newFilterItem(): FilterItem {
  return {
    id: newId("flt"),
    category: CATEGORIES[0],
    model: "",
    serial: "",
    notes: "",
    shape: "rect",
    pairLabels: "av-ar",
    front: emptyDiagram(),
    back: emptyDiagram(),
  };
}

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border-[1.5px] border-black text-[10px] font-bold uppercase">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2 py-1 transition ${value === o.value ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterItemCard({
  item,
  onChange,
  onRemove,
  selected,
  onToggleSelect,
}: {
  item: FilterItem;
  onChange: (item: FilterItem) => void;
  onRemove: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("scratch");
  const datalistId = `models-${item.id}`;
  const pairLabelText = item.pairLabels === "av-ar" ? ["Av.", "Ar."] : ["Côté caméra", "Côté comédien"];

  return (
    <ItemCardShell onRemove={onRemove} selected={selected} onToggleSelect={onToggleSelect}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Catégorie</span>
          <select
            value={item.category}
            onChange={(e) => {
              const category = e.target.value;
              onChange({ ...item, category, shape: DEFAULT_SHAPE[category] ?? item.shape });
            }}
            className="rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-black"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Modèle (marque, valeur…)"
          value={item.model}
          onChange={(v) => onChange({ ...item, model: v })}
          listId={datalistId}
        />
        <datalist id={datalistId}>
          {(MODEL_SUGGESTIONS[item.category] ?? []).map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <TextField label="N° série / repère (#)" value={item.serial} onChange={(v) => onChange({ ...item, serial: v })} mono />
        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />

        <div className="flex flex-wrap items-center gap-4">
          <SegmentedToggle
            value={item.shape}
            options={[
              { value: "rect", label: "Carré" },
              { value: "circle", label: "Rond" },
            ]}
            onChange={(shape: FilterShape) => onChange({ ...item, shape })}
          />
          <SegmentedToggle
            value={item.pairLabels}
            options={[
              { value: "av-ar", label: "Av. / Ar." },
              { value: "camera-comedien", label: "Caméra / Comédien" },
            ]}
            onChange={(pairLabels: FilterPairLabels) => onChange({ ...item, pairLabels })}
          />
        </div>

        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex items-end justify-center gap-3 pt-1">
          <MarkableDiagram
            shape={item.shape}
            dims={CATEGORY_DIMS[item.category] ?? CATEGORY_DIMS.Autre}
            value={item.front}
            onChange={(d) => onChange({ ...item, front: d })}
            tool={tool}
            label={pairLabelText[0]}
            shade={item.pairLabels === "camera-comedien"}
          />
          <MarkableDiagram
            shape={item.shape}
            dims={CATEGORY_DIMS[item.category] ?? CATEGORY_DIMS.Autre}
            value={item.back}
            onChange={(d) => onChange({ ...item, back: d })}
            tool={tool}
            label={pairLabelText[1]}
            shade={item.pairLabels === "camera-comedien"}
          />
        </div>
      </div>
    </ItemCardShell>
  );
}

export function FilterReportView({
  header,
  onHeaderChange,
  items,
  onItemsChange,
}: {
  header: ReportHeader;
  onHeaderChange: (h: ReportHeader) => void;
  items: FilterItem[];
  onItemsChange: (items: FilterItem[]) => void;
}) {
  const selection = useItemSelection<FilterItem>(items, onItemsChange, cloneFilterItem);
  const updateItem = (id: string, next: FilterItem) => onItemsChange(items.map((it) => (it.id === id ? next : it)));
  const removeItem = (id: string) => onItemsChange(items.filter((it) => it.id !== id));
  const addItem = () => onItemsChange([...items, newFilterItem()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <HeaderFields kind="filter" header={header} onChange={onHeaderChange} />
      <p className="text-xs italic text-black/50">
        Choisissez un repère sur le bord du filtre (étiquette, encoche…) et dessinez-le afin de connaître son orientation.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <FilterItemCard
            key={it.id}
            item={it}
            onChange={(next) => updateItem(it.id, next)}
            onRemove={() => removeItem(it.id)}
            selected={selection.selected.has(it.id)}
            onToggleSelect={() => selection.toggle(it.id)}
          />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter un filtre" />
      </div>
      <SelectionActionBar
        count={selection.selected.size}
        onDuplicate={() => selection.duplicateIds([...selection.selected])}
        onCopy={() => selection.copyIds([...selection.selected])}
        onDelete={() => selection.removeIds([...selection.selected])}
        onClear={selection.clearSelection}
      />
    </div>
  );
}
