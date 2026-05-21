import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createDealRepository } from "@/lib/itinerary/repository";
import { fallbackConstraints } from "@/lib/itinerary/pipeline";
import {
  ItineraryActivitySchema,
  ItineraryConstraintsSchema,
  ItinerarySchema,
} from "@/lib/itinerary/types";
import type { Deal, SwapPreference } from "@/lib/itinerary/types";
import {
  dealToActivity,
  getActivityEstimate,
  replaceActivity,
} from "@/lib/itinerary/ui";

export const runtime = "nodejs";

const SwapRequestSchema = z.object({
  itinerary: ItinerarySchema,
  constraints: ItineraryConstraintsSchema.optional().nullable(),
  targetActivity: ItineraryActivitySchema,
  preference: z.enum(["similar", "cheaper", "closer", "romantic", "indoor"]),
});

function distanceScore(deal: Deal, target: z.infer<typeof ItineraryActivitySchema>) {
  const latDiff = deal.lat - target.coordinates.lat;
  const lngDiff = deal.lng - target.coordinates.lng;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function preferenceQuery(preference: SwapPreference, target: z.infer<typeof ItineraryActivitySchema>) {
  const targetTags = target.tags?.join(" ") ?? "";

  switch (preference) {
    case "cheaper":
      return `cheaper budget ${target.category ?? ""} ${targetTags}`.trim();
    case "closer":
      return `near ${target.location} walkable ${target.category ?? ""}`.trim();
    case "romantic":
      return `romantic date night cozy ${target.category ?? ""}`.trim();
    case "indoor":
      return `indoor sheltered ${target.category ?? ""}`.trim();
    default:
      return `${target.title} ${target.category ?? ""} ${targetTags}`.trim();
  }
}

function rankCandidates(
  deals: Deal[],
  preference: SwapPreference,
  target: z.infer<typeof ItineraryActivitySchema>
) {
  return [...deals].sort((a, b) => {
    if (preference === "cheaper") {
      const aPrice = Math.max(a.price - (a.discount_amount ?? 0), 0);
      const bPrice = Math.max(b.price - (b.discount_amount ?? 0), 0);
      return aPrice - bPrice;
    }

    if (preference === "closer") {
      return distanceScore(a, target) - distanceScore(b, target);
    }

    const aTagMatch = a.tags.filter((tag) => target.tags?.includes(tag)).length;
    const bTagMatch = b.tags.filter((tag) => target.tags?.includes(tag)).length;
    const aDiscount = a.discount_amount ?? 0;
    const bDiscount = b.discount_amount ?? 0;

    return bTagMatch - aTagMatch || bDiscount - aDiscount || a.price - b.price;
  });
}

export async function POST(request: Request) {
  try {
    const body = SwapRequestSchema.parse(await request.json());
    const repository = createDealRepository();
    const constraints =
      body.constraints ?? fallbackConstraints(body.itinerary.summary.description);
    const currentDealIds = new Set(
      body.itinerary.activities
        .map((activity) => activity.source_deal_id)
        .filter((id): id is string => Boolean(id))
    );
    const targetEstimate = getActivityEstimate(body.targetActivity);
    const maxPrice = constraints.budget;

    const deals = await repository.searchDeals({
      query: preferenceQuery(body.preference, body.targetActivity),
      area:
        body.preference === "closer"
          ? body.targetActivity.location
          : constraints.area,
      max_price: maxPrice,
      categories: body.targetActivity.category
        ? [body.targetActivity.category]
        : constraints.categories,
      date: constraints.date,
      vibe:
        body.preference === "romantic"
          ? [constraints.vibe, "romantic date"].filter(Boolean).join(", ")
          : body.preference === "indoor"
            ? [constraints.vibe, "indoor"].filter(Boolean).join(", ")
            : constraints.vibe,
      limit: 12,
    });

    const candidates = deals
      .filter((deal) => !currentDealIds.has(deal.id))
      .filter((deal) => {
        if (body.preference !== "cheaper") return true;
        return Math.max(deal.price - (deal.discount_amount ?? 0), 0) < targetEstimate;
      });

    const rankedDeals = rankCandidates(
      candidates,
      body.preference,
      body.targetActivity
    );

    const replacementDeal = rankedDeals[0];

    if (!replacementDeal) {
      return NextResponse.json(
        {
          itinerary: body.itinerary,
          message: "No stronger alternative found for this swap.",
        },
        { status: 404 }
      );
    }

    const itinerary = replaceActivity(
      body.itinerary,
      body.targetActivity.id,
      dealToActivity(replacementDeal, body.targetActivity.id, body.targetActivity.time),
      constraints
    );

    return NextResponse.json({
      itinerary,
      replacementActivity: itinerary.activities.find(
        (activity) => activity.id === body.targetActivity.id
      ),
      retrievalMode: repository.mode,
    });
  } catch (error) {
    console.error("Itinerary swap failed:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid itinerary swap request",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to swap itinerary activity",
      },
      { status: 500 }
    );
  }
}
