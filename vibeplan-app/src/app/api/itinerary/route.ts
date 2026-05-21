import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createDealRepository } from "@/lib/itinerary/repository";
import { generateItinerary } from "@/lib/itinerary/pipeline";
import { createSupabaseServiceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const ItineraryRouteRequestSchema = z.object({
  query: z.string().trim().min(1),
  sessionId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = ItineraryRouteRequestSchema.parse(await request.json());
    console.info("[itinerary:route] request", JSON.stringify({
      query: body.query,
      hasSessionId: Boolean(body.sessionId),
    }));
    const response = await generateItinerary(body, createDealRepository());

    if (body.sessionId) {
      const supabase = createSupabaseServiceClient();
      const { data, error } = await supabase
        .from("itinerary_history")
        .insert({
          session_id: body.sessionId,
          query: body.query,
          itinerary: response.itinerary,
          constraints: response.constraints,
          retrieval_mode: response.retrievalMode,
          title: response.itinerary.title,
          summary: response.itinerary.summary.description,
          area: response.itinerary.summary.area,
          budget: response.itinerary.summary.budget,
          vibe: response.constraints.vibe,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to save itinerary history:", error);
      } else {
        console.info("[itinerary:route] history_saved", JSON.stringify({
          historyId: data?.id ?? null,
        }));
      }

      return NextResponse.json({
        ...response,
        historyId: data?.id ?? null,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Itinerary generation failed:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid itinerary request",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
      },
      { status: 500 }
    );
  }
}
