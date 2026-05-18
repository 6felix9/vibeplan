"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { homeActivities } from "@/lib/homeActivities";

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

  const savedActivities = useMemo(
    () => homeActivities.filter((activity) => savedIdSet.has(activity.id)),
    [savedIdSet]
  );

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
