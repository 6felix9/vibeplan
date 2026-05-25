import { NextRequest, NextResponse } from "next/server";
import { fetchDealsPage } from "@/lib/deals";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10) || 25));

  const deals = await fetchDealsPage(offset, limit);
  return NextResponse.json({ deals, hasMore: deals.length === limit });
}
