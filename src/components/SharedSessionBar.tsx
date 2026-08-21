"use client";

import { useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { TranslationKey, useLocale } from "@/lib/i18n";
import { SyncStatus } from "@/lib/useSharedSession";

const STATUS_LABEL_KEY: Record<SyncStatus, TranslationKey> = {
  offline: "session.offline",
  connecting: "session.connecting",
  synced: "session.synced",
  error: "session.error",
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
  sessionCode,
  status,
  error,
  onJoin,
  onLeave,
}: {
  sessionName: string | null;
  sessionCode: string | null;
  status: SyncStatus;
  error: string | null;
  onJoin: (name: string, code: string) => void;
  onLeave: () => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState("");
  const [codeDraft, setCodeDraft] = useState("");

  if (sessionName) {
    return (
      <>
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} title={t(STATUS_LABEL_KEY[status])} />
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide">
          <span className="font-mono normal-case">{sessionName}</span>
          {sessionCode && <span className="ml-1 rounded bg-black px-1.5 py-0.5 font-mono text-white">{sessionCode}</span>}
        </span>
        {error && <span className="shrink-0 text-[10px] font-semibold text-red-600">{error}</span>}
        <ComicButton onClick={onLeave} className="shrink-0">
          {t("session.leave")}
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
        if (v) onJoin(v, codeDraft.trim());
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t("session.namePlaceholder")}
        className="min-w-0 max-w-[11rem] shrink-0 rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-black"
      />
      <input
        value={codeDraft}
        onChange={(e) => setCodeDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder={t("session.codePlaceholder")}
        inputMode="numeric"
        title={t("session.codeTitle")}
        className="w-14 shrink-0 rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-center text-xs font-semibold outline-none focus:border-black"
      />
      <ComicButton type="submit" className="shrink-0">
        {t("session.joinCreate")}
      </ComicButton>
      {error && <span className="shrink-0 text-[10px] font-semibold text-red-600">{error}</span>}
    </form>
  );
}
