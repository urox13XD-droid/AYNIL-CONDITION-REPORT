"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteProject, listProjects, loadCurrent, newProjectId, saveCurrent, upsertProject } from "./storage";
import { ConditionProject, emptyHeader, ReportHeader, ReportKind } from "./types";

interface Session<T> {
  loaded: boolean;
  projectId: string;
  title: string;
  header: ReportHeader;
  items: T[];
}

const BLANK_TITLE = "Nouveau rapport";
const HISTORY_DEBOUNCE_MS = 600;
const HISTORY_LIMIT = 50;

interface History<T> {
  past: T[][];
  future: T[][];
  /** items snapshot captured just before the in-progress debounced burst (typing, drawing) started */
  pending: T[] | null;
}

export function useReportSession<T>(kind: ReportKind) {
  const [session, setSession] = useState<Session<T>>({
    loaded: false,
    projectId: "",
    title: BLANK_TITLE,
    header: emptyHeader(),
    items: [],
  });
  const [projects, setProjects] = useState<ConditionProject<T>[]>([]);

  // latest in-editor header/items, read only from event handlers (save/export), never during render
  const latest = useRef<{ header: ReportHeader; items: T[] }>({ header: emptyHeader(), items: [] });

  const history = useRef<History<T>>({ past: [], future: [], pending: null });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // mirrors history.current's shape for button enablement — history itself stays a ref
  // (mutated from event handlers/timeouts only) since reading a ref during render is disallowed
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const resetHistory = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    history.current = { past: [], future: [], pending: null };
    setCanUndo(false);
    setCanRedo(false);
  };

  useEffect(() => {
    const current = loadCurrent<T>(kind);
    const initial = current
      ? { projectId: current.id, title: current.name, header: current.header, items: current.items }
      : { projectId: newProjectId(), title: BLANK_TITLE, header: emptyHeader(), items: [] as T[] };
    latest.current = { header: initial.header, items: initial.items };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount
    resetHistory();
    setSession({ loaded: true, ...initial });
    setProjects(listProjects<T>(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => resetHistory(), []);

  const setTitle = useCallback((title: string) => setSession((s) => ({ ...s, title })), []);

  const setHeader = useCallback((header: ReportHeader) => {
    latest.current.header = header;
    setSession((s) => ({ ...s, header }));
  }, []);

  const setItems = useCallback((items: T[]) => {
    const prevItems = latest.current.items;
    // add/remove/duplicate/paste change the item count and get their own undo step
    // immediately; in-place edits (typing, drawing) coalesce into one step after a
    // short pause so undo doesn't have to be pressed once per keystroke
    const structural = items.length !== prevItems.length;
    latest.current.items = items;
    setSession((s) => ({ ...s, items }));

    if (structural) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const h = history.current;
      const withPending = h.pending ? [...h.past, h.pending] : h.past;
      history.current = { past: [...withPending, prevItems].slice(-HISTORY_LIMIT), future: [], pending: null };
      setCanUndo(true);
      setCanRedo(false);
    } else {
      const h = history.current;
      if (!h.pending) {
        history.current = { ...h, pending: prevItems };
        setCanUndo(true);
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const cur = history.current;
        if (cur.pending) {
          history.current = { past: [...cur.past, cur.pending].slice(-HISTORY_LIMIT), future: [], pending: null };
          setCanUndo(true);
          setCanRedo(false);
        }
        debounceRef.current = null;
      }, HISTORY_DEBOUNCE_MS);
    }
  }, []);

  const undo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    let h = history.current;
    if (h.pending) h = { past: [...h.past, h.pending], future: h.future, pending: null };
    if (h.past.length === 0) return;
    const prevSnapshot = h.past[h.past.length - 1];
    const nextHistory = {
      past: h.past.slice(0, -1),
      future: [latest.current.items, ...h.future].slice(0, HISTORY_LIMIT),
      pending: null,
    };
    history.current = nextHistory;
    latest.current.items = prevSnapshot;
    setSession((s) => ({ ...s, items: prevSnapshot }));
    setCanUndo(nextHistory.past.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const h = history.current;
    if (h.future.length === 0) return;
    const nextSnapshot = h.future[0];
    const nextHistory = {
      past: [...h.past, latest.current.items].slice(-HISTORY_LIMIT),
      future: h.future.slice(1),
      pending: null,
    };
    history.current = nextHistory;
    latest.current.items = nextSnapshot;
    setSession((s) => ({ ...s, items: nextSnapshot }));
    setCanUndo(true);
    setCanRedo(nextHistory.future.length > 0);
  }, []);

  const buildProject = useCallback(
    (id: string, name: string): ConditionProject<T> => ({
      id,
      kind,
      name,
      header: latest.current.header,
      items: latest.current.items,
      updatedAt: Date.now(),
    }),
    [kind]
  );

  const save = useCallback(() => {
    const project = buildProject(session.projectId, session.title);
    saveCurrent(kind, project);
    upsertProject(kind, project);
    setProjects(listProjects<T>(kind));
  }, [buildProject, kind, session.projectId, session.title]);

  const createNew = useCallback(() => {
    if (
      latest.current.items.length > 0 &&
      !window.confirm("Créer un nouveau rapport ? Les modifications non sauvegardées seront perdues.")
    ) {
      return;
    }
    const header = emptyHeader();
    latest.current = { header, items: [] };
    resetHistory();
    setSession({ loaded: true, projectId: newProjectId(), title: BLANK_TITLE, header, items: [] });
  }, []);

  const open = useCallback(
    (id: string) => {
      const project = listProjects<T>(kind).find((p) => p.id === id);
      if (!project) return;
      latest.current = { header: project.header, items: project.items };
      resetHistory();
      setSession({ loaded: true, projectId: project.id, title: project.name, header: project.header, items: project.items });
      saveCurrent(kind, project);
    },
    [kind]
  );

  const remove = useCallback(
    (id: string) => {
      if (!window.confirm("Supprimer ce rapport enregistré ?")) return false;
      deleteProject(kind, id);
      setProjects(listProjects<T>(kind));
      return true;
    },
    [kind]
  );

  const exportJson = useCallback(() => {
    const project = buildProject(session.projectId, session.title);
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.trim().replace(/\s+/g, "_") || kind}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildProject, kind, session.projectId, session.title]);

  const importJson = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const project = JSON.parse(String(reader.result)) as ConditionProject<T>;
          if (!Array.isArray(project.items)) throw new Error("invalid");
          const header = project.header ?? emptyHeader();
          latest.current = { header, items: project.items };
          resetHistory();
          setSession({
            loaded: true,
            projectId: project.id || newProjectId(),
            title: project.name || "Rapport importé",
            header,
            items: project.items,
          });
        } catch {
          window.alert("Fichier invalide.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  return {
    session,
    projects,
    setTitle,
    setHeader,
    setItems,
    save,
    createNew,
    open,
    remove,
    exportJson,
    importJson,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
