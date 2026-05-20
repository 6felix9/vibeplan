import { z } from "zod";

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const ItineraryActivitySchema = z.object({
  id: z.number(),
  time: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  price: z.string(),
  estimated_price: z.number().optional(),
  original_price: z.number().optional(),
  savings: z.number().optional(),
  discount: z.string().optional(),
  source_link: z.string().url().optional(),
  source_type: z.string().optional(),
  source_deal_id: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  coordinates: CoordinatesSchema,
});

export const ItinerarySummarySchema = z.object({
  intro: z.string(),
  description: z.string(),
  budget: z.string(),
  duration: z.string(),
  area: z.string(),
  perks: z.string(),
});

export const ItinerarySchema = z.object({
  title: z.string(),
  summary: ItinerarySummarySchema,
  matchSignals: z
    .object({
      budgetFit: z.string(),
      areaFit: z.string(),
      timeFit: z.string(),
      dealQuality: z.string(),
      travelEffort: z.string(),
    })
    .optional(),
  activities: z.array(ItineraryActivitySchema).min(2).max(6),
});

export const ItineraryConstraintsSchema = z.object({
  query: z.string(),
  budget: z.number().nullable(),
  area: z.string().nullable(),
  date: z.string().nullable(),
  vibe: z.string().nullable(),
  categories: z.array(z.string()),
});

export const DealSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  source: z.string(),
  source_url: z.string().url(),
  price: z.number(),
  discount_amount: z.number().nullable(),
  location: z.string(),
  lat: z.number(),
  lng: z.number(),
  expiry_at: z.string(),
  tags: z.array(z.string()),
  best_time: z.string(),
});

export const DealSearchInputSchema = z.object({
  query: z.string().min(1),
  area: z.string().nullable().optional(),
  max_price: z.number().nullable().optional(),
  categories: z.array(z.string()).optional(),
  date: z.string().nullable().optional(),
  vibe: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(12).default(8),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;
export type ItineraryActivity = z.infer<typeof ItineraryActivitySchema>;
export type ItineraryConstraints = z.infer<typeof ItineraryConstraintsSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type DealSearchInput = z.infer<typeof DealSearchInputSchema>;

export type ItineraryApiResponse = {
  itinerary: Itinerary;
  constraints: ItineraryConstraints;
  retrievalMode: "mock" | "supabase";
};

export type SwapPreference = "similar" | "cheaper" | "closer" | "romantic" | "indoor";
