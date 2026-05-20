import { createClient } from "@supabase/supabase-js";
import { mockDeals } from "@/lib/itinerary/mockDeals";
import type { Deal, DealSearchInput } from "@/lib/itinerary/types";

export interface DealRepository {
  readonly mode: "mock" | "supabase";
  searchDeals(input: DealSearchInput): Promise<Deal[]>;
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

export class MockDealRepository implements DealRepository {
  readonly mode = "mock" as const;

  async searchDeals(input: DealSearchInput) {
    const now = Date.now();
    const limit = input.limit ?? 8;

    return mockDeals
      .filter((deal) => new Date(deal.expiry_at).getTime() > now)
      .filter((deal) => !input.max_price || deal.price <= input.max_price)
      .filter((deal) => {
        if (!input.categories?.length) return true;
        return input.categories.some(
          (category) => category.toLowerCase() === deal.category.toLowerCase()
        );
      })
      .sort((a, b) => scoreDeal(b, input) - scoreDeal(a, input))
      .slice(0, limit);
  }
}

export class SupabaseDealRepository implements DealRepository {
  readonly mode = "supabase" as const;
  private readonly client;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  async searchDeals(input: DealSearchInput) {
    let query = this.client
      .from("deals")
      .select(
        "id,title,description,category,source,source_url,price,discount_amount,location,lat,lng,expiry_at"
      )
      .gt("expiry_at", new Date().toISOString())
      .order("refreshed_at", { ascending: false })
      .limit(input.limit ?? 8);

    if (input.max_price) {
      query = query.lte("price", input.max_price);
    }

    if (input.categories?.length) {
      query = query.in("category", input.categories);
    }

    if (input.area) {
      query = query.ilike("location", `%${input.area}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase deal search failed: ${error.message}`);
    }

    return (data ?? []).map((deal) => ({
      id: String(deal.id),
      title: deal.title,
      description: deal.description,
      category: deal.category,
      source: deal.source,
      source_url: deal.source_url,
      price: Number(deal.price ?? 0),
      discount_amount:
        deal.discount_amount === null ? null : Number(deal.discount_amount ?? 0),
      location: deal.location,
      lat: Number(deal.lat),
      lng: Number(deal.lng),
      expiry_at: deal.expiry_at,
      tags: [deal.category].filter(Boolean),
      best_time: "7:00 PM",
    }));
  }
}

export function createDealRepository(): DealRepository {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return new SupabaseDealRepository(supabaseUrl, serviceRoleKey);
  }

  return new MockDealRepository();
}
