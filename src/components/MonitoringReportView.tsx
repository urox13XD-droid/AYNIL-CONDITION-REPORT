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
import { findMonitorByName, getMonitorById, MONITOR_CATALOG } from "@/lib/monitorCatalog";
import { emptyDiagram, MonitoringItem, newId, ProtectionState, ReportHeader } from "@/lib/types";

const MONITOR_OPTIONS: ComboOption[] = MONITOR_CATALOG.map((d) => ({ id: d.id, name: d.name }));

const PROTECTION_OPTIONS: { value: ProtectionState; label: string }[] = [
  { value: "", label: "—" },
  { value: "aucune", label: "Aucune" },
  { value: "neuve", label: "Neuve" },
  { value: "usagee", label: "Usagée" },
];

export function newMonitoringItem(): MonitoringItem {
  return { id: newId("mon"), name: "", serial: "", protection: "", notes: "", screen: emptyDiagram() };
}

function cloneMonitoringItem(item: MonitoringItem): MonitoringItem {
  return { ...item, id: newId("mon"), screen: { marks: [...item.screen.marks] } };
}

function MonitoringItemCard({
  item,
  onChange,
  onRemove,
  selected,
  onToggleSelect,
}: {
  item: MonitoringItem;
  onChange: (item: MonitoringItem) => void;
  onRemove: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("pen");
  const device = item.deviceId ? getMonitorById(item.deviceId) : undefined;

  return (
    <ItemCardShell onRemove={onRemove} selected={selected} onToggleSelect={onToggleSelect}>
      <div className="flex flex-col gap-3">
        <DeviceNameField
          label="Écran"
          value={item.name}
          onChange={(v) => onChange({ ...item, name: v, deviceId: findMonitorByName(v)?.id })}
          onPick={(o) => onChange({ ...item, name: o.name, deviceId: o.id })}
          options={MONITOR_OPTIONS}
          placeholder="Ex. SmallHD Cine 7"
        />
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
          {device?.iconUrl ? (
            <MarkableDiagram
              shape="rect"
              dims={autoDims(device.iconAspect ?? 1.6, 200)}
              frameless
              backgroundSrc={device.iconUrl}
              value={item.screen}
              onChange={(d) => onChange({ ...item, screen: d })}
              tool={tool}
            />
          ) : (
            <MarkableDiagram shape="rect" size="screen" value={item.screen} onChange={(d) => onChange({ ...item, screen: d })} tool={tool} />
          )}
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
  const selection = useItemSelection<MonitoringItem>(items, onItemsChange, cloneMonitoringItem);
  const updateItem = (id: string, next: MonitoringItem) => onItemsChange(items.map((it) => (it.id === id ? next : it)));
  const removeItem = (id: string) => onItemsChange(items.filter((it) => it.id !== id));
  const addItem = () => onItemsChange([...items, newMonitoringItem()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 print:max-w-full print:gap-1.5 print:p-2">
      <HeaderFields kind="monitoring" header={header} onChange={onHeaderChange} />
      <div className="report-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((it) => (
          <MonitoringItemCard
            key={it.id}
            item={it}
            onChange={(next) => updateItem(it.id, next)}
            onRemove={() => removeItem(it.id)}
            selected={selection.selected.has(it.id)}
            onToggleSelect={() => selection.toggle(it.id)}
          />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter un écran" />
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
