"use client";

import { useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { SyncStatus } from "@/lib/useSharedSession";

const STATUS_LABEL: Record<SyncStatus, string> = {
  offline: "Hors ligne",
  connecting: "Synchronisation…",
  synced: "Synchronisé",
  error: "Erreur de synchro",
};

const STATUS_DOT: Record<SyncStatus, string> = {
  offline: "bg-black/30",
  connecting: "bg-amber-500 animate-pulse",
  synced: "bg-green-600",
  error: "bg-red-600",
};

/** inline content only (no outer bar) — meant to sit inside the toolbar's scrollable row */
export function SharedSessionBar({
  sessionName,
  status,
  error,
  onJoin,
  onLeave,
}: {
  sessionName: string | null;
  status: SyncStatus;
  error: string | null;
  onJoin: (name: string) => void;
  onLeave: () => void;
}) {
  const [draft, setDraft] = useState("");

  if (sessionName) {
    return (
      <>
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} title={STATUS_LABEL[status]} />
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide">
          <span className="font-mono normal-case">{sessionName}</span>
        </span>
        {error && <span className="shrink-0 text-[10px] font-semibold text-red-600">{error}</span>}
        <ComicButton onClick={onLeave} className="shrink-0">
          Quitter la session
        </ComicButton>
      </>
    );
  }

  return (
    <form
      className="flex shrink-0 items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = draft.trim();
        if (v) onJoin(v);
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Session partagée (ex. tournage-toto)"
        className="min-w-0 max-w-[11rem] shrink-0 rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-black"
      />
      <ComicButton type="submit" className="shrink-0">
        Rejoindre / Créer
      </ComicButton>
      {error && <span className="shrink-0 text-[10px] font-semibold text-red-600">{error}</span>}
    </form>
  );
}
