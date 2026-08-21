"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { CameraItem, FilterItem, MonitoringItem, normalizeHeader, OpticalEntry, ReportHeader } from "./types";

interface KindSlot<T> {
  session: { header: ReportHeader; items: T[] };
  setHeader: (h: ReportHeader) => void;
  setItems: (items: T[]) => void;
}

interface ReportSlice<T> {
  header: ReportHeader;
  items: T[];
}

interface SharedPayload {
  optical: ReportSlice<OpticalEntry>;
  filter: ReportSlice<FilterItem>;
  monitoring: ReportSlice<MonitoringItem>;
  /** optional — absent on sessions created before the camera report existed */
  camera?: ReportSlice<CameraItem>;
}

export type SyncStatus = "offline" | "connecting" | "synced" | "error";

const PUSH_DEBOUNCE_MS = 700;
const CODE_CREATE_ATTEMPTS = 6;
const POSTGRES_UNIQUE_VIOLATION = "23505";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomCode(): string {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}

export function useSharedSession(
  optical: KindSlot<OpticalEntry>,
  filter: KindSlot<FilterItem>,
  monitoring: KindSlot<MonitoringItem>,
  camera: KindSlot<CameraItem>
) {
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [error, setError] = useState<string | null>(null);

  const lastSyncedJson = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // the actual Supabase row id in use — distinct from the displayed name/code
  // because a legacy (pre-code) session is joined by its bare slug
  const rowIdRef = useRef<string | null>(null);
  // true from the moment a local edit differs from the server until our push
  // for it lands — an incoming realtime update during that window is either
  // our own stale echo or a genuine conflict, and applying it would clobber
  // the edit that's still in flight (e.g. a just-picked device art
  // flickering back out), so it's deferred until our own push completes
  const pendingLocalPush = useRef(false);

  const buildPayload = useCallback(
    (): SharedPayload => ({
      optical: { header: optical.session.header, items: optical.session.items },
      filter: { header: filter.session.header, items: filter.session.items },
      monitoring: { header: monitoring.session.header, items: monitoring.session.items },
      camera: { header: camera.session.header, items: camera.session.items },
    }),
    [optical, filter, monitoring, camera]
  );

  const applyRemote = useCallback(
    (payload: SharedPayload) => {
      optical.setHeader(normalizeHeader(payload.optical.header));
      optical.setItems(payload.optical.items);
      filter.setHeader(normalizeHeader(payload.filter.header));
      filter.setItems(payload.filter.items);
      monitoring.setHeader(normalizeHeader(payload.monitoring.header));
      monitoring.setItems(payload.monitoring.items);
      if (payload.camera) {
        camera.setHeader(normalizeHeader(payload.camera.header));
        camera.setItems(payload.camera.items);
      }
    },
    [optical, filter, monitoring, camera]
  );

  const leave = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    lastSyncedJson.current = null;
    pendingLocalPush.current = false;
    rowIdRef.current = null;
    setSessionName(null);
    setSessionCode(null);
    setStatus("offline");
    setError(null);
  }, []);

  const subscribeTo = useCallback(
    (rowId: string) => {
      const channel = supabase!
        .channel(`condition_session_${rowId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "condition_sessions", filter: `id=eq.${rowId}` },
          (change) => {
            const incoming = (change.new as { data: SharedPayload }).data;
            const json = JSON.stringify(incoming);
            if (json === lastSyncedJson.current) return; // our own write echoed back
            if (pendingLocalPush.current) return; // a local edit is still in flight — don't clobber it, our own push will supersede this shortly
            lastSyncedJson.current = json;
            applyRemote(incoming);
          }
        )
        .subscribe();
      channelRef.current = channel;
    },
    [applyRemote]
  );

  const join = useCallback(
    async (rawName: string, rawCode: string) => {
      if (!supabase) {
        setError("Le partage n'est pas configuré sur ce déploiement.");
        setStatus("error");
        return;
      }
      const baseId = slugify(rawName);
      if (!baseId) return;

      const trimmedCode = rawCode.trim();
      const hasCode = /^\d{1,3}$/.test(trimmedCode);
      const normalizedCode = hasCode ? trimmedCode.padStart(3, "0") : null;

      setStatus("connecting");
      setError(null);

      try {
        let rowId: string;
        let code: string | null;
        let payload: SharedPayload;

        if (normalizedCode) {
          // a code was typed: join the exact name+code session, or create it if it doesn't exist yet
          const codedId = `${baseId}-${normalizedCode}`;
          const { data: existing, error: fetchError } = await supabase
            .from("condition_sessions")
            .select("data")
            .eq("id", codedId)
            .maybeSingle();
          if (fetchError) throw new Error(fetchError.message);

          if (existing) {
            rowId = codedId;
            code = normalizedCode;
            payload = existing.data as SharedPayload;
          } else {
            payload = buildPayload();
            const { error: insertError } = await supabase.from("condition_sessions").insert({ id: codedId, data: payload });
            if (insertError) throw new Error(insertError.message);
            rowId = codedId;
            code = normalizedCode;
          }
        } else {
          // no code typed: fall back to a legacy (pre-code) session of that name if one exists,
          // otherwise create a brand-new session with a freshly generated random code
          const { data: legacy, error: legacyError } = await supabase
            .from("condition_sessions")
            .select("data")
            .eq("id", baseId)
            .maybeSingle();
          if (legacyError) throw new Error(legacyError.message);

          if (legacy) {
            rowId = baseId;
            code = null;
            payload = legacy.data as SharedPayload;
          } else {
            let created: { id: string; code: string; payload: SharedPayload } | null = null;
            for (let i = 0; i < CODE_CREATE_ATTEMPTS; i++) {
              const candidateCode = randomCode();
              const candidateId = `${baseId}-${candidateCode}`;
              const candidatePayload = buildPayload();
              const { error: insertError } = await supabase
                .from("condition_sessions")
                .insert({ id: candidateId, data: candidatePayload });
              if (!insertError) {
                created = { id: candidateId, code: candidateCode, payload: candidatePayload };
                break;
              }
              if (insertError.code !== POSTGRES_UNIQUE_VIOLATION) throw new Error(insertError.message);
            }
            if (!created) throw new Error("Impossible de générer un code de session unique, réessayez.");
            rowId = created.id;
            code = created.code;
            payload = created.payload;
          }
        }

        lastSyncedJson.current = JSON.stringify(payload);
        applyRemote(payload);
        subscribeTo(rowId);
        rowIdRef.current = rowId;

        setSessionName(baseId);
        setSessionCode(code);
        setStatus("synced");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de joindre le serveur de partage.");
        setStatus("error");
      }
    },
    [applyRemote, buildPayload, subscribeTo]
  );

  // debounced push whenever local state drifts from what's on the server
  useEffect(() => {
    const client = supabase;
    const rowId = rowIdRef.current;
    if (!sessionName || !rowId || !client) return;
    const payload = buildPayload();
    const json = JSON.stringify(payload);
    if (json === lastSyncedJson.current) return;

    pendingLocalPush.current = true;
    const t = setTimeout(async () => {
      try {
        const { error: updateError } = await client.from("condition_sessions").update({ data: payload }).eq("id", rowId);
        lastSyncedJson.current = json;
        setStatus(updateError ? "error" : "synced");
        if (updateError) setError(updateError.message);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Impossible d'envoyer les modifications.");
      } finally {
        pendingLocalPush.current = false;
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildPayload depends on the kind slots, which already gate this effect via .session
  }, [sessionName, sessionCode, optical.session, filter.session, monitoring.session, camera.session]);

  // leave the channel behind on unmount
  useEffect(() => () => {
    if (channelRef.current) supabase?.removeChannel(channelRef.current);
  }, []);

  return { sessionName, sessionCode, status, error, join, leave };
}
