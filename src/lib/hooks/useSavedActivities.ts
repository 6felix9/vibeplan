"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { homeActivities, type HomeActivity } from "@/lib/homeActivities";
import { supabase } from "@/lib/supabaseClient";

const savedActivitiesKey = "vibeplan:saved-activities";
const savedActivitiesEvent = "vibeplan:saved-activities-change";

function readSavedIds() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(savedActivitiesKey) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  window.localStorage.setItem(savedActivitiesKey, JSON.stringify(ids));
  window.dispatchEvent(new Event(savedActivitiesEvent));
}

function subscribeToSavedIds(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(savedActivitiesEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(savedActivitiesEvent, onStoreChange);
  };
}

function getServerSnapshot() {
  return "[]";
}

function getSavedSnapshot() {
  if (typeof window === "undefined") return getServerSnapshot();
  return window.localStorage.getItem(savedActivitiesKey) || "[]";
}

function parseSavedSnapshot(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

// Helper to map DB row to HomeActivity
const mapDbDealToActivity = (deal: any, index: number): HomeActivity => {
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
    "Default": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"
  };
  
  const image = deal.image_url || defaultImages[deal.category] || defaultImages["Default"];
  
  return {
    id: deal.id,
    title: deal.title,
    category: deal.category,
    description: deal.description,
    image: image,
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

export function useSavedActivities() {
  const savedSnapshot = useSyncExternalStore(
    subscribeToSavedIds,
    getSavedSnapshot,
    getServerSnapshot
  );
  
  const savedIds = useMemo(
    () => parseSavedSnapshot(savedSnapshot),
    [savedSnapshot]
  );
  
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);
  
  const [dbSavedActivities, setDbSavedActivities] = useState<HomeActivity[]>([]);

  // Find which saved IDs are dynamic database deals
  const dbSavedIds = useMemo(() => {
    const staticIds = new Set(homeActivities.map(a => a.id));
    return savedIds.filter(id => !staticIds.has(id));
  }, [savedIds]);

  // Fetch dynamic saved activities from Supabase when dbSavedIds changes
  useEffect(() => {
    async function fetchSavedDeals() {
      if (dbSavedIds.length === 0) {
        setDbSavedActivities([]);
        return;
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("deals")
          .select("*")
          .in("id", dbSavedIds);
          
        if (error) {
          console.error("Error fetching saved deals from Supabase:", error);
          return;
        }
        
        if (data) {
          const mapped = data.map((deal, idx) => mapDbDealToActivity(deal, idx));
          setDbSavedActivities(mapped);
        }
      } catch (err) {
        console.error("Failed to connect to Supabase to fetch saved deals:", err);
      }
    }
    
    fetchSavedDeals();
  }, [dbSavedIds]);

  // Merge static saved activities and fetched dynamic ones, keeping local storage order
  const savedActivities = useMemo(() => {
    const staticSaved = homeActivities.filter((activity) => savedIdSet.has(activity.id));
    const allFetched = [...staticSaved, ...dbSavedActivities];
    
    // Sort allFetched to match the order in savedIds
    const idToIndexMap = new Map(savedIds.map((id, index) => [id, index]));
    return allFetched.sort((a, b) => {
      const idxA = idToIndexMap.get(a.id) ?? 999;
      const idxB = idToIndexMap.get(b.id) ?? 999;
      return idxA - idxB;
    });
  }, [savedIdSet, dbSavedActivities, savedIds]);

  const isSaved = useCallback(
    (activityId: string) => savedIdSet.has(activityId),
    [savedIdSet]
  );

  const toggleSaved = useCallback((activityId: string) => {
    const currentIds = readSavedIds();
    const nextIds = currentIds.includes(activityId)
      ? currentIds.filter((id) => id !== activityId)
      : [activityId, ...currentIds];

    writeSavedIds(nextIds);
  }, []);

  return {
    savedActivities,
    savedIds,
    isSaved,
    toggleSaved,
  };
}
