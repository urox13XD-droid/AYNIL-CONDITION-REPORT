"use client";

import { useEffect, useRef, useState } from "react";

interface Identified {
  id: string;
}

/** shared multi-select + copy/duplicate/paste behaviour for a report's item grid, with Ctrl/Cmd+C, +V, +D shortcuts */
export function useItemSelection<T extends Identified>(
  items: T[],
  onItemsChange: (items: T[]) => void,
  cloneEntry: (entry: T) => T
) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clipboardRef = useRef<T[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const duplicateIds = (ids: string[]) => {
    const source = items.filter((it) => ids.includes(it.id));
    if (source.length === 0) return;
    const clones = source.map(cloneEntry);
    onItemsChange([...items, ...clones]);
    setSelected(new Set(clones.map((c) => c.id)));
  };

  const copyIds = (ids: string[]) => {
    const source = items.filter((it) => ids.includes(it.id));
    if (source.length > 0) clipboardRef.current = source;
  };

  const paste = () => {
    if (clipboardRef.current.length === 0) return;
    const clones = clipboardRef.current.map(cloneEntry);
    onItemsChange([...items, ...clones]);
    setSelected(new Set(clones.map((c) => c.id)));
  };

  const removeIds = (ids: string[]) => {
    onItemsChange(items.filter((it) => !ids.includes(it.id)));
    clearSelection();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const ids = [...selected];
      if (e.key === "c" || e.key === "C") {
        if (ids.length > 0) copyIds(ids);
      } else if (e.key === "v" || e.key === "V") {
        if (clipboardRef.current.length > 0) {
          e.preventDefault();
          paste();
        }
      } else if (e.key === "d" || e.key === "D") {
        if (ids.length > 0) {
          e.preventDefault();
          duplicateIds(ids);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribes with fresh closures whenever items/selected change
  }, [items, selected]);

  return { selected, toggle, clearSelection, duplicateIds, copyIds, paste, removeIds };
}
