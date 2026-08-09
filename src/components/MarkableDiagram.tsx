"use client";

import { useRef, useState } from "react";
import { DiagramState, Mark, MarkPoint, MarkTool, newId } from "@/lib/types";
import { useIsPrinting } from "@/lib/useIsPrinting";

export type ActiveTool = MarkTool | "eraser";

const ERASE_THRESHOLD = 0.07;
const MIN_DRAG = 0.015;

function hashUnit(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h / 9973;
}

function distToSegment(p: MarkPoint, a: MarkPoint, b: MarkPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function markDistance(mark: Mark, p: MarkPoint): number {
  if (mark.points.length === 1) return Math.hypot(p.x - mark.points[0].x, p.y - mark.points[0].y);
  let min = Infinity;
  for (let i = 0; i < mark.points.length - 1; i++) {
    min = Math.min(min, distToSegment(p, mark.points[i], mark.points[i + 1]));
  }
  return min;
}

/** small inline icons for the mark-tool palette, matching the app's plain black-line style */
const TOOL_ICON: Record<ActiveTool, React.ReactNode> = {
  scratch: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M5 19 L19 5" />
    </svg>
  ),
  impact: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4.2 4.2M17.8 17.8L13.6 13.6M6 18l4.2-4.2M17.8 6.2L13.6 10.4" />
    </svg>
  ),
  smudge: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20c3-1 4-9 8-13 1.5-1.5 3.5.5 2 2-4 4-12 5-10 11" />
    </svg>
  ),
  "pen-thin": (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20c3-1 4-9 8-13 1.5-1.5 3.5.5 2 2-4 4-12 5-10 11" />
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13 8 3 3 8l10 10M8 21h11" />
      <path d="M8 13 3 18l3 3h5" />
    </svg>
  ),
};

const TOOL_LABEL: Record<ActiveTool, string> = {
  pen: "Libre",
  "pen-thin": "Libre fin (micro-rayures)",
  scratch: "Rayure",
  impact: "Pok / impact",
  smudge: "Tache",
  eraser: "Gomme",
};

const TOOL_ORDER: ActiveTool[] = ["pen", "pen-thin", "scratch", "impact", "smudge", "eraser"];

export function MarkToolPalette({
  tool,
  onToolChange,
}: {
  tool: ActiveTool;
  onToolChange: (t: ActiveTool) => void;
}) {
  return (
    <div className="no-print flex flex-wrap gap-1">
      {TOOL_ORDER.map((t) => (
        <button
          key={t}
          type="button"
          title={TOOL_LABEL[t]}
          onClick={() => onToolChange(t)}
          className={`flex h-7 w-7 items-center justify-center rounded-md border-[1.5px] border-black transition ${
            tool === t ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
          }`}
        >
          {TOOL_ICON[t]}
        </button>
      ))}
    </div>
  );
}

/** one drawable shape (a lens element, a screen, a filter glass) with an SVG mark overlay */
const SIZE_CLASSES: Record<string, string> = {
  "circle-md": "h-32 w-32 rounded-full sm:h-36 sm:w-36",
  "circle-sm": "h-20 w-20 rounded-full sm:h-24 sm:w-24",
  "rect-md": "h-28 w-36 rounded-md sm:h-32 sm:w-40",
  "rect-sm": "h-20 w-28 rounded-md sm:h-24 sm:w-32",
  "rect-screen": "h-28 w-48 rounded-md sm:h-32 sm:w-56",
};

/** width/height (px) for a traced reference image of a given aspect ratio, capped to `target` on its longer side */
export function autoDims(aspect: number, target = 176): { width: number; height: number } {
  return aspect >= 1 ? { width: target, height: target / aspect } : { width: target * aspect, height: target };
}

// graduated-ND thumbnail tints — "soft" blends across the whole glass, "hard" snaps to a narrow band in the middle;
// the back side mirrors the gradient so it isn't a plain copy of the front
function gradientCss(kind: "soft" | "hard", flip: boolean): string {
  const dir = flip ? "to left" : "to right";
  return kind === "soft"
    ? `linear-gradient(${dir}, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)`
    : `linear-gradient(${dir}, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.6) 54%, rgba(0,0,0,0.6) 100%)`;
}

// diagrams shrink to these sizes when printing/exporting so a full report
// (e.g. a dozen lenses) fits several-up on one page instead of one giant box per item
const PRINT_TARGET_PX = 28;
const PRINT_SIZE_DIMS: Record<string, { width: number; height: number }> = {
  "circle-md": { width: 28, height: 28 },
  "circle-sm": { width: 22, height: 22 },
  "rect-md": { width: 28, height: 22 },
  "rect-sm": { width: 22, height: 17 },
  "rect-screen": { width: 38, height: 22 },
};
function scaleToPrint(dims: { width: number; height: number }): { width: number; height: number } {
  const scale = PRINT_TARGET_PX / Math.max(dims.width, dims.height);
  return { width: dims.width * scale, height: dims.height * scale };
}

export function MarkableDiagram({
  shape,
  value,
  onChange,
  tool,
  label,
  shade = false,
  size = "md",
  backgroundSrc,
  dims,
  frameless = false,
  imgMirror = false,
  dividerLine = false,
  gradient,
  gradientFlip = false,
}: {
  shape: "circle" | "rect";
  value: DiagramState;
  onChange: (d: DiagramState) => void;
  tool: ActiveTool;
  label?: string;
  /** light gray fill, used for the polarizer "côté caméra/comédien" backing in the paper form */
  shade?: boolean;
  /** "sm" reads smaller (rear lens element) · "screen" is a wide monitor aspect */
  size?: "md" | "sm" | "screen";
  /** a traced reference drawing (e.g. a lens barrel, a real screen) shown behind the mark overlay */
  backgroundSrc?: string;
  /** explicit px size, overrides `size` — used for real-aspect reference art and the filter size scale */
  dims?: { width: number; height: number };
  /** no border/background chrome — just the reference art (or nothing) with marks drawn straight on top */
  frameless?: boolean;
  /** mirror `backgroundSrc` horizontally (left/right only, keeps the same way up) — used to reuse one traced image for both the front and back side */
  imgMirror?: boolean;
  /** a fixed line across the middle — split diopters, drawn under the marks */
  dividerLine?: boolean;
  /** graduated-ND tint shown as a background gradient instead of traced art */
  gradient?: "soft" | "hard";
  /** mirror the gradient direction — used so the back side isn't a plain copy of the front */
  gradientFlip?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState<MarkPoint[] | null>(null);
  const draftRef = useRef<MarkPoint[] | null>(null);
  const draggingRef = useRef(false);
  const isPrinting = useIsPrinting();

  const updateDraft = (points: MarkPoint[] | null) => {
    draftRef.current = points;
    setDraft(points);
  };

  const toPoint = (e: React.PointerEvent): MarkPoint => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const commitMark = (tool: MarkTool, points: MarkPoint[]) => {
    onChange({ marks: [...value.marks, { id: newId("mk"), tool, points }] });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = toPoint(e);

    if (tool === "eraser") {
      let best: { id: string; dist: number } | null = null;
      for (const m of value.marks) {
        const d = markDistance(m, p);
        if (d < ERASE_THRESHOLD && (!best || d < best.dist)) best = { id: m.id, dist: d };
      }
      if (best) onChange({ marks: value.marks.filter((m) => m.id !== best!.id) });
      return;
    }

    if (tool === "impact" || tool === "smudge") {
      commitMark(tool, [p]);
      return;
    }

    // scratch / pen: start a drag
    draggingRef.current = true;
    updateDraft([p]);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const p = toPoint(e);
    const prev = draftRef.current;
    const next = !prev ? [p] : tool === "scratch" ? [prev[0], p] : [...prev, p];
    updateDraft(next);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const prev = draftRef.current;
    updateDraft(null);
    if (prev && prev.length >= 2 && (tool === "scratch" || tool === "pen" || tool === "pen-thin")) {
      const span = Math.hypot(prev[prev.length - 1].x - prev[0].x, prev[prev.length - 1].y - prev[0].y);
      if (span >= MIN_DRAG) commitMark(tool, prev);
    }
  };

  const clearAll = () => {
    if (value.marks.length === 0) return;
    onChange({ marks: [] });
  };

  const renderMark = (m: Mark) => {
    const pts = m.points.map((pt) => ({ x: pt.x * 100, y: pt.y * 100 }));
    if (m.tool === "scratch" && pts.length >= 2) {
      const [a, b] = pts;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const bow = (hashUnit(m.id) - 0.5) * Math.min(4, len * 0.25);
      const cx = mx + (-dy / len) * bow;
      const cy = my + (dx / len) * bow;
      return (
        <path
          key={m.id}
          d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
          fill="none"
          stroke="#000"
          strokeWidth={0.9}
          strokeLinecap="round"
        />
      );
    }
    if (m.tool === "impact") {
      const [c] = pts;
      const r = 3.2;
      const rays = [0, 60, 120].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const dx = Math.cos(rad) * r;
        const dy = Math.sin(rad) * r;
        return <line key={deg} x1={c.x - dx} y1={c.y - dy} x2={c.x + dx} y2={c.y + dy} stroke="#000" strokeWidth={0.8} strokeLinecap="round" />;
      });
      return <g key={m.id}>{rays}</g>;
    }
    if (m.tool === "smudge") {
      const [c] = pts;
      return <circle key={m.id} cx={c.x} cy={c.y} r={3} fill="none" stroke="#000" strokeWidth={0.7} strokeDasharray="1.4 1.4" />;
    }
    if ((m.tool === "pen" || m.tool === "pen-thin") && pts.length >= 2) {
      return (
        <polyline
          key={m.id}
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#000"
          strokeWidth={m.tool === "pen-thin" ? 0.35 : 0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    return null;
  };

  const draftPreview = (() => {
    if (!draft) return null;
    if (tool === "scratch" && draft.length >= 1) {
      const a = { x: draft[0].x * 100, y: draft[0].y * 100 };
      const b = { x: (draft[1] ?? draft[0]).x * 100, y: (draft[1] ?? draft[0]).y * 100 };
      return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#000" strokeWidth={0.9} strokeDasharray="1.5 1" strokeLinecap="round" />;
    }
    if ((tool === "pen" || tool === "pen-thin") && draft.length >= 2) {
      return (
        <polyline
          points={draft.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}
          fill="none"
          stroke="#000"
          strokeWidth={tool === "pen-thin" ? 0.35 : 0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    return null;
  })();

  const effectiveDims = isPrinting
    ? (dims ? scaleToPrint(dims) : (PRINT_SIZE_DIMS[`${shape}-${size}`] ?? PRINT_SIZE_DIMS[`${shape}-md`]))
    : dims;
  const sizeClass = effectiveDims ? "" : (SIZE_CLASSES[`${shape}-${size}`] ?? SIZE_CLASSES[`${shape}-md`]);
  const roundedClass = effectiveDims ? (shape === "circle" ? "rounded-full" : "rounded-md") : "";
  const chromeClass = frameless ? "" : `border-[2.5px] border-black bg-white ${roundedClass}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative touch-none overflow-hidden overscroll-contain ${chromeClass} ${sizeClass}`}
        style={{
          touchAction: "none",
          ...(effectiveDims ? { width: effectiveDims.width, height: effectiveDims.height } : undefined),
          ...(shade ? { backgroundColor: "#e5e5e5" } : undefined),
          ...(gradient ? { backgroundImage: gradientCss(gradient, gradientFlip) } : undefined),
        }}
      >
        {backgroundSrc && (
          // eslint-disable-next-line @next/next/no-img-element -- traced reference art, not an optimizable content image
          <img
            src={backgroundSrc}
            alt=""
            draggable={false}
            className={`pointer-events-none absolute inset-0 h-full w-full select-none object-contain ${imgMirror ? "-scale-x-100" : ""}`}
          />
        )}
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {dividerLine && <line x1={50} y1={4} x2={50} y2={96} stroke="#000" strokeWidth={2.4} />}
          {value.marks.map(renderMark)}
          {draftPreview}
        </svg>
        {value.marks.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            title="Vider ce schéma"
            className="no-print absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-[10px] font-bold shadow-comic-sm hover:bg-black hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      {label && <span className="text-[10px] font-bold uppercase tracking-wide text-black/60 print:text-[6px]">{label}</span>}
    </div>
  );
}
