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

  useEffect(() => {
    const current = loadCurrent<T>(kind);
    const initial = current
      ? { projectId: current.id, title: current.name, header: current.header, items: current.items }
      : { projectId: newProjectId(), title: BLANK_TITLE, header: emptyHeader(), items: [] as T[] };
    latest.current = { header: initial.header, items: initial.items };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount
    setSession({ loaded: true, ...initial });
    setProjects(listProjects<T>(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTitle = useCallback((title: string) => setSession((s) => ({ ...s, title })), []);

  const setHeader = useCallback((header: ReportHeader) => {
    latest.current.header = header;
    setSession((s) => ({ ...s, header }));
  }, []);

  const setItems = useCallback((items: T[]) => {
    latest.current.items = items;
    setSession((s) => ({ ...s, items }));
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
    setSession({ loaded: true, projectId: newProjectId(), title: BLANK_TITLE, header, items: [] });
  }, []);

  const open = useCallback(
    (id: string) => {
      const project = listProjects<T>(kind).find((p) => p.id === id);
      if (!project) return;
      latest.current = { header: project.header, items: project.items };
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

  return { session, projects, setTitle, setHeader, setItems, save, createNew, open, remove, exportJson, importJson };
}
