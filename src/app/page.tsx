"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterReportView } from "@/components/FilterReportView";
import { MonitoringReportView } from "@/components/MonitoringReportView";
import { OpticalReportView } from "@/components/OpticalReportView";
import { ReportTabs } from "@/components/ReportTabs";
import { Toolbar } from "@/components/Toolbar";
import { useReportSession } from "@/lib/useReportSession";
import { FilterItem, MonitoringItem, OpticalItem, ReportKind } from "@/lib/types";

export default function Home() {
  const [activeKind, setActiveKind] = useState<ReportKind>("optical");
  const [toast, setToast] = useState<string | null>(null);

  const optical = useReportSession<OpticalItem>("optical");
  const filter = useReportSession<FilterItem>("filter");
  const monitoring = useReportSession<MonitoringItem>("monitoring");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const active = activeKind === "optical" ? optical : activeKind === "filter" ? filter : monitoring;

  const handleSave = useCallback(() => {
    active.save();
    setToast("Rapport sauvegardé");
  }, [active]);

  const handleDelete = useCallback(
    (id: string) => {
      if (active.remove(id)) setToast("Rapport supprimé");
    },
    [active]
  );

  const handleImport = useCallback(
    (file: File) => {
      active.importJson(file);
      setToast("Rapport importé");
    },
    [active]
  );

  if (!optical.session.loaded || !filter.session.loaded || !monitoring.session.loaded) return null;

  return (
    <div className="flex h-screen flex-col bg-white">
      <Toolbar
        title={active.session.title}
        onTitleChange={active.setTitle}
        onNew={active.createNew}
        onSave={handleSave}
        onExportJson={active.exportJson}
        onImportJson={handleImport}
        onPrint={() => window.print()}
        projects={active.projects}
        onOpenProject={active.open}
        onDeleteProject={handleDelete}
      />
      <ReportTabs active={activeKind} onChange={setActiveKind} />
      <main className="min-h-0 flex-1 overflow-y-auto">
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
      </main>
      {toast && (
        <div className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border-[2.5px] border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-comic">
          {toast}
        </div>
      )}
    </div>
  );
}
