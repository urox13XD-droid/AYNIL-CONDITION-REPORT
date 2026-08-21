"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ComicButton } from "@/components/ComicButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/lib/i18n";

export interface ToolbarProject {
  id: string;
  name: string;
}

export function Toolbar({
  title,
  onTitleChange,
  onNew,
  onSave,
  onExportJson,
  onPrint,
  onImportFile,
  projects,
  onOpenProject,
  onDeleteProject,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  onNew: () => void;
  onSave: () => void;
  onExportJson: () => void;
  onPrint: () => void;
  onImportFile: (file: File) => void;
  projects: ToolbarProject[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <header className="no-print flex flex-col gap-2 border-b-[3px] border-black bg-white px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <Logo subtitle="CONDITION REPORT" />
        <div className="mx-1 hidden h-10 w-[2.5px] shrink-0 bg-black/10 sm:block" />
      </div>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="font-display min-w-0 rounded-lg border-[2px] border-black bg-white px-3 py-1.5 text-sm font-bold outline-none focus:shadow-comic-sm sm:flex-1"
        placeholder={t("toolbar.titlePlaceholder")}
      />

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
        <div ref={menuRef} className="relative shrink-0">
          <ComicButton onClick={() => setMenuOpen((v) => !v)} title={t("toolbar.reportsMenuTitle")} className="shrink-0">
            {t("toolbar.open")}
          </ComicButton>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white shadow-comic-lg">
              <button
                className="block w-full border-b border-black/10 px-3 py-2 text-left text-xs font-bold hover:bg-black hover:text-white"
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenuOpen(false);
                }}
              >
                {t("toolbar.importFile")}
              </button>
              <div className="max-h-72 overflow-y-auto">
                {projects.length === 0 && (
                  <p className="p-3 text-xs font-semibold text-black/50">{t("toolbar.noSavedReports")}</p>
                )}
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2 text-xs last:border-b-0 hover:bg-black hover:text-white"
                  >
                    <button
                      className="min-w-0 flex-1 truncate text-left font-bold"
                      onClick={() => {
                        onOpenProject(p.id);
                        setMenuOpen(false);
                      }}
                    >
                      {p.name}
                    </button>
                    <button
                      className="shrink-0 font-bold opacity-60 hover:opacity-100"
                      title={t("toolbar.delete")}
                      onClick={() => onDeleteProject(p.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <ComicButton onClick={onNew} className="shrink-0">
          {t("toolbar.new")}
        </ComicButton>

        <ComicButton onClick={onExportJson} className="shrink-0">
          {t("toolbar.exportProject")}
        </ComicButton>
        <ComicButton onClick={onPrint} className="shrink-0">
          {t("toolbar.print")}
        </ComicButton>
        <ComicButton onClick={onPrint} className="shrink-0">
          {t("toolbar.exportPdf")}
        </ComicButton>
        <ComicButton onClick={onSave} variant="solid" className="shrink-0">
          {t("toolbar.save")}
        </ComicButton>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
