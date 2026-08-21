"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "./i18n";
import { deleteProject, listProjects, loadCurrent, newProjectId, saveCurrent, upsertProject } from "./storage";
import { ConditionProject, emptyHeader, normalizeHeader, ReportHeader, ReportKind } from "./types";

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

interface Snapshot<T> {
  header: ReportHeader;
  items: T[];
}

interface History<T> {
  past: Snapshot<T>[];
  future: Snapshot<T>[];
  /** snapshot captured just before the in-progress debounced burst (typing, drawing — including the signature) started */
  pending: Snapshot<T> | null;
}

export function useReportSession<T>(kind: ReportKind) {
  const { t } = useLocale();
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
      ? { projectId: current.id, title: current.name, header: normalizeHeader(current.header), items: current.items }
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

  // shared by setHeader/setItems: structural changes (add/remove/duplicate/paste,
  // which change the item count) get their own undo step immediately; in-place
  // edits (typing, drawing — including the signature) coalesce into one step
  // after a short pause so undo doesn't have to be pressed once per keystroke/stroke
  const commit = useCallback((nextHeader: ReportHeader, nextItems: T[], structural: boolean) => {
    const prev: Snapshot<T> = { header: latest.current.header, items: latest.current.items };
    latest.current = { header: nextHeader, items: nextItems };
    setSession((s) => ({ ...s, header: nextHeader, items: nextItems }));

    if (structural) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const h = history.current;
      const withPending = h.pending ? [...h.past, h.pending] : h.past;
      history.current = { past: [...withPending, prev].slice(-HISTORY_LIMIT), future: [], pending: null };
      setCanUndo(true);
      setCanRedo(false);
    } else {
      const h = history.current;
      if (!h.pending) {
        history.current = { ...h, pending: prev };
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

  const setHeader = useCallback(
    (header: ReportHeader) => commit(header, latest.current.items, false),
    [commit]
  );

  const setItems = useCallback(
    (items: T[]) => commit(latest.current.header, items, items.length !== latest.current.items.length),
    [commit]
  );

  const undo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    let h = history.current;
    if (h.pending) h = { past: [...h.past, h.pending], future: h.future, pending: null };
    if (h.past.length === 0) return;
    const prevSnapshot = h.past[h.past.length - 1];
    const currentSnapshot: Snapshot<T> = { header: latest.current.header, items: latest.current.items };
    const nextHistory = {
      past: h.past.slice(0, -1),
      future: [currentSnapshot, ...h.future].slice(0, HISTORY_LIMIT),
      pending: null,
    };
    history.current = nextHistory;
    latest.current = prevSnapshot;
    setSession((s) => ({ ...s, header: prevSnapshot.header, items: prevSnapshot.items }));
    setCanUndo(nextHistory.past.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const h = history.current;
    if (h.future.length === 0) return;
    const nextSnapshot = h.future[0];
    const currentSnapshot: Snapshot<T> = { header: latest.current.header, items: latest.current.items };
    const nextHistory = {
      past: [...h.past, currentSnapshot].slice(-HISTORY_LIMIT),
      future: h.future.slice(1),
      pending: null,
    };
    history.current = nextHistory;
    latest.current = nextSnapshot;
    setSession((s) => ({ ...s, header: nextSnapshot.header, items: nextSnapshot.items }));
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

  // skipConfirm lets a caller that already confirmed something more specific (e.g. leaving a
  // shared session) go straight to clearing, instead of also showing the generic unsaved-changes prompt
  const createNew = useCallback(
    (skipConfirm = false) => {
      if (!skipConfirm && latest.current.items.length > 0 && !window.confirm(t("confirm.newReport"))) {
        return;
      }
      const header = emptyHeader();
      latest.current = { header, items: [] };
      resetHistory();
      setSession({ loaded: true, projectId: newProjectId(), title: BLANK_TITLE, header, items: [] });
    },
    [t]
  );

  const open = useCallback(
    (id: string) => {
      const project = listProjects<T>(kind).find((p) => p.id === id);
      if (!project) return;
      const header = normalizeHeader(project.header);
      latest.current = { header, items: project.items };
      resetHistory();
      setSession({ loaded: true, projectId: project.id, title: project.name, header, items: project.items });
      saveCurrent(kind, project);
    },
    [kind]
  );

  // loads a project parsed from an imported .json file (from disk, not localStorage) — behaves
  // like open() but also registers it into the saved-projects list so it shows up in "Ouvrir" afterwards
  const importProject = useCallback(
    (project: ConditionProject<T>) => {
      const header = normalizeHeader(project.header);
      const imported: ConditionProject<T> = {
        ...project,
        id: project.id || newProjectId(),
        header,
        updatedAt: Date.now(),
      };
      latest.current = { header, items: imported.items };
      resetHistory();
      setSession({ loaded: true, projectId: imported.id, title: imported.name || BLANK_TITLE, header, items: imported.items });
      saveCurrent(kind, imported);
      upsertProject(kind, imported);
      setProjects(listProjects<T>(kind));
    },
    [kind]
  );

  const remove = useCallback(
    (id: string) => {
      if (!window.confirm(t("confirm.deleteReport"))) return false;
      deleteProject(kind, id);
      setProjects(listProjects<T>(kind));
      return true;
    },
    [kind, t]
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

  return {
    session,
    projects,
    setTitle,
    setHeader,
    setItems,
    save,
    createNew,
    open,
    importProject,
    remove,
    exportJson,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
