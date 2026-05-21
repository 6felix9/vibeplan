import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
    }

    const auth = request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    revalidateTag("deals", {});
    return NextResponse.json({ revalidated: true, tag: "deals" });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
