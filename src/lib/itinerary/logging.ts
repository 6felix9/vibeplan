export type ItineraryLogContext = {
  debugId: string;
};

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/key|token|secret|embedding/i.test(key))
        .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }

  return value;
}

export function logItineraryStep(
  context: ItineraryLogContext,
  stage: string,
  details: Record<string, unknown> = {}
) {
  const safeDetails = JSON.stringify(sanitizeValue(details));
  console.info(`[itinerary:${context.debugId}] ${stage} ${safeDetails}`);
}

export function summarizeDeals(deals: Array<{ id: string; title: string; category?: string }>) {
  return deals.slice(0, 5).map((deal) => ({
    id: deal.id,
    title: deal.title,
    category: deal.category,
  }));
}
