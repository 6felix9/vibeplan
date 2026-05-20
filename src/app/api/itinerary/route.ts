import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createDealRepository } from "@/lib/itinerary/repository";
import { generateItinerary } from "@/lib/itinerary/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await generateItinerary(body, createDealRepository());

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
