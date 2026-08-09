"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { NotesField, TextField } from "@/components/fields";
import { emptyDiagram, newId, OpticalItem, ReportHeader } from "@/lib/types";

export function newOpticalItem(): OpticalItem {
  return { id: newId("opt"), name: "", serial: "", notes: "", front: emptyDiagram(), back: emptyDiagram() };
}

function OpticalItemCard({
  item,
  onChange,
  onRemove,
}: {
  item: OpticalItem;
  onChange: (item: OpticalItem) => void;
  onRemove: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("scratch");

  return (
    <ItemCardShell onRemove={onRemove}>
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
  items: OpticalItem[];
  onItemsChange: (items: OpticalItem[]) => void;
}) {
  const updateItem = (id: string, next: OpticalItem) => onItemsChange(items.map((it) => (it.id === id ? next : it)));
  const removeItem = (id: string) => onItemsChange(items.filter((it) => it.id !== id));
  const addItem = () => onItemsChange([...items, newOpticalItem()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <HeaderFields kind="optical" header={header} onChange={onHeaderChange} />
      <p className="text-xs italic text-black/50">
        NB : pour repérer l&apos;orientation de l&apos;optique, marquez un point sur la monture à droite pour la face
        avant, à gauche pour la face arrière.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <OpticalItemCard key={it.id} item={it} onChange={(next) => updateItem(it.id, next)} onRemove={() => removeItem(it.id)} />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter une optique" />
      </div>
    </div>
  );
}
