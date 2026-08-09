import { ConditionProject, ReportKind, newId } from "./types";

const NS = "aynil-condition";

function currentKey(kind: ReportKind) {
  return `${NS}:${kind}:current`;
}
function projectsKey(kind: ReportKind) {
  return `${NS}:${kind}:projects`;
}

export function loadCurrent<T>(kind: ReportKind): ConditionProject<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(currentKey(kind));
    return raw ? (JSON.parse(raw) as ConditionProject<T>) : null;
  } catch {
    return null;
  }
}

export function saveCurrent<T>(kind: ReportKind, project: ConditionProject<T>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(currentKey(kind), JSON.stringify(project));
}

export function listProjects<T>(kind: ReportKind): ConditionProject<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(projectsKey(kind));
    return raw ? (JSON.parse(raw) as ConditionProject<T>[]) : [];
  } catch {
    return [];
  }
}

export function upsertProject<T>(kind: ReportKind, project: ConditionProject<T>) {
  const projects = listProjects<T>(kind).filter((p) => p.id !== project.id);
  projects.unshift(project);
  window.localStorage.setItem(projectsKey(kind), JSON.stringify(projects.slice(0, 30)));
}

export function deleteProject(kind: ReportKind, id: string) {
  const projects = listProjects(kind).filter((p) => p.id !== id);
  window.localStorage.setItem(projectsKey(kind), JSON.stringify(projects));
}

export function newProjectId(): string {
  return newId("cnd");
}
