"use client";

import { useCallback, useEffect, useState } from "react";
import { CameraReportView } from "@/components/CameraReportView";
import { FilterReportView } from "@/components/FilterReportView";
import { MonitoringReportView } from "@/components/MonitoringReportView";
import { OpticalReportView } from "@/components/OpticalReportView";
import { ReportTabs } from "@/components/ReportTabs";
import { SharedSessionBar } from "@/components/SharedSessionBar";
import { Toolbar } from "@/components/Toolbar";
import { UndoRedoDock } from "@/components/UndoRedoDock";
import { TranslationKey, useLocale } from "@/lib/i18n";
import { useReportSession } from "@/lib/useReportSession";
import { useSharedSession } from "@/lib/useSharedSession";
import { CameraItem, ConditionProject, FilterItem, MonitoringItem, OpticalEntry, ReportKind } from "@/lib/types";

export default function Home() {
  const { t } = useLocale();
  const [activeKind, setActiveKind] = useState<ReportKind>("optical");
  const [toastKey, setToastKey] = useState<TranslationKey | null>(null);

  const optical = useReportSession<OpticalEntry>("optical");
  const filter = useReportSession<FilterItem>("filter");
  const monitoring = useReportSession<MonitoringItem>("monitoring");
  const camera = useReportSession<CameraItem>("camera");
  const shared = useSharedSession(optical, filter, monitoring, camera);

  useEffect(() => {
    if (!toastKey) return;
    const t = setTimeout(() => setToastKey(null), 1800);
    return () => clearTimeout(t);
  }, [toastKey]);

  const active =
    activeKind === "optical" ? optical : activeKind === "filter" ? filter : activeKind === "monitoring" ? monitoring : camera;

  const handleSave = useCallback(() => {
    active.save();
    setToastKey("toast.saved");
  }, [active]);

  const handleDelete = useCallback(
    (id: string) => {
      if (active.remove(id)) setToastKey("toast.deleted");
    },
    [active]
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const project = JSON.parse(text) as ConditionProject<unknown>;
        switch (project.kind) {
          case "optical":
            optical.importProject(project as ConditionProject<OpticalEntry>);
            break;
          case "filter":
            filter.importProject(project as ConditionProject<FilterItem>);
            break;
          case "monitoring":
            monitoring.importProject(project as ConditionProject<MonitoringItem>);
            break;
          case "camera":
            camera.importProject(project as ConditionProject<CameraItem>);
            break;
          default:
            setToastKey("toast.importInvalid");
            return;
        }
        setActiveKind(project.kind);
        setToastKey("toast.imported");
      } catch {
        setToastKey("toast.importInvalid");
      }
    },
    [optical, filter, monitoring, camera]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) active.redo();
      else active.undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  if (!optical.session.loaded || !filter.session.loaded || !monitoring.session.loaded || !camera.session.loaded) return null;

  return (
    <div className="flex h-screen flex-col bg-white">
      <Toolbar
        title={active.session.title}
        onTitleChange={active.setTitle}
        onNew={active.createNew}
        onSave={handleSave}
        onExportJson={active.exportJson}
        onPrint={() => window.print()}
        onImportFile={handleImportFile}
        projects={active.projects}
        onOpenProject={active.open}
        onDeleteProject={handleDelete}
      />
      <ReportTabs
        active={activeKind}
        onChange={setActiveKind}
        sessionBar={
          <SharedSessionBar
            sessionName={shared.sessionName}
            sessionCode={shared.sessionCode}
            status={shared.status}
            error={shared.error}
            onJoin={shared.join}
            onLeave={shared.leave}
          />
        }
      />
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        {activeKind === "optical" && (
          <OpticalReportView
            header={optical.session.header}
            onHeaderChange={optical.setHeader}
            items={optical.session.items}
            onItemsChange={optical.setItems}
          />
        )}
        {activeKind === "filter" && (
          <FilterReportView
            header={filter.session.header}
            onHeaderChange={filter.setHeader}
            items={filter.session.items}
            onItemsChange={filter.setItems}
          />
        )}
        {activeKind === "monitoring" && (
          <MonitoringReportView
            header={monitoring.session.header}
            onHeaderChange={monitoring.setHeader}
            items={monitoring.session.items}
            onItemsChange={monitoring.setItems}
          />
        )}
        {activeKind === "camera" && (
          <CameraReportView
            header={camera.session.header}
            onHeaderChange={camera.setHeader}
            items={camera.session.items}
            onItemsChange={camera.setItems}
          />
        )}
      </main>
      <div className="no-print fixed bottom-5 right-5 z-30 flex items-center gap-3">
        <UndoRedoDock canUndo={active.canUndo} canRedo={active.canRedo} onUndo={active.undo} onRedo={active.redo} />
      </div>
      {toastKey && (
        <div className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border-[2.5px] border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-comic">
          {t(toastKey)}
        </div>
      )}
    </div>
  );
}
