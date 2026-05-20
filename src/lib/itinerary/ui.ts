import type {
  Deal,
  Itinerary,
  ItineraryActivity,
  ItineraryConstraints,
} from "@/lib/itinerary/types";

export function parseActivityPrice(price?: string | null) {
  if (!price) return 0;
  if (/free/i.test(price)) return 0;

  const values = Array.from(price.matchAll(/(?:S\$|\$)?\s*(\d+(?:\.\d+)?)/gi)).map(
    (match) => Number(match[1])
  );

  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getActivityEstimate(activity: ItineraryActivity) {
  return activity.estimated_price ?? parseActivityPrice(activity.price);
}

export function getBudgetTotals(itinerary: Itinerary, budget?: number | null) {
  const activities = itinerary.activities.map((activity) => {
    const estimated = getActivityEstimate(activity);
    const original = activity.original_price ?? estimated;
    const savings = activity.savings ?? Math.max(original - estimated, 0);

    return {
      activity,
      estimated,
      original,
      savings,
    };
  });

  const total = activities.reduce((sum, item) => sum + item.estimated, 0);
  const originalTotal = activities.reduce((sum, item) => sum + item.original, 0);
  const savings = activities.reduce((sum, item) => sum + item.savings, 0);

  return {
    activities,
    total,
    originalTotal,
    savings,
    remaining: typeof budget === "number" ? budget - total : null,
  };
}

function compactArea(area: string | null | undefined, itinerary: Itinerary) {
  if (area) return `${area}-focused`;
  const firstArea = itinerary.summary.area.split(",")[0]?.trim();
  return firstArea ? `${firstArea}-leaning` : "Area-aware";
}

export function buildMatchSignals(
  itinerary: Itinerary,
  constraints?: Partial<ItineraryConstraints> | null
) {
  const totals = getBudgetTotals(itinerary, constraints?.budget);
  const hasSavings = totals.savings > 0 || itinerary.activities.some((activity) => activity.discount);
  const indoorCount = itinerary.activities.filter((activity) =>
    [...(activity.tags ?? []), activity.category ?? ""].some((tag) => /indoor|gallery|museum|arcade/i.test(tag))
  ).length;

  return {
    budgetFit:
      typeof constraints?.budget === "number" && totals.total <= constraints.budget
        ? "Under budget"
        : typeof constraints?.budget === "number"
          ? "Budget-aware"
          : "Spend-aware",
    areaFit: compactArea(constraints?.area, itinerary),
    timeFit: constraints?.date === "tonight" ? "Tonight-ready" : "Time-fit",
    dealQuality: hasSavings ? "Deal-backed" : "Curated picks",
    travelEffort:
      itinerary.activities.length <= 4 || indoorCount >= itinerary.activities.length - 1
        ? "Low travel"
        : "Route-linked",
  };
}

export function buildPrice(deal: Deal) {
  if (!deal.discount_amount) return `S$${deal.price}`;
  return `S$${Math.max(deal.price - deal.discount_amount, 0)} after promo`;
}

export function dealToActivity(deal: Deal, id: number, time?: string): ItineraryActivity {
  const estimated = Math.max(deal.price - (deal.discount_amount ?? 0), 0);

  return {
    id,
    time: time ?? deal.best_time,
    title: deal.title,
    description: deal.description,
    location: deal.location,
    price: buildPrice(deal),
    estimated_price: estimated,
    original_price: deal.price,
    savings: deal.discount_amount ?? 0,
    discount: deal.discount_amount ? `Save S$${deal.discount_amount}` : undefined,
    source_link: deal.source_url,
    source_type: "web",
    source_deal_id: deal.id,
    category: deal.category,
    tags: deal.tags,
    coordinates: {
      lat: deal.lat,
      lng: deal.lng,
    },
  };
}

export function withDerivedItineraryMetadata(
  itinerary: Itinerary,
  constraints?: Partial<ItineraryConstraints> | null
): Itinerary {
  const totals = getBudgetTotals(itinerary, constraints?.budget);

  return {
    ...itinerary,
    summary: {
      ...itinerary.summary,
      budget: `Around S$${totals.total} total before optional extras`,
      perks:
        totals.savings > 0
          ? `Estimated S$${totals.savings} in deal savings, short hops, and budget control points`
          : itinerary.summary.perks,
    },
    matchSignals: buildMatchSignals(itinerary, constraints),
  };
}

export function replaceActivity(
  itinerary: Itinerary,
  targetActivityId: number,
  replacement: ItineraryActivity,
  constraints?: Partial<ItineraryConstraints> | null
) {
  const activities = itinerary.activities.map((activity) =>
    activity.id === targetActivityId
      ? {
          ...replacement,
          id: activity.id,
          time: activity.time,
        }
      : activity
  );

  return withDerivedItineraryMetadata(
    {
      ...itinerary,
      activities,
    },
    constraints
  );
}
