import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("deals")
    .select("category")
    .order("category");

  if (error) return NextResponse.json({ categories: [] }, { status: 500 });

  const categories = ["All", ...Array.from(new Set(
    (data ?? []).map((r: { category: string }) => r.category).filter(Boolean)
  ))];
  return NextResponse.json({ categories });
}
