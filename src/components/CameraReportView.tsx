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
import { CAMERA_CATALOG, findCameraByName, getCameraById } from "@/lib/cameraCatalog";
import { CameraItem, emptyDiagram, newId, ReportHeader } from "@/lib/types";

const CAMERA_OPTIONS: ComboOption[] = CAMERA_CATALOG.map((d) => ({ id: d.id, name: d.name }));

// a plain square for sensor damage — always present regardless of which body (if any) is picked
const SENSOR_DIMS = { width: 128, height: 128 };

export function newCameraItem(): CameraItem {
  return { id: newId("cam"), name: "", serial: "", notes: "", sensor: emptyDiagram(), body: emptyDiagram() };
}

function cloneCameraItem(item: CameraItem): CameraItem {
  return { ...item, id: newId("cam"), sensor: { marks: [...item.sensor.marks] }, body: { marks: [...item.body.marks] } };
}

function CameraItemCard({
  item,
  onChange,
  onRemove,
  selected,
  onToggleSelect,
}: {
  item: CameraItem;
  onChange: (item: CameraItem) => void;
  onRemove: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [tool, setTool] = useState<ActiveTool>("pen");
  const device = item.deviceId ? getCameraById(item.deviceId) : undefined;

  return (
    <ItemCardShell onRemove={onRemove} selected={selected} onToggleSelect={onToggleSelect}>
      <div className="flex flex-col gap-3">
        <DeviceNameField
          label="Caméra"
          value={item.name}
          onChange={(v) => onChange({ ...item, name: v, deviceId: findCameraByName(v)?.id })}
          onPick={(o) => onChange({ ...item, name: o.name, deviceId: o.id })}
          options={CAMERA_OPTIONS}
          placeholder="Ex. Sony Venice 2"
        />
        <TextField label="N° série (#)" value={item.serial} onChange={(v) => onChange({ ...item, serial: v })} mono />
        <NotesField value={item.notes} onChange={(v) => onChange({ ...item, notes: v })} />
        <MarkToolPalette tool={tool} onToolChange={setTool} />
        <div className="flex flex-wrap items-end justify-center gap-3 pt-1">
          <MarkableDiagram
            shape="rect"
            dims={SENSOR_DIMS}
            value={item.sensor}
            onChange={(d) => onChange({ ...item, sensor: d })}
            tool={tool}
            label="Capteur"
          />
          {device?.iconUrl && (
            <MarkableDiagram
              shape="rect"
              dims={autoDims(device.iconAspect ?? 1.6, 200)}
              frameless
              backgroundSrc={device.iconUrl}
              value={item.body}
              onChange={(d) => onChange({ ...item, body: d })}
              tool={tool}
              label="Corps"
            />
          )}
        </div>
      </div>
    </ItemCardShell>
  );
}

export function CameraReportView({
  header,
  onHeaderChange,
  items,
  onItemsChange,
}: {
  header: ReportHeader;
  onHeaderChange: (h: ReportHeader) => void;
  items: CameraItem[];
  onItemsChange: (items: CameraItem[]) => void;
}) {
  const selection = useItemSelection<CameraItem>(items, onItemsChange, cloneCameraItem);
  const updateItem = (id: string, next: CameraItem) => onItemsChange(items.map((it) => (it.id === id ? next : it)));
  const removeItem = (id: string) => onItemsChange(items.filter((it) => it.id !== id));
  const addItem = () => onItemsChange([...items, newCameraItem()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 print:max-w-full print:gap-1.5 print:p-2">
      <HeaderFields kind="camera" header={header} onChange={onHeaderChange} />
      <div className="report-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((it) => (
          <CameraItemCard
            key={it.id}
            item={it}
            onChange={(next) => updateItem(it.id, next)}
            onRemove={() => removeItem(it.id)}
            selected={selection.selected.has(it.id)}
            onToggleSelect={() => selection.toggle(it.id)}
          />
        ))}
        <AddItemTile onAdd={addItem} label="Ajouter une caméra" />
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
