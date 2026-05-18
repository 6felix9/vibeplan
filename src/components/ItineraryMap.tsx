"use client";

import { MapPin } from "lucide-react";

interface Activity {
  id: number;
  title: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ItineraryMapProps {
  activities: Activity[];
}

function getBounds(activities: Activity[]) {
  const validActivities = activities.filter((activity) => activity.coordinates);

  if (validActivities.length === 0) {
    return null;
  }

  const lats = validActivities.map((activity) => activity.coordinates!.lat);
  const lngs = validActivities.map((activity) => activity.coordinates!.lng);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export function ItineraryMap({ activities }: ItineraryMapProps) {
  const bounds = getBounds(activities);
  const validActivities = activities.filter((activity) => activity.coordinates);

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f4_45%,#f8f2ec_100%)]">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-[12%] top-[18%] h-px w-[80%] rotate-[-18deg] bg-primary/20" />
        <div className="absolute left-[4%] top-[44%] h-px w-[90%] rotate-[12deg] bg-primary/15" />
        <div className="absolute left-[18%] top-[72%] h-px w-[72%] rotate-[-8deg] bg-primary/15" />
        <div className="absolute left-[28%] top-0 h-full w-px rotate-[22deg] bg-primary/10" />
        <div className="absolute right-[24%] top-0 h-full w-px rotate-[-14deg] bg-primary/10" />
      </div>

      <div className="absolute left-4 top-4 rounded-md border border-primary/15 bg-white/85 px-3 py-2 text-xs font-medium text-primary shadow-sm backdrop-blur">
        Mock map
      </div>

      {validActivities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          No coordinates available for this itinerary.
        </div>
      )}

      {validActivities.map((activity, index) => {
        const latRange = bounds ? bounds.maxLat - bounds.minLat || 0.01 : 0.01;
        const lngRange = bounds ? bounds.maxLng - bounds.minLng || 0.01 : 0.01;
        const left = bounds
          ? ((activity.coordinates!.lng - bounds.minLng) / lngRange) * 72 + 14
          : 50;
        const top = bounds
          ? (1 - (activity.coordinates!.lat - bounds.minLat) / latRange) * 72 + 14
          : 50;

        return (
          <div
            key={activity.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-white/80">
              <span className="text-xs font-semibold">{index + 1}</span>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-11 hidden w-52 -translate-x-1/2 rounded-md border border-primary/15 bg-white p-3 text-left shadow-xl group-hover:block">
              <div className="mb-1 flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
