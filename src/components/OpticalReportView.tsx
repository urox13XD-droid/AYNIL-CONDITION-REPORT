"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, autoDims, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { SelectionActionBar } from "@/components/SelectionActionBar";
import { NotesField, TextField } from "@/components/fields";
import { useItemSelection } from "@/lib/useItemSelection";
import { emptyDiagram, newId, OpticalEntry, OpticalItem, ReportHeader } from "@/lib/types";

export function newOpticalItem(): OpticalItem {
  return {
    id: newId("opt"),
    name: "",
    seriesOn: false,
    seriesLabel: "",
    serial: "",
    notes: "",
    front: emptyDiagram(),
    back: emptyDiagram(),
    body: emptyDiagram(),
    bodyOpen: false,
  };
}

// the traced lens-body art (public/lens-body.png), rotated so the mount faces
// down — real aspect ratio, sized to sit comfortably next to the Av./Ar. circles
const LENS_BODY_DIMS = autoDims(983 / 1600, 180);

function cloneOpticalEntry(entry: OpticalEntry): OpticalEntry {
  return {
    ...entry,
    id: newId("opt"),
    front: { marks: [...entry.front.marks] },
    back: { marks: [...entry.back.marks] },
    body: { marks: [...entry.body.marks] },
  };
}

function BodyNotchButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={open ? "Masquer la carrosserie" : "Ajouter l'état de la carrosserie"}
      className={`no-print absolute -bottom-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-black text-[11px] font-bold shadow-comic-sm ${
        open ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <rect x="4" y="8" width="16" height="8" rx="1.5" />
      </svg>
    </button>
  );
}

function SeriesNotchButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={open ? "Retirer de la série" : "Fait partie d'une série (ex. Cooke S4)"}
      className={`no-print absolute -right-2.5 top-7 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-black text-[11px] font-bold shadow-comic-sm ${
        open ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    </button>
  );
}

function OpticalItemCard({
  item,
  onChange,
  onToggleSeries,
  onRemove,
  selected,
  onToggleSelect,
}: {
  item: OpticalItem;
  onChange: (item: OpticalItem) => void;
  onToggleSeries: () => void;
  onRemove: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("pen");

  return (
    <ItemCardShell
      onRemove={onRemove}
      selected={selected}
      onToggleSelect={onToggleSelect}
      cornerNotch={
        <>
          <SeriesNotchButton open={item.seriesOn} onToggle={onToggleSeries} />
          <BodyNotchButton open={item.bodyOpen} onToggle={() => onChange({ ...item, bodyOpen: !item.bodyOpen })} />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {item.seriesOn && (
          <div className="flex items-center gap-2 rounded-md border-[2px] border-black bg-neutral-300 px-2.5 py-1 text-black">
            <span className="shrink-0 rounded-sm border-[1.5px] border-black/60 px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black/70">
              Série
            </span>
            <input
              value={item.seriesLabel}
              onChange={(e) => onChange({ ...item, seriesLabel: e.target.value })}
              placeholder="Ex. Cooke S4"
              className="font-display min-w-0 flex-1 bg-transparent text-sm uppercase tracking-wide outline-none placeholder:text-black/30"
            />
          </div>
        )}
        <TextField
          label={item.seriesOn ? "Focale" : "Optique"}
          value={item.name}
          onChange={(v) => onChange({ ...item, name: v })}
          placeholder={item.seriesOn ? "Ex. 35mm" : "Ex. Cooke S4 35mm"}
        />
        <TextField label="N° série (#)" value={item.serial} onChange={(v) => onChange({ ...item, serial: v })} mono />
        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />
        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex flex-wrap items-end justify-center gap-3 pt-1">
          <MarkableDiagram
            shape="circle"
            value={item.front}
            onChange={(d) => onChange({ ...item, front: d })}
            tool={tool}
            label="Av."
          />
          <MarkableDiagram
            shape="circle"
            value={item.back}
            onChange={(d) => onChange({ ...item, back: d })}
            tool={tool}
            label="Ar."
            size="sm"
          />
          {item.bodyOpen && (
            <MarkableDiagram
              shape="rect"
              dims={LENS_BODY_DIMS}
              frameless
              backgroundSrc="/lens-body.png"
              value={item.body}
              onChange={(d) => onChange({ ...item, body: d })}
              tool={tool}
              label="Carrosserie"
            />
          )}
        </div>
      </div>
    </ItemCardShell>
  );
}

export function OpticalReportView({
  header,
  onHeaderChange,
  items,
  onItemsChange,
}: {
  header: ReportHeader;
  onHeaderChange: (h: ReportHeader) => void;
  items: OpticalEntry[];
  onItemsChange: (items: OpticalEntry[]) => void;
}) {
  const selection = useItemSelection<OpticalEntry>(items, onItemsChange, cloneOpticalEntry);

  const updateEntry = (id: string, next: OpticalEntry) => onItemsChange(items.map((e) => (e.id === id ? next : e)));
  const removeEntry = (id: string) => onItemsChange(items.filter((e) => e.id !== id));
  const addItem = () => onItemsChange([...items, newOpticalItem()]);

  // toggling a card into a series copies the series name from its left
  // neighbour when that one is already in a series, so it only has to be
  // typed once per series — otherwise it's seeded from this card's own name
  // field (which then becomes just the focal length)
  const toggleSeries = (id: string) => {
    const idx = items.findIndex((e) => e.id === id);
    const item = items[idx];
    if (item.seriesOn) {
      onItemsChange(items.map((e) => (e.id === id ? { ...e, seriesOn: false } : e)));
      return;
    }
    const left = idx > 0 ? items[idx - 1] : undefined;
    const inheritLabel = left?.seriesOn ? left.seriesLabel : "";
    const seriesLabel = inheritLabel || item.name.trim();
    const name = inheritLabel ? item.name : "";
    onItemsChange(items.map((e) => (e.id === id ? { ...e, seriesOn: true, seriesLabel, name } : e)));
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 print:max-w-full print:gap-1.5 print:p-2">
      <HeaderFields kind="optical" header={header} onChange={onHeaderChange} />
      <p className="no-print text-xs italic text-black/50">
        NB : pour repérer l&apos;orientation de l&apos;optique, marquez un point sur la monture à droite pour la face
        avant, à gauche pour la face arrière. Le petit bouton en haut à droite de chaque optique permet de
        l&apos;associer à une série (ex. Cooke S4) — le champ principal ne contient alors que la focale.
      </p>
      <div className="report-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((entry) => (
          <OpticalItemCard
            key={entry.id}
            item={entry}
            onChange={(next) => updateEntry(entry.id, next)}
            onToggleSeries={() => toggleSeries(entry.id)}
            onRemove={() => removeEntry(entry.id)}
            selected={selection.selected.has(entry.id)}
            onToggleSelect={() => selection.toggle(entry.id)}
          />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter une optique" />
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
