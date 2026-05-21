import type { SupabaseClient } from "@supabase/supabase-js";

const DAILY_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function checkItineraryRateLimit(
  sessionId: string,
  supabase: SupabaseClient
): Promise<{ allowed: boolean; resetAt: Date | null }> {
  try {
    const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data, error } = await supabase
      .from("itinerary_history")
      .select("created_at")
      .eq("session_id", sessionId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(DAILY_LIMIT);

    if (error) {
      console.error("[rateLimit] failed to check rate limit, failing open:", error);
      return { allowed: true, resetAt: null };
    }

    if (!data || data.length < DAILY_LIMIT) {
      return { allowed: true, resetAt: null };
    }

    const resetAt = new Date(new Date(data[0].created_at).getTime() + WINDOW_MS);
    return { allowed: false, resetAt };
  } catch (err) {
    console.error("[rateLimit] unexpected error, failing open:", err);
    return { allowed: true, resetAt: null };
  }
}
