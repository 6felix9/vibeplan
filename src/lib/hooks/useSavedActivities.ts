"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { type HomeActivity } from "@/lib/homeActivities";
import { supabase } from "@/lib/supabaseClient";
import { mapDbDealToActivity } from "@/lib/deals";

const savedActivitiesKey = "vibeplan:saved-activities";
const savedActivitiesEvent = "vibeplan:saved-activities-change";

type SavedActivityRow = {
  deal_id: string;
};

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

function getOrInitializeSessionId() {
  if (typeof window === "undefined") return "";
  let sessionId = window.localStorage.getItem("vibeplan:session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem("vibeplan:session-id", sessionId);
  }
  return sessionId;
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
  const [isCheckingSavedIds, setIsCheckingSavedIds] = useState(true);
  const [isFetchingSavedDeals, setIsFetchingSavedDeals] = useState(false);

  // Sync list of saved IDs from Supabase on mount
  useEffect(() => {
    let isActive = true;

    async function syncSavedIds() {
      const sessionId = getOrInitializeSessionId();
      if (!sessionId) {
        setIsCheckingSavedIds(false);
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
        setIsCheckingSavedIds(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("saved_activities")
          .select("deal_id")
          .eq("session_id", sessionId);

        if (error) {
          console.error("Error syncing saved activities from Supabase:", error);
          return;
        }

        if (data) {
          const fetchedIds = (data as SavedActivityRow[]).map((row) => row.deal_id);
          const localIds = readSavedIds();
          const fetchedSet = new Set(fetchedIds);
          
          const isSame = localIds.length === fetchedIds.length && localIds.every(id => fetchedSet.has(id));
          if (!isSame && isActive) {
            writeSavedIds(fetchedIds);
          }
        }
      } catch (err) {
        console.error("Failed to connect to Supabase to sync saved activities:", err);
      } finally {
        if (isActive) {
          setIsCheckingSavedIds(false);
        }
      }
    }

    syncSavedIds();

    return () => {
      isActive = false;
    };
  }, []);

  // Fetch dynamic saved activities from Supabase when savedIds changes
  useEffect(() => {
    let isActive = true;

    async function fetchSavedDeals() {
      if (isCheckingSavedIds) return;

      if (savedIds.length === 0) {
        setDbSavedActivities([]);
        setIsFetchingSavedDeals(false);
        return;
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
        setIsFetchingSavedDeals(false);
        return;
      }
      
      setIsFetchingSavedDeals(true);

      try {
        const { data, error } = await supabase
          .from("deals")
          .select("*")
          .in("id", savedIds);
          
        if (error) {
          console.error("Error fetching saved deals from Supabase:", error);
          return;
        }
        
        if (data && isActive) {
          const mapped = data.map((deal, idx) => mapDbDealToActivity(deal, idx));
          setDbSavedActivities(mapped);
        }
      } catch (err) {
        console.error("Failed to connect to Supabase to fetch saved deals:", err);
      } finally {
        if (isActive) {
          setIsFetchingSavedDeals(false);
        }
      }
    }
    
    fetchSavedDeals();

    return () => {
      isActive = false;
    };
  }, [isCheckingSavedIds, savedIds]);

  // Sort dynamic saved activities to match local storage order
  const savedActivities = useMemo(() => {
    const idToIndexMap = new Map(savedIds.map((id, index) => [id, index]));
    return [...dbSavedActivities].sort((a, b) => {
      const idxA = idToIndexMap.get(a.id) ?? 999;
      const idxB = idToIndexMap.get(b.id) ?? 999;
      return idxA - idxB;
    });
  }, [dbSavedActivities, savedIds]);

  const isSaved = useCallback(
    (activityId: string) => savedIdSet.has(activityId),
    [savedIdSet]
  );

  const toggleSaved = useCallback(async (activityId: string) => {
    const currentIds = readSavedIds();
    const isCurrentlySaved = currentIds.includes(activityId);
    
    // Update local storage immediately for responsive UI
    const nextIds = isCurrentlySaved
      ? currentIds.filter((id) => id !== activityId)
      : [activityId, ...currentIds];
    writeSavedIds(nextIds);

    // Update Supabase in background
    const sessionId = getOrInitializeSessionId();
    if (!sessionId) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
      return;
    }

    try {
      if (isCurrentlySaved) {
        await supabase
          .from("saved_activities")
          .delete()
          .eq("session_id", sessionId)
          .eq("deal_id", activityId);
      } else {
        await supabase
          .from("saved_activities")
          .insert({
            session_id: sessionId,
            deal_id: activityId
          });
      }
    } catch (err) {
      console.error("Failed to update saved activity in Supabase:", err);
    }
  }, []);

  return {
    savedActivities,
    savedIds,
    isLoading: isCheckingSavedIds || isFetchingSavedDeals,
    isSaved,
    toggleSaved,
  };
}
