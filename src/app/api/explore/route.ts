import { NextResponse } from "next/server";
import { mockPublicItineraries } from "@/lib/mock-api-data";

export async function GET() {
  return NextResponse.json(mockPublicItineraries);
}
