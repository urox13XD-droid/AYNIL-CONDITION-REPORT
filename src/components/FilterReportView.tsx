"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { ComboOption, DeviceNameField } from "@/components/DeviceNameField";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, autoDims, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { SelectionActionBar } from "@/components/SelectionActionBar";
import { NotesField, TextField } from "@/components/fields";
import { useItemSelection } from "@/lib/useItemSelection";
import { emptyDiagram, FilterItem, FilterShape, newId, ReportHeader } from "@/lib/types";

function cloneFilterItem(item: FilterItem): FilterItem {
  return { ...item, id: newId("flt"), front: { marks: [...item.front.marks] }, back: { marks: [...item.back.marks] } };
}

const CATEGORIES = [
  "Neutre 4x4",
  "Neutre 4x5.6",
  "Neutre 5x5",
  "Neutre 6x6",
  "Dégradé Soft 5x5",
  "Dégradé Hard 5x5",
  "Dégradé Soft 6x6",
  "Dégradé Hard 6x6",
  "Dégradé Soft 4x5.6",
  "Dégradé Hard 4x5.6",
  "Polaframe 6x6",
  "Polaframe 4x5.6",
  "Pola Ø138mm",
  "Pola Ø156mm",
  "Dioptrie",
  "Dioptrie Split",
  "Filtre à effet",
  "Autre",
] as const;

// Modèle suggestions for "Filtre à effet" — free typing stays possible, this just offers picks
const EFFECT_FILTER_NAMES = [
  "Glimmer Glass",
  "Classic Soft",
  "White Promist",
  "Black Promist",
  "Hollywood Black Magic",
  "Soft FX",
  "Diff Mitchell",
  "Black Satin",
  "Satin",
  "Black Diff",
  "Gold Diff",
  "Tiffen 80",
  "Tiffen 81",
  "Ultra Contrast",
  "Low Contrast",
  "Pearlscent",
  "Fog",
  "Tobacco",
  "Sunset",
  "Blue Streak",
  "Smoque",
  "Day for Night",
  "Radiant Soft",
  "Gold Streak",
];
const EFFECT_FILTER_OPTIONS: ComboOption[] = EFFECT_FILTER_NAMES.map((name) => ({ id: name, name }));

const DEFAULT_SHAPE: Record<string, FilterShape> = {
  "Neutre 4x4": "rect",
  "Neutre 4x5.6": "rect",
  "Neutre 5x5": "rect",
  "Neutre 6x6": "rect",
  "Dégradé Soft 5x5": "rect",
  "Dégradé Hard 5x5": "rect",
  "Dégradé Soft 6x6": "rect",
  "Dégradé Hard 6x6": "rect",
  "Dégradé Soft 4x5.6": "rect",
  "Dégradé Hard 4x5.6": "rect",
  "Polaframe 6x6": "rect",
  "Polaframe 4x5.6": "rect",
  "Pola Ø138mm": "circle",
  "Pola Ø156mm": "circle",
  Dioptrie: "circle",
  "Dioptrie Split": "circle",
  "Filtre à effet": "rect",
  Autre: "rect",
};

// graduated ND filters get a soft/hard gradient thumbnail instead of a plain box
const GRADIENT_CATEGORY: Record<string, "soft" | "hard"> = {
  "Dégradé Soft 5x5": "soft",
  "Dégradé Hard 5x5": "hard",
  "Dégradé Soft 6x6": "soft",
  "Dégradé Hard 6x6": "hard",
  "Dégradé Soft 4x5.6": "soft",
  "Dégradé Hard 4x5.6": "hard",
};

// real reference art for the polarizer frames — same traced image reused for
// the back side, mirrored horizontally (see imgMirror below)
const CATEGORY_ART: Record<string, string> = {
  "Polaframe 6x6": "/polaframe-6x6.png",
  "Polaframe 4x5.6": "/polaframe-4x5.6.png",
};

// px-per-inch scale, so a 6x6 filter reads visibly bigger than a 4x4 one and
// a 4x5.6 reads as a landscape rectangle rather than a square
const FILTER_UNIT_PX = 22;
function squareDims(inches: number) {
  const s = inches * FILTER_UNIT_PX;
  return { width: s, height: s };
}
function landscapeDims(shortInches: number, longInches: number) {
  return { width: longInches * FILTER_UNIT_PX, height: shortInches * FILTER_UNIT_PX };
}
const MM_PER_INCH = 25.4;
const CATEGORY_DIMS: Record<string, { width: number; height: number }> = {
  "Neutre 4x4": squareDims(4),
  "Neutre 4x5.6": landscapeDims(4, 5.65),
  "Neutre 5x5": squareDims(5),
  "Neutre 6x6": squareDims(6),
  "Dégradé Soft 5x5": squareDims(5),
  "Dégradé Hard 5x5": squareDims(5),
  "Dégradé Soft 6x6": squareDims(6),
  "Dégradé Hard 6x6": squareDims(6),
  "Dégradé Soft 4x5.6": landscapeDims(4, 5.65),
  "Dégradé Hard 4x5.6": landscapeDims(4, 5.65),
  // real traced-art aspect ratio, scaled to the same footprint as the equivalent plain Neutre size
  // (the plate itself is squarish regardless of the glass size it holds)
  "Polaframe 6x6": autoDims(1203 / 1308, 6 * FILTER_UNIT_PX),
  "Polaframe 4x5.6": autoDims(1, 5.65 * FILTER_UNIT_PX),
  "Pola Ø138mm": squareDims(138 / MM_PER_INCH),
  "Pola Ø156mm": squareDims(156 / MM_PER_INCH),
  Dioptrie: squareDims(138 / MM_PER_INCH),
  "Dioptrie Split": squareDims(138 / MM_PER_INCH),
  Autre: squareDims(4.5),
};

const DIOPTER_CATEGORIES = new Set(["Dioptrie", "Dioptrie Split"]);

// same proportional scale as the equivalent Neutre sizes, so the diagram matches when picked
const EFFECT_SIZE_DIMS: Record<FilterItem["effectSize"], { width: number; height: number }> = {
  "4x4": squareDims(4),
  "4x5.6": landscapeDims(4, 5.65),
  "6x6": squareDims(6),
};

const ND_GRADES = ["N 0.3", "N 0.6", "N 0.9", "N 1.2", "N 1.5", "N 1.8", "N 2.1", "N 2.4"];
const DEG_GRADES = ["N 0.3", "N 0.6", "N 0.9"];
const DIOPTRIE_VALUES = ["+1/2", "+1", "+2", "+3"];
// categories with a fixed list of models — rendered as a dropdown (no free typing)
const SELECT_MODELS: Record<string, string[]> = {
  "Neutre 4x4": ND_GRADES,
  "Neutre 4x5.6": ND_GRADES,
  "Neutre 5x5": ND_GRADES,
  "Neutre 6x6": ND_GRADES,
  "Dégradé Soft 5x5": DEG_GRADES,
  "Dégradé Hard 5x5": DEG_GRADES,
  "Dégradé Soft 6x6": DEG_GRADES,
  "Dégradé Hard 6x6": DEG_GRADES,
  "Dégradé Soft 4x5.6": DEG_GRADES,
  "Dégradé Hard 4x5.6": DEG_GRADES,
  Dioptrie: DIOPTRIE_VALUES,
  "Dioptrie Split": DIOPTRIE_VALUES,
};
// categories where the category name already fully describes the filter — no model field at all
const NO_MODEL_CATEGORIES = new Set(["Polaframe 6x6", "Polaframe 4x5.6", "Pola Ø138mm", "Pola Ø156mm"]);

export function newFilterItem(): FilterItem {
  return {
    id: newId("flt"),
    category: CATEGORIES[0],
    model: "",
    notes: "",
    shape: "rect",
    diopterSize: "138",
    effectSize: "4x4",
    front: emptyDiagram(),
    back: emptyDiagram(),
  };
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
  const [tool, setTool] = useState<ActiveTool>("pen");
  const selectModels = SELECT_MODELS[item.category];
  const art = CATEGORY_ART[item.category];
  const isDiopter = DIOPTER_CATEGORIES.has(item.category);
  const isEffectFilter = item.category === "Filtre à effet";
  const dims = isDiopter
    ? squareDims(Number(item.diopterSize) / MM_PER_INCH)
    : isEffectFilter
      ? EFFECT_SIZE_DIMS[item.effectSize]
      : (CATEGORY_DIMS[item.category] ?? CATEGORY_DIMS.Autre);
  const gradient = GRADIENT_CATEGORY[item.category];
  const dividerLine = item.category === "Dioptrie Split";

  return (
    <ItemCardShell onRemove={onRemove} selected={selected} onToggleSelect={onToggleSelect}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Catégorie</span>
          <select
            value={item.category}
            onChange={(e) => {
              const category = e.target.value;
              onChange({ ...item, category, model: "", shape: DEFAULT_SHAPE[category] ?? item.shape });
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

        {!NO_MODEL_CATEGORIES.has(item.category) &&
          (isEffectFilter ? (
            <DeviceNameField
              label="Modèle"
              value={item.model}
              onChange={(v) => onChange({ ...item, model: v })}
              onPick={(o) => onChange({ ...item, model: o.name })}
              options={EFFECT_FILTER_OPTIONS}
              placeholder="Ex. Glimmer Glass"
            />
          ) : selectModels ? (
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Modèle</span>
              <select
                value={item.model}
                onChange={(e) => onChange({ ...item, model: e.target.value })}
                className="rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-black"
              >
                <option value="">— Choisir —</option>
                {selectModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <TextField label="Modèle" value={item.model} onChange={(v) => onChange({ ...item, model: v })} />
          ))}

        {isDiopter && (
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Taille</span>
            <select
              value={item.diopterSize}
              onChange={(e) => onChange({ ...item, diopterSize: e.target.value as "138" | "156" })}
              className="rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-black"
            >
              <option value="138">Ø138mm</option>
              <option value="156">Ø156mm</option>
            </select>
          </label>
        )}

        {isEffectFilter && (
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Taille</span>
            <select
              value={item.effectSize}
              onChange={(e) => onChange({ ...item, effectSize: e.target.value as FilterItem["effectSize"] })}
              className="rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-black"
            >
              <option value="4x4">4x4</option>
              <option value="4x5.6">4x5.6</option>
              <option value="6x6">6x6</option>
            </select>
          </label>
        )}

        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />

        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex items-end justify-center gap-3 pt-1">
          <MarkableDiagram
            shape={item.shape}
            dims={dims}
            frameless={!!art}
            backgroundSrc={art}
            dividerLine={dividerLine}
            gradient={gradient}
            value={item.front}
            onChange={(d) => onChange({ ...item, front: d })}
            tool={tool}
            label="Av."
          />
          <MarkableDiagram
            shape={item.shape}
            dims={dims}
            frameless={!!art}
            backgroundSrc={art}
            imgMirror={!!art}
            dividerLine={dividerLine}
            gradient={gradient}
            gradientFlip
            value={item.back}
            onChange={(d) => onChange({ ...item, back: d })}
            tool={tool}
            label="Ar."
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
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 print:max-w-full print:gap-1.5 print:p-2">
      <HeaderFields kind="filter" header={header} onChange={onHeaderChange} />
      <p className="no-print text-xs italic text-black/50">
        Choisissez un repère sur le bord du filtre (étiquette, encoche…) et dessinez-le afin de connaître son orientation.
      </p>
      <div className="report-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
