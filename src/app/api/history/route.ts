import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const SessionQuerySchema = z.object({
  sessionId: z.string().trim().min(1),
});

const DeleteHistorySchema = z.object({
  sessionId: z.string().trim().min(1),
  id: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { sessionId } = SessionQuerySchema.parse({
      sessionId: searchParams.get("sessionId"),
    });
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("itinerary_history")
      .select(
        "id,created_at,query,itinerary,constraints,retrieval_mode,title,summary,area,budget,vibe"
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    console.error("History fetch failed:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid history request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load itinerary history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = DeleteHistorySchema.parse(await request.json());
    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("itinerary_history")
      .delete()
      .eq("session_id", body.sessionId)
      .eq("id", body.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("History delete failed:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid history delete request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete itinerary history" },
      { status: 500 }
    );
  }
}
