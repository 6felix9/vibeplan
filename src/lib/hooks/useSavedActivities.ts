"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { homeActivities, type HomeActivity } from "@/lib/homeActivities";
import { supabase } from "@/lib/supabaseClient";
import { mapDbDealToActivity } from "@/lib/deals";

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
