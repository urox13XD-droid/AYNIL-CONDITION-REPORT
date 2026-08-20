"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ComicButton } from "@/components/ComicButton";

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
  projects,
  onOpenProject,
  onDeleteProject,
  sessionBar,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  onNew: () => void;
  onSave: () => void;
  onExportJson: () => void;
  onPrint: () => void;
  projects: ToolbarProject[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  /** shared-session status/join content, rendered inline at the end of the button row to save a line */
  sessionBar?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

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
        placeholder="Nom du rapport…"
      />

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
        <div className="relative shrink-0">
          <ComicButton onClick={() => setMenuOpen((v) => !v)} title="Rapports enregistrés" className="shrink-0">
            Ouvrir
          </ComicButton>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white shadow-comic-lg">
              <div className="max-h-72 overflow-y-auto">
                {projects.length === 0 && (
                  <p className="p-3 text-xs font-semibold text-black/50">Aucun rapport enregistré.</p>
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
                      title="Supprimer"
                      onClick={() => onDeleteProject(p.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ComicButton onClick={onNew} className="shrink-0">
          Nouveau
        </ComicButton>

        <ComicButton onClick={onExportJson} className="shrink-0">
          Export JSON
        </ComicButton>
        <ComicButton onClick={onPrint} className="shrink-0">
          Imprimer
        </ComicButton>
        <ComicButton onClick={onPrint} className="shrink-0">
          Export PDF
        </ComicButton>
        <ComicButton onClick={onSave} variant="solid" className="shrink-0">
          Sauvegarder
        </ComicButton>
        {sessionBar && (
          <>
            <div className="mx-1 h-6 w-[1.5px] shrink-0 bg-black/10" />
            {sessionBar}
          </>
        )}
      </div>
    </header>
  );
}
