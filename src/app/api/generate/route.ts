import { NextRequest, NextResponse } from "next/server";
import { mockItinerary } from "@/lib/mock-api-data";

export async function POST(request: NextRequest) {
  let requestBody = null;

  try {
    requestBody = await request.json();
  } catch {
    requestBody = null;
  }

  return NextResponse.json({
    ...mockItinerary,
    mock: true,
    request: requestBody,
  });
}
