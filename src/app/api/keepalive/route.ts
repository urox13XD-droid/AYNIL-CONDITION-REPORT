import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

/** hit by a daily Vercel Cron (see vercel.json) so the Supabase free-tier project never sits idle long enough to auto-pause */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "Supabase not configured" }, { status: 200 });
  }
  const { error } = await supabase.from("condition_sessions").select("id").limit(1);
  return NextResponse.json({ ok: !error, error: error?.message ?? null });
}
