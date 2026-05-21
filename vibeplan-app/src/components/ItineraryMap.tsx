"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Layers, MapPin } from "lucide-react";

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
  activeActivityId?: number | null;
  onMarkerSelect?: (activityId: number) => void;
}

type MapStyle = "streets" | "dark" | "satellite";

const MAP_STYLES: Record<MapStyle, string> = {
  streets: "mapbox://styles/mapbox/streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

const ROUTE_SOURCE_ID = "itinerary-route";
const ROUTE_LAYER_ID = "itinerary-route-line";

function isValidCoordinate(activity: Activity) {
  const lat = activity.coordinates?.lat;
  const lng = activity.coordinates?.lng;

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function createMarkerElement(activity: Activity, index: number) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.dataset.activityId = String(activity.id);
  marker.className =
    "group flex h-10 w-10 items-center justify-center rounded-full bg-[#4f46e5] text-xs font-bold text-white shadow-lg ring-4 ring-white/90 transition-all duration-200 hover:scale-110 hover:bg-[#6366f1] focus:outline-none focus:ring-[#2563eb]/40";
  marker.setAttribute("aria-label", `Show ${activity.title} on timeline`);
  marker.textContent = String(index + 1);

  return marker;
}

function createPopupNode(activity: Activity) {
  const wrapper = document.createElement("div");
  wrapper.className = "max-w-56 p-1";

  const content = document.createElement("div");
  content.className = "flex items-start gap-2 text-[#1e293b]";

  const icon = document.createElement("span");
  icon.className = "mt-0.5 h-4 w-4 shrink-0 text-primary";
  icon.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';

  const text = document.createElement("div");
  text.className = "min-w-0";

  const title = document.createElement("p");
  title.className = "truncate text-xs font-bold leading-tight";
  title.textContent = activity.title;

  const location = document.createElement("p");
  location.className = "mt-1 text-[10px] leading-normal text-[#64748b]";
  location.textContent = activity.location;

  text.append(title, location);
  content.append(icon, text);
  wrapper.append(content);

  return wrapper;
}

function setMarkerActive(marker: mapboxgl.Marker, isActive: boolean) {
  const element = marker.getElement();
  element.classList.toggle("scale-125", isActive);
  element.classList.toggle("bg-[#2563eb]", isActive);
  element.classList.toggle("ring-[#2563eb]/30", isActive);
  element.classList.toggle("z-20", isActive);
}

export function ItineraryMap({
  activities,
  activeActivityId,
  onMarkerSelect,
}: ItineraryMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle>("streets");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<number, mapboxgl.Marker>>(new Map());
  const activeActivityIdRef = useRef<number | null | undefined>(activeActivityId);
  const onMarkerSelectRef = useRef(onMarkerSelect);

  const validActivities = useMemo(
    () => activities.filter(isValidCoordinate),
    [activities],
  );

  useEffect(() => {
    activeActivityIdRef.current = activeActivityId;
  }, [activeActivityId]);

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect;
  }, [onMarkerSelect]);

  const syncRoute = useCallback(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const coordinates = validActivities.map((activity) => [
      activity.coordinates!.lng,
      activity.coordinates!.lat,
    ]);
    const routeData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    };
    const existingSource = map.getSource(ROUTE_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(routeData);
    } else {
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: routeData,
      });
    }

    if (!map.getLayer(ROUTE_LAYER_ID)) {
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": mapStyle === "satellite" ? "#f43f5e" : "#2563eb",
          "line-width": 4,
          "line-opacity": validActivities.length > 1 ? 0.9 : 0,
          "line-dasharray": [1.5, 1.5],
        },
      });
    } else {
      map.setPaintProperty(
        ROUTE_LAYER_ID,
        "line-color",
        mapStyle === "satellite" ? "#f43f5e" : "#2563eb",
      );
      map.setPaintProperty(
        ROUTE_LAYER_ID,
        "line-opacity",
        validActivities.length > 1 ? 0.9 : 0,
      );
    }
  }, [mapStyle, validActivities]);

  const fitToActivities = useCallback(() => {
    const map = mapRef.current;

    if (!map || validActivities.length === 0) {
      return;
    }

    if (validActivities.length === 1) {
      const activity = validActivities[0];
      map.easeTo({
        center: [activity.coordinates!.lng, activity.coordinates!.lat],
        zoom: 13,
        duration: 600,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    validActivities.forEach((activity) => {
      bounds.extend([activity.coordinates!.lng, activity.coordinates!.lat]);
    });
    map.fitBounds(bounds, {
      padding: { top: 80, right: 80, bottom: 80, left: 80 },
      maxZoom: 14,
      duration: 700,
    });
  }, [validActivities]);

  const syncMarkers = useCallback(() => {
    const currentMarkers = markersRef.current;
    const validIds = new Set(validActivities.map((activity) => activity.id));

    currentMarkers.forEach((marker, activityId) => {
      if (!validIds.has(activityId)) {
        marker.remove();
        currentMarkers.delete(activityId);
      }
    });

    validActivities.forEach((activity, index) => {
      const lngLat: [number, number] = [
        activity.coordinates!.lng,
        activity.coordinates!.lat,
      ];
      const existingMarker = currentMarkers.get(activity.id);

      if (existingMarker) {
        existingMarker.setLngLat(lngLat);
        existingMarker.getElement().textContent = String(index + 1);
        setMarkerActive(existingMarker, activeActivityIdRef.current === activity.id);
        return;
      }

      const markerElement = createMarkerElement(activity, index);
      markerElement.addEventListener("click", () => {
        onMarkerSelectRef.current?.(activity.id);
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 28,
      }).setDOMContent(createPopupNode(activity));

      const marker = new mapboxgl.Marker({ element: markerElement, anchor: "center" })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(mapRef.current!);

      markerElement.addEventListener("mouseenter", () => marker.togglePopup());
      markerElement.addEventListener("mouseleave", () => marker.togglePopup());
      setMarkerActive(marker, activeActivityIdRef.current === activity.id);
      currentMarkers.set(activity.id, marker);
    });
  }, [validActivities]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!containerRef.current || !token || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const center: [number, number] = validActivities[0]?.coordinates
      ? [validActivities[0].coordinates.lng, validActivities[0].coordinates.lat]
      : [103.8198, 1.3521];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapStyle],
      center,
      zoom: validActivities.length ? 12 : 11,
      attributionControl: true,
      logoPosition: "bottom-left",
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right",
    );

    map.on("load", () => {
      syncRoute();
      syncMarkers();
      fitToActivities();
    });
    map.on("style.load", syncRoute);

    mapRef.current = map;

    const markers = markersRef.current;

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [fitToActivities, mapStyle, syncMarkers, syncRoute, validActivities]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.setStyle(MAP_STYLES[mapStyle]);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    syncRoute();
    syncMarkers();
    fitToActivities();
  }, [fitToActivities, syncMarkers, syncRoute]);

  useEffect(() => {
    markersRef.current.forEach((marker, activityId) => {
      const isActive = activityId === activeActivityId;
      setMarkerActive(marker, isActive);

      if (isActive) {
        const lngLat = marker.getLngLat();
        mapRef.current?.easeTo({
          center: lngLat,
          zoom: Math.max(mapRef.current.getZoom(), 13),
          duration: 500,
        });
      }
    });
  }, [activeActivityId]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Mapbox token required</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the live itinerary map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute right-14 top-4 z-20">
        <button
          type="button"
          className="flex h-[29px] w-[29px] items-center justify-center rounded border border-black/10 bg-white text-[#1e293b] shadow-sm transition-colors hover:bg-slate-50"
          onClick={() => setShowStyleMenu((isOpen) => !isOpen)}
          aria-label="Map styles"
        >
          <Layers className="h-4 w-4" />
        </button>

        {showStyleMenu && (
          <div className="absolute right-0 top-9 z-30 w-32 rounded-md border border-slate-200 bg-white p-1 text-xs font-semibold text-[#1e293b] shadow-lg">
            {(["streets", "dark", "satellite"] as const).map((style) => (
              <button
                key={style}
                type="button"
                className={`w-full rounded px-2.5 py-1.5 text-left capitalize transition-colors ${
                  mapStyle === style
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => {
                  setMapStyle(style);
                  setShowStyleMenu(false);
                }}
              >
                {style}
              </button>
            ))}
          </div>
        )}
      </div>

      {validActivities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 p-6 text-center text-sm font-medium text-[#64748b] backdrop-blur-sm">
          No coordinates available to render route preview.
        </div>
      )}
    </div>
  );
}
