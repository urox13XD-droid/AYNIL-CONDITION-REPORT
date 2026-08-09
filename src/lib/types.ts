export type ReportKind = "optical" | "filter" | "monitoring";

/** normalized 0..1 coordinates within a diagram's own bounding box */
export interface MarkPoint {
  x: number;
  y: number;
}

export type MarkTool = "scratch" | "impact" | "smudge" | "pen";

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
export type FilterPairLabels = "av-ar" | "camera-comedien";

export interface OpticalItem {
  id: string;
  name: string;
  serial: string;
  notes: string;
  front: DiagramState;
  back: DiagramState;
}

export interface FilterItem {
  id: string;
  category: string;
  model: string;
  serial: string;
  notes: string;
  shape: FilterShape;
  pairLabels: FilterPairLabels;
  front: DiagramState;
  back: DiagramState;
}

export type ProtectionState = "" | "aucune" | "neuve" | "usagee";

export interface MonitoringItem {
  id: string;
  name: string;
  serial: string;
  protection: ProtectionState;
  notes: string;
  screen: DiagramState;
}

export interface ReportHeader {
  date: string;
  prod: string;
  film: string;
  loueur: string;
  assistant: string;
}

export function emptyHeader(): ReportHeader {
  return { date: "", prod: "", film: "", loueur: "", assistant: "" };
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
};

export const REPORT_TITLES: Record<ReportKind, string> = {
  optical: "État des optiques",
  filter: "État des filtres",
  monitoring: "État des moniteurs",
};

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
