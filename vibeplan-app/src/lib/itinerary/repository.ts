import { createClient } from "@supabase/supabase-js";
import { logItineraryStep, summarizeDeals } from "@/lib/itinerary/logging";
import type { Deal, DealSearchInput } from "@/lib/itinerary/types";

export interface DealRepository {
  readonly mode: "supabase";
  searchDeals(input: DealSearchInput, debugId?: string): Promise<Deal[]>;
}

type DbDeal = Record<string, unknown>;

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toNumberValue(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toTags(value: unknown, fallback: string) {
  if (!Array.isArray(value)) return fallback ? [fallback] : [];
  return value.filter((tag): tag is string => typeof tag === "string" && Boolean(tag));
}

function scoreDeal(deal: Deal, input: DealSearchInput) {
  const query = input.query.toLowerCase();
  const area = input.area?.toLowerCase();
  const vibe = input.vibe?.toLowerCase();
  const categories = input.categories?.map((category) => category.toLowerCase()) ?? [];
  const haystack = [
    deal.title,
    deal.description,
    deal.category,
    deal.location,
    ...deal.tags,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const token of query.split(/\W+/).filter(Boolean)) {
    if (haystack.includes(token)) score += 2;
  }

  if (area && deal.location.toLowerCase().includes(area)) score += 8;
  if (vibe && haystack.includes(vibe)) score += 3;
  if (categories.includes(deal.category.toLowerCase())) score += 5;
  if (input.max_price && deal.price <= input.max_price) score += 4;
  if (deal.discount_amount) score += 1;

  return score;
}

export class SupabaseDealRepository implements DealRepository {
  readonly mode = "supabase" as const;
  private readonly client;
  private readonly embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  private async createEmbedding(input: DealSearchInput) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    const text = [
      input.query,
      input.area ? `Area: ${input.area}` : "",
      input.vibe ? `Vibe: ${input.vibe}` : "",
      input.categories?.length ? `Categories: ${input.categories.join(", ")}` : "",
      input.max_price ? `Budget: S$${input.max_price}` : "",
      input.date ? `Date: ${input.date}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
        dimensions: 1536,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenAI embedding failed: ${response.status} ${details}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    return data.data?.[0]?.embedding ?? null;
  }

  private mapDeal(deal: DbDeal): Deal {
    const price = toNumberValue(deal.price_amount ?? deal.price, 0);
    const discount =
      deal.discount_amount === null || deal.discount_amount === undefined
        ? null
        : toNumberValue(deal.discount_amount, 0);
    const category = toStringValue(deal.category, "Offer");

    return {
      id: String(deal.id),
      title: toStringValue(deal.title, "Featured Deal"),
      description: toStringValue(deal.description, "Telegram deal"),
      category,
      source: toStringValue(deal.source, toStringValue(deal.channel_name, "telegram")),
      source_url: toStringValue(
        deal.source_url,
        toStringValue(deal.source_link, "https://t.me/")
      ),
      price,
      discount_amount: discount,
      location: toStringValue(deal.location, "Singapore"),
      lat: typeof deal.lat === "number" ? deal.lat : null,
      lng: typeof deal.lng === "number" ? deal.lng : null,
      expiry_at:
        toStringValue(deal.expiry_at) ||
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      tags: toTags(deal.tags, category),
      best_time: toStringValue(deal.best_time, toStringValue(deal.time_info, "7:00 PM")),
    };
  }

  private async searchDealsByKeyword(input: DealSearchInput, debugId?: string) {
    const { data, error } = await this.client
      .from("deals")
      .select("*")
      .limit(40);

    if (error) {
      throw new Error(`Supabase fallback deal search failed: ${error.message}`);
    }

    const now = Date.now();
    const limit = input.limit ?? 8;

    const deals = (data ?? [])
      .map((deal) => this.mapDeal(deal))
      .filter((deal) => new Date(deal.expiry_at).getTime() > now)
      .filter((deal) => !input.max_price || deal.price <= input.max_price)
      .filter((deal) => {
        if (!input.categories?.length) return true;
        return input.categories.some(
          (category) => category.toLowerCase() === deal.category.toLowerCase()
        );
      })
      .filter((deal) => {
        if (!input.area) return true;
        return deal.location.toLowerCase().includes(input.area.toLowerCase());
      })
      .sort((a, b) => scoreDeal(b, input) - scoreDeal(a, input))
      .slice(0, limit);

    if (debugId) {
      logItineraryStep({ debugId }, "repository.keyword_results", {
        count: deals.length,
        topDeals: summarizeDeals(deals),
      });
    }

    return deals;
  }

  async searchDeals(input: DealSearchInput, debugId?: string) {
    try {
      if (debugId) {
        logItineraryStep({ debugId }, "repository.search_start", {
          input,
          embeddingModel: this.embeddingModel,
        });
      }

      const embedding = await this.createEmbedding(input);

      if (!embedding) {
        console.warn("OpenAI embedding key missing; using keyword deal search.");
        return this.searchDealsByKeyword(input, debugId);
      }

      const { data, error } = await this.client.rpc("match_deals", {
        query_embedding: embedding,
        match_count: input.limit ?? 8,
        match_threshold: 0.12,
        filter_categories: input.categories?.length ? input.categories : null,
        filter_area: input.area ?? null,
        filter_max_price: input.max_price ?? null,
      });

      if (error) {
        console.warn("Supabase vector deal search failed; using keyword fallback.", error);
        if (debugId) {
          logItineraryStep({ debugId }, "repository.vector_error", {
            message: error.message,
          });
        }
        return this.searchDealsByKeyword(input, debugId);
      }

      const deals = (data ?? []).map((deal: DbDeal) => this.mapDeal(deal));
      if (debugId) {
        logItineraryStep({ debugId }, "repository.vector_results", {
          count: deals.length,
          topDeals: summarizeDeals(deals),
        });
      }

      if (deals.length) {
        return deals;
      }

      if (debugId) {
        logItineraryStep({ debugId }, "repository.keyword_fallback", {
          reason: "vector returned no deals",
        });
      }
      return this.searchDealsByKeyword(input, debugId);
    } catch (error) {
      console.warn("Semantic deal search failed; using keyword fallback.", error);
      if (debugId) {
        logItineraryStep({ debugId }, "repository.semantic_error", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return this.searchDealsByKeyword(input, debugId);
    }
  }
}

export function createDealRepository(): DealRepository {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return new SupabaseDealRepository(supabaseUrl, serviceRoleKey);
  }

  throw new Error("Supabase service credentials are required for itinerary retrieval.");
}
