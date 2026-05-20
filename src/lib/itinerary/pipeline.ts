import { z } from "zod";
import { mockItinerary } from "@/lib/mock-api-data";
import type { DealRepository } from "@/lib/itinerary/repository";
import {
  DealSearchInputSchema,
  ItineraryConstraintsSchema,
  ItinerarySchema,
  type Deal,
  type Itinerary,
  type ItineraryApiResponse,
  type ItineraryConstraints,
} from "@/lib/itinerary/types";
import {
  dealToActivity,
  withDerivedItineraryMetadata,
} from "@/lib/itinerary/ui";

const CuratedPlanSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  selectedDealIds: z.array(z.string()).min(2).max(6),
  notes: z.array(z.string()),
});

const ItineraryRequestSchema = z.object({
  query: z.string().trim().min(1),
  userId: z.string().optional(),
});

type ItineraryRequest = z.infer<typeof ItineraryRequestSchema>;

function getModel() {
  return process.env.OPENAI_MODEL || undefined;
}

function parseBudget(query: string) {
  const match = query.match(/(?:budget|under|below|less than|max)?\s*\$?\s*(\d{2,4})/i);
  return match ? Number(match[1]) : null;
}

function parseArea(query: string) {
  const knownAreas = [
    "Orchard",
    "Somerset",
    "Bugis",
    "Tiong Bahru",
    "Chinatown",
    "Marina Bay",
    "Dhoby Ghaut",
    "Joo Chiat",
    "Haji Lane",
    "Civic District",
  ];

  return knownAreas.find((area) => query.toLowerCase().includes(area.toLowerCase())) ?? null;
}

function parseVibe(query: string) {
  const vibeWords = ["date", "chill", "artsy", "romantic", "budget", "outdoor", "indoor"];
  const found = vibeWords.filter((word) => query.toLowerCase().includes(word));
  return found.length ? found.join(", ") : null;
}

function parseCategories(query: string) {
  const categoryHints: Record<string, string> = {
    food: "Food",
    dinner: "Food",
    cafe: "Food",
    dessert: "Food",
    activity: "Activity",
    game: "Activity",
    movie: "Activity",
    artsy: "Lifestyle",
    gallery: "Lifestyle",
    market: "Lifestyle",
    lifestyle: "Lifestyle",
  };

  return Array.from(
    new Set(
      Object.entries(categoryHints)
        .filter(([hint]) => query.toLowerCase().includes(hint))
        .map(([, category]) => category)
    )
  );
}

export function fallbackConstraints(query: string): ItineraryConstraints {
  return {
    query,
    budget: parseBudget(query),
    area: parseArea(query),
    date: query.toLowerCase().includes("tonight") ? "tonight" : null,
    vibe: parseVibe(query),
    categories: parseCategories(query),
  };
}

function dealsToItinerary(query: string, constraints: ItineraryConstraints, deals: Deal[]): Itinerary {
  const selectedDeals = deals.length >= 2 ? deals.slice(0, 4) : [];

  if (selectedDeals.length < 2) {
    return mockItinerary as Itinerary;
  }

  const total = selectedDeals.reduce((sum, deal) => {
    return sum + Math.max(deal.price - (deal.discount_amount ?? 0), 0);
  }, 0);
  const area = constraints.area ?? selectedDeals.map((deal) => deal.location).join(", ");

  return {
    title: constraints.vibe?.includes("date")
      ? `A Walkable ${area} Date Night Under S$${constraints.budget ?? total + 20}`
      : `A Smart ${area} Plan Built From Fresh Deals`,
    summary: {
      intro:
        "This itinerary balances nearby promos, pacing, and simple transitions so the evening feels planned without becoming rigid.",
      description: `Built from the current mock deal repository for: "${query}". The route prioritizes matching area, budget, category, and expiry constraints before formatting the final timeline.`,
      budget: `Around S$${total} total before optional extras`,
      duration: `${selectedDeals[0].best_time} - ${selectedDeals[selectedDeals.length - 1].best_time}`,
      area,
      perks: "Mock RAG retrieval, deal-aware ranking, short hops, and budget control points",
    },
    activities: selectedDeals.map((deal, index) => dealToActivity(deal, index + 1)),
  };
}

function makeSearchDealsTool(
  createTool: typeof import("@openai/agents").tool,
  repository: DealRepository,
  onRetrieved: (deals: Deal[]) => void
) {
  return createTool({
    name: "search_deals",
    description:
      "Search the deals repository for itinerary candidates using semantic intent plus structured filters.",
    parameters: DealSearchInputSchema,
    async execute(input) {
      const deals = await repository.searchDeals(input);
      onRetrieved(deals);
      return deals;
    },
  });
}

async function runOpenAiPipeline(
  request: ItineraryRequest,
  repository: DealRepository
): Promise<ItineraryApiResponse> {
  const { Agent, run, tool } = await import("@openai/agents");
  let retrievedDeals: Deal[] = [];
  const model = getModel();
  const baseAgentConfig = model ? { model } : {};
  const searchDealsTool = makeSearchDealsTool(tool, repository, (deals) => {
    retrievedDeals = deals;
  });

  const plannerAgent = new Agent({
    ...baseAgentConfig,
    name: "Planner Agent",
    instructions:
      "Parse the user's itinerary request into constraints. You must call search_deals once with the best retrieval filters before producing your final constraints. Use null when a constraint is unknown.",
    tools: [searchDealsTool],
    outputType: ItineraryConstraintsSchema,
  });

  const plannerResult = await run(plannerAgent, request.query, {
    maxTurns: 4,
  });
  const constraints = ItineraryConstraintsSchema.parse(
    plannerResult.finalOutput ?? fallbackConstraints(request.query)
  );

  if (retrievedDeals.length === 0) {
    retrievedDeals = await repository.searchDeals({
      query: constraints.query || request.query,
      area: constraints.area,
      max_price: constraints.budget,
      categories: constraints.categories,
      date: constraints.date,
      vibe: constraints.vibe,
      limit: 8,
    });
  }

  const curationAgent = new Agent({
    ...baseAgentConfig,
    name: "Curation Agent",
    instructions:
      "Rank the candidate deals for the requested itinerary. Select 2 to 5 deal IDs that fit the area, budget, timing, and vibe. Avoid time conflicts and keep the route coherent.",
    outputType: CuratedPlanSchema,
  });
  const curationResult = await run(
    curationAgent,
    JSON.stringify({
      userQuery: request.query,
      constraints,
      candidates: retrievedDeals,
    }),
    {
      maxTurns: 3,
    }
  );
  const curated = CuratedPlanSchema.parse(curationResult.finalOutput);
  const selectedDeals = curated.selectedDealIds
    .map((id) => retrievedDeals.find((deal) => deal.id === id))
    .filter((deal): deal is Deal => Boolean(deal));

  const formatterAgent = new Agent({
    ...baseAgentConfig,
    name: "Formatter Agent",
    instructions:
      "Format the selected deals into the exact itinerary JSON schema. Use clean time blocks, concise descriptions, source links, coordinates, and realistic Singapore-dollar budget text. Include travel-time or pacing guidance inside descriptions when useful.",
    outputType: ItinerarySchema,
  });
  const formatterResult = await run(
    formatterAgent,
    JSON.stringify({
      userQuery: request.query,
      constraints,
      curated,
      selectedDeals: selectedDeals.length >= 2 ? selectedDeals : retrievedDeals.slice(0, 4),
    }),
    {
      maxTurns: 3,
    }
  );

  return {
    itinerary: withDerivedItineraryMetadata(
      ItinerarySchema.parse(formatterResult.finalOutput),
      constraints
    ),
    constraints,
    retrievalMode: repository.mode,
  };
}

export async function generateItinerary(
  rawRequest: unknown,
  repository: DealRepository
): Promise<ItineraryApiResponse> {
  const request = ItineraryRequestSchema.parse(rawRequest);
  const constraints = fallbackConstraints(request.query);

  if (!process.env.OPENAI_API_KEY) {
    const deals = await repository.searchDeals({
      query: request.query,
      area: constraints.area,
      max_price: constraints.budget,
      categories: constraints.categories,
      date: constraints.date,
      vibe: constraints.vibe,
      limit: 8,
    });

    return {
      itinerary: withDerivedItineraryMetadata(
        ItinerarySchema.parse(dealsToItinerary(request.query, constraints, deals)),
        constraints
      ),
      constraints,
      retrievalMode: repository.mode,
    };
  }

  return runOpenAiPipeline(request, repository);
}
