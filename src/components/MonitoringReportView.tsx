"use client";

import { useState } from "react";
import { AddItemTile } from "@/components/AddItemTile";
import { HeaderFields } from "@/components/HeaderFields";
import { ItemCardShell } from "@/components/ItemCardShell";
import { ActiveTool, MarkableDiagram, MarkToolPalette } from "@/components/MarkableDiagram";
import { NotesField, TextField } from "@/components/fields";
import { emptyDiagram, MonitoringItem, newId, ProtectionState, ReportHeader } from "@/lib/types";

const PROTECTION_OPTIONS: { value: ProtectionState; label: string }[] = [
  { value: "", label: "—" },
  { value: "aucune", label: "Aucune" },
  { value: "neuve", label: "Neuve" },
  { value: "usagee", label: "Usagée" },
];

export function newMonitoringItem(): MonitoringItem {
  return { id: newId("mon"), name: "", serial: "", protection: "", notes: "", screen: emptyDiagram() };
}

function MonitoringItemCard({
  item,
  onChange,
  onRemove,
}: {
  item: MonitoringItem;
  onChange: (item: MonitoringItem) => void;
  onRemove: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("scratch");

  return (
    <ItemCardShell onRemove={onRemove}>
      <div className="flex flex-col gap-3">
        <TextField label="Écran" value={item.name} onChange={(v) => onChange({ ...item, name: v })} placeholder="Ex. SmallHD Cine 7" />
        <TextField label="N° série (#)" value={item.serial} onChange={(v) => onChange({ ...item, serial: v })} mono />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Vitre de protection</span>
          <select
            value={item.protection}
            onChange={(e) => onChange({ ...item, protection: e.target.value as ProtectionState })}
            className="rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-black"
          >
            {PROTECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />
        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex items-center justify-center pt-1">
          <MarkableDiagram shape="rect" value={item.screen} onChange={(d) => onChange({ ...item, screen: d })} tool={tool} />
        </div>
      </div>
    </ItemCardShell>
  );
}

export function MonitoringReportView({
  header,
  onHeaderChange,
  items,
  onItemsChange,
}: {
  header: ReportHeader;
  onHeaderChange: (h: ReportHeader) => void;
  items: MonitoringItem[];
  onItemsChange: (items: MonitoringItem[]) => void;
}) {
  const updateItem = (id: string, next: MonitoringItem) => onItemsChange(items.map((it) => (it.id === id ? next : it)));
  const removeItem = (id: string) => onItemsChange(items.filter((it) => it.id !== id));
  const addItem = () => onItemsChange([...items, newMonitoringItem()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <HeaderFields kind="monitoring" header={header} onChange={onHeaderChange} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <MonitoringItemCard key={it.id} item={it} onChange={(next) => updateItem(it.id, next)} onRemove={() => removeItem(it.id)} />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter un écran" />
      </div>
    </div>
  );
}
