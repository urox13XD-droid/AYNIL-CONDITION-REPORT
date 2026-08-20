export type ReportKind = "optical" | "filter" | "monitoring" | "camera";

/** normalized 0..1 coordinates within a diagram's own bounding box */
export interface MarkPoint {
  x: number;
  y: number;
}

export type MarkTool = "scratch" | "impact" | "smudge" | "pen" | "pen-thin";

export interface Mark {
  id: string;
  tool: MarkTool;
  /** scratch: [start, end] · impact/smudge: [point] · pen: full path */
  points: MarkPoint[];
}

export interface DiagramState {
  marks: Mark[];
}

export function emptyDiagram(): DiagramState {
  return { marks: [] };
}

export type FilterShape = "rect" | "circle";

export interface OpticalItem {
  id: string;
  name: string;
  /** when on, `name` holds just the focal length and `seriesLabel` (e.g. "Cooke S4") is shown as a banner above it */
  seriesOn: boolean;
  seriesLabel: string;
  serial: string;
  notes: string;
  front: DiagramState;
  back: DiagramState;
  /** lens body / barrel condition — revealed on demand via the card's corner notch */
  body: DiagramState;
  bodyOpen: boolean;
}

export type OpticalEntry = OpticalItem;

export interface FilterItem {
  id: string;
  category: string;
  model: string;
  notes: string;
  shape: FilterShape;
  /** Dioptrie / Dioptrie Split only — Ø138 or Ø156mm */
  diopterSize: "138" | "156";
  /** Filtre à effet only — 4x4 / 4x5.6 / 6x6 */
  effectSize: "4x4" | "4x5.6" | "6x6";
  front: DiagramState;
  back: DiagramState;
}

export type ProtectionState = "" | "aucune" | "neuve" | "usagee";

export interface MonitoringItem {
  id: string;
  name: string;
  /** MONITOR_CATALOG id, set when `name` matches a known screen — drives the traced reference art */
  deviceId?: string;
  serial: string;
  protection: ProtectionState;
  notes: string;
  screen: DiagramState;
}

export interface CameraItem {
  id: string;
  name: string;
  /** CAMERA_CATALOG id, set when `name` matches a known body — drives the traced reference art */
  deviceId?: string;
  serial: string;
  notes: string;
  /** always shown — a plain square to mark sensor damage (dust, scratches) */
  sensor: DiagramState;
  /** the camera body — only meaningful once a catalog body is picked, drawn on its real artwork */
  body: DiagramState;
}

export interface ReportHeader {
  date: string;
  prod: string;
  film: string;
  loueur: string;
  assistant: string;
  signature: DiagramState;
}

export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyHeader(): ReportHeader {
  return { date: todayIso(), prod: "", film: "", loueur: "", assistant: "", signature: emptyDiagram() };
}

/** fills in defaults for fields missing from headers saved before they existed (e.g. signature) */
export function normalizeHeader(header?: Partial<ReportHeader>): ReportHeader {
  return { ...emptyHeader(), ...header };
}

export interface ConditionProject<T> {
  id: string;
  kind: ReportKind;
  name: string;
  header: ReportHeader;
  items: T[];
  updatedAt: number;
}

export const REPORT_LABELS: Record<ReportKind, string> = {
  optical: "Optical Report",
  filter: "Filter Report",
  monitoring: "Monitoring Report",
  camera: "Camera Report",
};

export const REPORT_TITLES: Record<ReportKind, string> = {
  optical: "État des optiques",
  filter: "État des filtres",
  monitoring: "État des moniteurs",
  camera: "État des caméras",
};

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
