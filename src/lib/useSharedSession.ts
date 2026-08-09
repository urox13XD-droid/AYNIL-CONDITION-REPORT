"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { FilterItem, MonitoringItem, OpticalEntry, ReportHeader } from "./types";

interface KindSlot<T> {
  session: { header: ReportHeader; items: T[] };
  setHeader: (h: ReportHeader) => void;
  setItems: (items: T[]) => void;
}

interface SharedPayload {
  optical: { header: ReportHeader; items: OpticalEntry[] };
  filter: { header: ReportHeader; items: FilterItem[] };
  monitoring: { header: ReportHeader; items: MonitoringItem[] };
}

export type SyncStatus = "offline" | "connecting" | "synced" | "error";

const PUSH_DEBOUNCE_MS = 700;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function useSharedSession(
  optical: KindSlot<OpticalEntry>,
  filter: KindSlot<FilterItem>,
  monitoring: KindSlot<MonitoringItem>
) {
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [error, setError] = useState<string | null>(null);

  const lastSyncedJson = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const applyRemote = useCallback(
    (payload: SharedPayload) => {
      optical.setHeader(payload.optical.header);
      optical.setItems(payload.optical.items);
      filter.setHeader(payload.filter.header);
      filter.setItems(payload.filter.items);
      monitoring.setHeader(payload.monitoring.header);
      monitoring.setItems(payload.monitoring.items);
    },
    [optical, filter, monitoring]
  );

  const leave = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    lastSyncedJson.current = null;
    setSessionName(null);
    setStatus("offline");
    setError(null);
  }, []);

  const join = useCallback(
    async (rawName: string) => {
      if (!supabase) {
        setError("Le partage n'est pas configuré sur ce déploiement.");
        setStatus("error");
        return;
      }
      const id = slugify(rawName);
      if (!id) return;

      setStatus("connecting");
      setError(null);

      const { data: existing, error: fetchError } = await supabase
        .from("condition_sessions")
        .select("data")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setStatus("error");
        return;
      }

      if (existing) {
        const payload = existing.data as SharedPayload;
        lastSyncedJson.current = JSON.stringify(payload);
        applyRemote(payload);
      } else {
        const payload: SharedPayload = {
          optical: { header: optical.session.header, items: optical.session.items },
          filter: { header: filter.session.header, items: filter.session.items },
          monitoring: { header: monitoring.session.header, items: monitoring.session.items },
        };
        const { error: insertError } = await supabase.from("condition_sessions").insert({ id, data: payload });
        if (insertError) {
          setError(insertError.message);
          setStatus("error");
          return;
        }
        lastSyncedJson.current = JSON.stringify(payload);
      }

      const channel = supabase
        .channel(`condition_session_${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "condition_sessions", filter: `id=eq.${id}` },
          (change) => {
            const incoming = (change.new as { data: SharedPayload }).data;
            const json = JSON.stringify(incoming);
            if (json === lastSyncedJson.current) return; // our own write echoed back
            lastSyncedJson.current = json;
            applyRemote(incoming);
          }
        )
        .subscribe();
      channelRef.current = channel;

      setSessionName(id);
      setStatus("synced");
    },
    [applyRemote, optical, filter, monitoring]
  );

  // debounced push whenever local state drifts from what's on the server
  useEffect(() => {
    const client = supabase;
    if (!sessionName || !client) return;
    const payload: SharedPayload = {
      optical: { header: optical.session.header, items: optical.session.items },
      filter: { header: filter.session.header, items: filter.session.items },
      monitoring: { header: monitoring.session.header, items: monitoring.session.items },
    };
    const json = JSON.stringify(payload);
    if (json === lastSyncedJson.current) return;

    const t = setTimeout(async () => {
      const { error: updateError } = await client.from("condition_sessions").update({ data: payload }).eq("id", sessionName);
      lastSyncedJson.current = json;
      setStatus(updateError ? "error" : "synced");
      if (updateError) setError(updateError.message);
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [sessionName, optical.session, filter.session, monitoring.session]);

  // leave the channel behind on unmount
  useEffect(() => () => {
    if (channelRef.current) supabase?.removeChannel(channelRef.current);
  }, []);

  return { sessionName, status, error, join, leave };
}
