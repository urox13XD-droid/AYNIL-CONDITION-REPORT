"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { ComicButton } from "@/components/ComicButton";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { SelectionActionBar } from "@/components/SelectionActionBar";
import { NotesField, TextField } from "@/components/fields";
import { useItemSelection } from "@/lib/useItemSelection";
import { emptyDiagram, newId, OpticalEntry, OpticalGroupMarker, OpticalItem, ReportHeader } from "@/lib/types";

export function newOpticalItem(): OpticalItem {
  return {
    id: newId("opt"),
    entryKind: "item",
    name: "",
    serial: "",
    notes: "",
    front: emptyDiagram(),
    back: emptyDiagram(),
    body: emptyDiagram(),
    bodyOpen: false,
  };
}

export function newOpticalGroup(): OpticalGroupMarker {
  return { id: newId("grp"), entryKind: "group", label: "" };
}

function cloneOpticalEntry(entry: OpticalEntry): OpticalEntry {
  if (entry.entryKind === "group") return { ...entry, id: newId("grp") };
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

function GroupBanner({
  group,
  onChange,
  onRemove,
}: {
  group: OpticalGroupMarker;
  onChange: (g: OpticalGroupMarker) => void;
  onRemove: () => void;
}) {
  return (
    <div className="col-span-full flex items-center gap-2 rounded-lg border-[2.5px] border-black bg-black px-4 py-2 text-white shadow-comic-sm">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/60">Série</span>
      <input
        value={group.label}
        onChange={(e) => onChange({ ...group, label: e.target.value })}
        placeholder="Ex. Cooke S4"
        className="font-display min-w-0 flex-1 bg-transparent text-lg uppercase tracking-wide outline-none placeholder:text-white/40"
      />
      <button type="button" onClick={onRemove} title="Retirer ce repère" className="no-print shrink-0 text-xs font-bold opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

function OpticalItemCard({
  item,
  onChange,
  onRemove,
  selected,
  onToggleSelect,
}: {
  item: OpticalItem;
  onChange: (item: OpticalItem) => void;
  onRemove: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("scratch");

  return (
    <ItemCardShell
      onRemove={onRemove}
      selected={selected}
      onToggleSelect={onToggleSelect}
      cornerNotch={<BodyNotchButton open={item.bodyOpen} onToggle={() => onChange({ ...item, bodyOpen: !item.bodyOpen })} />}
    >
      <div className="flex flex-col gap-3">
        <TextField label="Optique" value={item.name} onChange={(v) => onChange({ ...item, name: v })} placeholder="Ex. Cooke S4 35mm" />
        <TextField label="N° série (#)" value={item.serial} onChange={(v) => onChange({ ...item, serial: v })} mono />
        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />
        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex items-end justify-center gap-3 pt-1">
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
        </div>
        {item.bodyOpen && (
          <div className="flex flex-col items-center gap-1 border-t-[1.5px] border-black/10 pt-3">
            <MarkableDiagram
              shape="rect"
              size="body"
              backgroundSrc="/lens-body.png"
              value={item.body}
              onChange={(d) => onChange({ ...item, body: d })}
              tool={tool}
              label="Carrosserie"
            />
          </div>
        )}
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
  const addGroup = () => onItemsChange([...items, newOpticalGroup()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <HeaderFields kind="optical" header={header} onChange={onHeaderChange} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs italic text-black/50">
          NB : pour repérer l&apos;orientation de l&apos;optique, marquez un point sur la monture à droite pour la face
          avant, à gauche pour la face arrière.
        </p>
        <ComicButton
          onClick={addGroup}
          title="Regrouper les optiques suivantes sous un repère de série (ex. Cooke S4)"
          className="no-print"
        >
          + Repère de série
        </ComicButton>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((entry) =>
          entry.entryKind === "group" ? (
            <GroupBanner key={entry.id} group={entry} onChange={(g) => updateEntry(entry.id, g)} onRemove={() => removeEntry(entry.id)} />
          ) : (
            <OpticalItemCard
              key={entry.id}
              item={entry}
              onChange={(next) => updateEntry(entry.id, next)}
              onRemove={() => removeEntry(entry.id)}
              selected={selection.selected.has(entry.id)}
              onToggleSelect={() => selection.toggle(entry.id)}
            />
          )
        )}
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
