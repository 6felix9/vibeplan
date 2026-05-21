"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Plus, Minus, Compass, Layers } from "lucide-react";

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

export function ItineraryMap({
  activities,
  activeActivityId,
  onMarkerSelect,
}: ItineraryMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle>("streets");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bounds = getBounds(activities);
  const validActivities = activities.filter((activity) => activity.coordinates);



  const points = validActivities.map((activity) => {
    const latRange = bounds ? bounds.maxLat - bounds.minLat || 0.01 : 0.01;
    const lngRange = bounds ? bounds.maxLng - bounds.minLng || 0.01 : 0.01;
    const left = bounds
      ? ((activity.coordinates!.lng - bounds.minLng) / lngRange) * 72 + 14
      : 50;
    const top = bounds
      ? (1 - (activity.coordinates!.lat - bounds.minLat) / latRange) * 72 + 14
      : 50;

    return { activity, left, top };
  });

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handler centered on point (clientX, clientY)
  const handleZoom = (factor: number, clientX?: number, clientY?: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Zoom target relative to container
    const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    const newZoom = Math.max(0.5, Math.min(zoom * factor, 6));

    setPan((prevPan) => ({
      x: cx - ((cx - prevPan.x) / zoom) * newZoom,
      y: cy - ((cy - prevPan.y) / zoom) * newZoom,
    }));
    setZoom(newZoom);
  };

  // Set up a ref for non-passive wheel event listener to prevent page scrolling on zoom
  const handleWheelRef = useRef<(e: WheelEvent) => void>(null);
  
  useEffect(() => {
    handleWheelRef.current = (e: WheelEvent) => {
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      handleZoom(factor, e.clientX, e.clientY);
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      if (handleWheelRef.current) {
        handleWheelRef.current(e);
      }
    };

    container.addEventListener("wheel", onWheelEvent, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheelEvent);
    };
  }, []);

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get style-specific classes
  const getStyleClasses = () => {
    switch (mapStyle) {
      case "dark":
        return {
          bg: "bg-[#111827]",
          water: "fill-[#1e293b]",
          parks: "fill-[#064e3b]/40",
          roads: "stroke-[#334155]",
          roadCasing: "stroke-[#1e293b]",
          route: "stroke-[#38bdf8]",
          routeGlow: "stroke-[#38bdf8]/30",
          textColor: "text-[#f8fafc]",
          controlsBg: "bg-[#1f2937]/90 text-[#f3f4f6] border-[#374151]",
          controlHover: "hover:bg-[#374151]",
          logoColor: "fill-[#f8fafc]",
        };
      case "satellite":
        return {
          bg: "bg-[#142310]",
          water: "fill-[#0b253a]",
          parks: "fill-[#1f3a15]",
          roads: "stroke-[#f1f5f9]/30",
          roadCasing: "stroke-[#0f172a]/20",
          route: "stroke-[#f43f5e]",
          routeGlow: "stroke-[#f43f5e]/35",
          textColor: "text-white",
          controlsBg: "bg-[#1e293b]/95 text-[#f8fafc] border-[#334155]",
          controlHover: "hover:bg-[#334155]",
          logoColor: "fill-white",
        };
      case "streets":
      default:
        return {
          bg: "bg-[#e2e8f0]",
          water: "fill-[#93c5fd]",
          parks: "fill-[#bbf7d0]",
          roads: "stroke-white",
          roadCasing: "stroke-[#cbd5e1]",
          route: "stroke-[#2563eb]",
          routeGlow: "stroke-[#2563eb]/25",
          textColor: "text-[#1e293b]",
          controlsBg: "bg-white/95 text-[#1e293b] border-[#e2e8f0]",
          controlHover: "hover:bg-[#f1f5f9]",
          logoColor: "fill-[#1e293b]",
        };
    }
  };

  const style = getStyleClasses();

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden font-sans select-none transition-colors duration-500 ${style.bg} ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map Content Wrapper (Pannable & Zoomable) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-75 ease-out"
      >
        {/* Dynamic Vector/SVG Cartography Mock */}
        <svg className="absolute inset-0 h-full w-full select-none pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Large Water Body / River */}
          <path
            d="M -100 200 Q 150 150 250 400 T 600 450 T 1200 350 L 1200 900 L -100 900 Z"
            className={`transition-colors duration-500 ${style.water}`}
          />
          
          {/* Secondary lake or bay */}
          <path
            d="M 500 -50 Q 600 150 850 120 T 1100 10 L 1100 -50 Z"
            className={`transition-colors duration-500 ${style.water}`}
          />

          {/* Forest / Park Areas */}
          <path
            d="M 50 50 C 150 20 220 80 180 160 C 120 200 40 180 50 50 Z"
            className={`transition-colors duration-500 ${style.parks}`}
          />
          <path
            d="M 700 220 C 850 180 900 280 820 380 C 720 420 650 320 700 220 Z"
            className={`transition-colors duration-500 ${style.parks}`}
          />
          <path
            d="M 200 600 C 350 580 400 680 320 780 C 220 820 150 720 200 600 Z"
            className={`transition-colors duration-500 ${style.parks}`}
          />

          {/* Road Casings (for thickness / bridge outlines) */}
          <g className={`transition-colors duration-500 ${style.roadCasing}`} strokeWidth="6" fill="none" strokeLinecap="round">
            <path d="M -50 120 Q 300 200 650 180 T 1200 100" />
            <path d="M 200 -50 L 200 900" />
            <path d="M -50 480 Q 400 440 800 520 T 1200 580" />
            <path d="M 100 100 Q 120 300 300 350 T 400 600" />
            <path d="M 500 50 Q 750 400 900 800" />
          </g>

          {/* Roads (White/Gray overlay) */}
          <g className={`transition-colors duration-500 ${style.roads}`} strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M -50 120 Q 300 200 650 180 T 1200 100" />
            <path d="M 200 -50 L 200 900" />
            <path d="M -50 480 Q 400 440 800 520 T 1200 580" />
            <path d="M 100 100 Q 120 300 300 350 T 400 600" />
            <path d="M 500 50 Q 750 400 900 800" />
          </g>
          
          {/* Neighborhood minor grid lines */}
          <g className={`transition-colors duration-500 opacity-60 ${style.roads}`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="1 3">
            <line x1="50" y1="200" x2="350" y2="200" />
            <line x1="120" y1="280" x2="350" y2="280" />
            <line x1="380" y1="50" x2="380" y2="400" />
            <line x1="450" y1="80" x2="450" y2="400" />
            <line x1="600" y1="480" x2="1100" y2="480" />
            <line x1="880" y1="420" x2="880" y2="850" />
          </g>

          {/* Route Connection Path */}
          {points.length > 1 && (
            <g>
              {/* Glow backing */}
              <path
                d={`M ${points.map((p) => `${(p.left / 100) * 1000} ${(p.top / 100) * 1000}`).join(" L ")}`}
                className={`transition-colors duration-500 ${style.routeGlow}`}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Solid Route Line */}
              <path
                d={`M ${points.map((p) => `${(p.left / 100) * 1000} ${(p.top / 100) * 1000}`).join(" L ")}`}
                className={`transition-colors duration-500 ${style.route}`}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
              />
            </g>
          )}
        </svg>

        {/* Activity Markers */}
        {points.map(({ activity, left, top }, index) => {
          const isActive = activeActivityId === activity.id;

          return (
            <button
              key={activity.id}
              type="button"
              className="group absolute pointer-events-auto"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                transformOrigin: "center center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerSelect?.(activity.id);
              }}
              aria-label={`Show ${activity.title} on timeline`}
            >
              {/* Custom Marker Pin */}
              <div className="relative flex items-center justify-center">
                {/* Outer ring glow when active */}
                {isActive && (
                  <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-primary/20 opacity-75" />
                )}
                {/* Pin Bubble */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-4 transition-all duration-300 ${
                    isActive
                      ? "scale-125 bg-[#2563eb] ring-[#2563eb]/30"
                      : mapStyle === "dark"
                      ? "bg-[#0284c7] ring-slate-800/80 hover:bg-[#38bdf8]"
                      : mapStyle === "satellite"
                      ? "bg-[#e11d48] ring-[#1e293b]/70 hover:bg-[#f43f5e]"
                      : "bg-[#4f46e5] ring-white/90 hover:bg-[#6366f1]"
                  }`}
                >
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                {/* Pin Pointer Arrow under the bubble */}
                <div className={`absolute -bottom-1 h-2 w-2 rotate-45 transition-colors duration-300 ${
                  isActive
                    ? "bg-[#2563eb]"
                    : mapStyle === "dark"
                    ? "bg-[#0284c7] group-hover:bg-[#38bdf8]"
                    : mapStyle === "satellite"
                    ? "bg-[#e11d48] group-hover:bg-[#f43f5e]"
                    : "bg-[#4f46e5] group-hover:bg-[#6366f1]"
                }`} />
              </div>

              {/* Custom Mapbox Info Popup */}
              <div
                className={`pointer-events-none absolute left-1/2 top-11 w-56 -translate-x-1/2 rounded-md border p-3 text-left shadow-xl transition-all duration-200 ${
                  isActive
                    ? "opacity-100 translate-y-0 scale-100 block z-30"
                    : "opacity-0 translate-y-1 scale-95 hidden group-hover:block group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 z-20"
                } ${
                  mapStyle === "dark"
                    ? "bg-[#1e293b] border-[#334155] text-white"
                    : mapStyle === "satellite"
                    ? "bg-[#0f172a]/95 border-[#334155] text-white backdrop-blur-sm"
                    : "bg-white border-[#e2e8f0] text-[#1e293b]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">
                      {activity.title}
                    </p>
                    <p className={`mt-1 text-[10px] leading-normal ${mapStyle === "streets" ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                      {activity.location}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mapbox Logo bottom-left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 opacity-90 select-none pointer-events-none">
        <svg viewBox="0 0 40 40" className={`h-5 w-5 ${style.logoColor} transition-colors duration-500`}>
          <path d="M20,0C9,0,0,9,0,20s9,20,20,20s20-9,20-20S31,0,20,0z M20,33.1c-7.2,0-13.1-5.9-13.1-13.1S12.8,6.9,20,6.9 S33.1,12.8,33.1,20S27.2,33.1,20,33.1z M24.2,12.8L20,18.8l-4.2-6.1h-3.6l5.9,8.4l-6.1,8.1h3.6l4.4-6.3l4.4,6.3h3.6l-6.1-8.1 l5.9-8.4H24.2z" />
        </svg>
        <span className={`font-serif text-sm font-black tracking-tighter ${style.textColor} transition-colors duration-500`}>
          mapbox
        </span>
      </div>

      {/* Mapbox Control Panel (top-right) */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        {/* Navigation Controls */}
        <div className={`flex flex-col rounded-md border shadow-md ${style.controlsBg} transition-colors duration-500 overflow-hidden`}>
          <button
            type="button"
            className={`p-2 transition-colors border-b ${style.controlHover}`}
            onClick={() => handleZoom(1.35)}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`p-2 transition-colors border-b ${style.controlHover}`}
            onClick={() => handleZoom(0.65)}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`p-2 transition-colors ${style.controlHover}`}
            onClick={resetMap}
            aria-label="Reset compass"
          >
            <Compass className="h-4 w-4" />
          </button>
        </div>

        {/* Style Selector Trigger */}
        <div className="relative">
          <button
            type="button"
            className={`p-2 rounded-md border shadow-md flex items-center justify-center ${style.controlsBg} ${style.controlHover} transition-colors duration-500`}
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            aria-label="Map styles"
          >
            <Layers className="h-4 w-4" />
          </button>

          {/* Style selector popover */}
          {showStyleMenu && (
            <div className={`absolute right-0 top-10 z-30 w-32 rounded-md border p-1 shadow-lg text-xs font-semibold ${style.controlsBg} transition-colors duration-500`}>
              <button
                type="button"
                className={`w-full rounded px-2.5 py-1.5 text-left transition-colors ${mapStyle === "streets" ? "bg-primary/10 text-primary" : style.controlHover}`}
                onClick={() => {
                  setMapStyle("streets");
                  setShowStyleMenu(false);
                }}
              >
                Streets
              </button>
              <button
                type="button"
                className={`w-full rounded px-2.5 py-1.5 text-left transition-colors ${mapStyle === "dark" ? "bg-primary/10 text-primary" : style.controlHover}`}
                onClick={() => {
                  setMapStyle("dark");
                  setShowStyleMenu(false);
                }}
              >
                Dark
              </button>
              <button
                type="button"
                className={`w-full rounded px-2.5 py-1.5 text-left transition-colors ${mapStyle === "satellite" ? "bg-primary/10 text-primary" : style.controlHover}`}
                onClick={() => {
                  setMapStyle("satellite");
                  setShowStyleMenu(false);
                }}
              >
                Satellite
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute right-4 bottom-4 z-20 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-mono text-white select-none">
        Z: {zoom.toFixed(1)}x
      </div>

      {validActivities.length === 0 && (
        <div className={`absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-medium ${
          mapStyle === "streets" ? "text-[#64748b] bg-slate-50/80" : "text-[#94a3b8] bg-[#0f172a]/80"
        } backdrop-blur-sm`}>
          No coordinates available to render route preview.
        </div>
      )}
    </div>
  );
}
