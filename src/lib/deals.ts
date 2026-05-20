import { unstable_cache } from "next/cache";
import { homeActivities, type HomeActivity } from "@/lib/homeActivities";
import { supabase } from "@/lib/supabaseClient";

export const mapDbDealToActivity = (deal: any, index: number): HomeActivity => {
  const imageClasses = ["h-28 sm:h-48", "h-32 sm:h-60", "h-24 sm:h-44", "h-[7.5rem] sm:h-56", "h-36 sm:h-72", "h-24 sm:h-40"];
  const noteClasses = ["rotate-[-1.5deg]", "rotate-[1deg]", "rotate-[0.5deg]", "rotate-[-0.5deg]", "rotate-[1.5deg]", "rotate-[-1deg]", "rotate-[0.75deg]", "rotate-[-1.25deg]"];

  const imageClass = imageClasses[index % imageClasses.length];
  const noteClass = noteClasses[index % noteClasses.length];

  const defaultImages: Record<string, string> = {
    "Food": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=900&q=80",
    "Sports": "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80",
    "Event": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    "Culture": "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=900&q=80",
    "Shopping": "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
    "Default": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  };

  const image = deal.image_url || defaultImages[deal.category] || defaultImages["Default"];

  return {
    id: deal.id,
    title: deal.title,
    category: deal.category,
    description: deal.description,
    image,
    price: deal.price || "Free entry",
    time: deal.time_info || "Daily",
    location: deal.location || "Singapore",
    discount: deal.discount || undefined,
    vibe: deal.vibe || "Tasty, spontaneous, cozy",
    tags: deal.tags || [deal.category],
    imageClass,
    noteClass,
  };
};

async function fetchDeals(): Promise<HomeActivity[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
    return homeActivities;
  }

  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deals from Supabase:", error);
      return [];
    }

    return data ? data.map((deal, idx) => mapDbDealToActivity(deal, idx)) : [];
  } catch (err) {
    console.error("Failed to connect to Supabase:", err);
    return [];
  }
}

export const getDeals = unstable_cache(fetchDeals, ["home-deals"], {
  revalidate: 3600,
  tags: ["deals"],
});
