"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, DollarSign, Loader2, Map, MapPin, RefreshCw, Sparkles, Tag } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TimelineActivity } from "@/components/TimelineActivity";
import { ItineraryMap } from "@/components/ItineraryMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildMatchSignals,
  getBudgetTotals,
} from "@/lib/itinerary/ui";
import type { SwapPreference } from "@/lib/itinerary/types";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Activity {
  id: number;
  time: string;
  title: string;
  description: string;
  location: string;
  price: string;
  estimated_price?: number;
  original_price?: number;
  savings?: number;
  discount?: string;
  source_link?: string;
  source_type?: string;
  source_deal_id?: string;
  category?: string;
  tags?: string[];
  coordinates: Coordinates;
}

interface ItinerarySummary {
  intro: string;
  description: string;
  budget: string;
  duration: string;
  area: string;
  perks: string;
}

interface Itinerary {
  title: string;
  summary: ItinerarySummary;
  matchSignals?: {
    budgetFit: string;
    areaFit: string;
    timeFit: string;
    dealQuality: string;
    travelEffort: string;
  };
  activities: Activity[];
}

interface ItineraryConstraints {
  query: string;
  budget: number | null;
  area: string | null;
  date: string | null;
  vibe: string | null;
  categories: string[];
}

interface ResultsPayload {
  itinerary: Itinerary;
  constraints?: ItineraryConstraints | null;
  retrievalMode?: "supabase";
  historyId?: string | null;
}

function BudgetBreakdown({
  itinerary,
  constraints,
}: {
  itinerary: Itinerary;
  constraints?: ItineraryConstraints | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totals = getBudgetTotals(itinerary, constraints?.budget);

  return (
    <div className="mb-6 rounded-lg border bg-background md:mb-8 overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full bg-primary/5 p-2 text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold flex items-center gap-1.5">
              Budget breakdown
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Estimated spend from visible stop prices.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-primary">S${totals.total}</p>
          <p className="text-xs text-muted-foreground">total estimate</p>
        </div>
      </button>

      {isOpen && (
        <div className="border-t p-4 bg-muted/[0.02] space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="divide-y">
            {totals.activities.map(({ activity, estimated, savings }) => (
              <div key={activity.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.price}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">S${estimated}</p>
                  {savings > 0 && (
                    <p className="text-xs text-emerald-700">S${savings} saved</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Original value</p>
              <p className="font-medium">S${totals.originalTotal}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Savings</p>
              <p className="font-medium text-emerald-700">S${totals.savings}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget remaining</p>
              <p className={`font-medium ${totals.remaining !== null && totals.remaining < 0 ? "text-destructive" : ""}`}>
                {totals.remaining === null ? "No budget set" : `S${totals.remaining}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsContent({ payload }: { payload: ResultsPayload }) {
  const router = useRouter();
  const [mapOpen, setMapOpen] = useState(false);
  const [itinerary, setItinerary] = useState(payload.itinerary);
  const [activeActivityId, setActiveActivityId] = useState<number | null>(null);
  const [swappingId, setSwappingId] = useState<number | null>(null);
  const [swapErrors, setSwapErrors] = useState<Record<number, string>>({});
  const constraints = payload.constraints;
  const signals = itinerary.matchSignals ?? buildMatchSignals(itinerary, constraints);

  const selectActivity = (activityId: number) => {
    setActiveActivityId(activityId);
    document
      .getElementById(`timeline-activity-${activityId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSwap = async (activity: Activity, preference: SwapPreference) => {
    setSwappingId(activity.id);
    setSwapErrors((errors) => ({ ...errors, [activity.id]: "" }));

    try {
      const response = await fetch("/api/itinerary/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary,
          constraints,
          targetActivity: activity,
          preference,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.itinerary) {
        throw new Error(data.message || data.error || "No alternative found.");
      }

      setItinerary(data.itinerary);
      setActiveActivityId(activity.id);
    } catch (error) {
      setSwapErrors((errors) => ({
        ...errors,
        [activity.id]:
          error instanceof Error ? error.message : "No alternative found.",
      }));
    } finally {
      setSwappingId(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <MobileNav />

        <main className="container mx-auto max-w-[1600px] p-4 sm:p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3 md:mb-8 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refine Search</span>
            </Button>

            <Sheet open={mapOpen} onOpenChange={setMapOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="ml-auto shrink-0 lg:hidden">
                  <Map className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View Map</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <div className="h-full overflow-hidden rounded-lg border">
                  <ItineraryMap
                    activities={itinerary.activities}
                    activeActivityId={activeActivityId}
                    onMarkerSelect={selectActivity}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-16 lg:grid-cols-[1fr_minmax(450px,45%)]">
            <div>
              <h1 className="mb-3 font-serif text-xl italic leading-tight sm:mb-4 sm:text-2xl md:mb-6 md:text-4xl lg:text-5xl">
                {itinerary.title}
              </h1>

              <div className="mb-4 rounded-lg border bg-primary/[0.03] p-3 md:mb-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Why this plan works
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(signals).map((signal) => (
                    <Badge key={signal} variant="secondary" className="max-w-full text-xs">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>

              <Card className="mb-6 md:mb-8">
                <CardContent className="space-y-3 pt-4 text-sm sm:pt-5 sm:text-base md:space-y-4 md:pt-6">
                  <p className="leading-relaxed">{itinerary.summary.intro}</p>
                  <p className="leading-relaxed">
                    {itinerary.summary.description}
                  </p>

                  <div className="space-y-3 border-t pt-3 sm:pt-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold sm:text-base">
                          Total Estimated Budget
                        </p>
                        <p className="break-words text-sm text-muted-foreground sm:text-base">
                          {itinerary.summary.budget}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold sm:text-base">
                          Duration
                        </p>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {itinerary.summary.duration}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold sm:text-base">
                          Locations
                        </p>
                        <p className="break-words text-sm text-muted-foreground sm:text-base">
                          {itinerary.summary.area}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold sm:text-base">
                          Included Perks
                        </p>
                        <p className="break-words text-sm text-muted-foreground sm:text-base">
                          {itinerary.summary.perks}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <BudgetBreakdown itinerary={itinerary} constraints={constraints} />

              <div className="space-y-0">
                <h2 className="mb-4 text-lg font-semibold sm:text-xl md:mb-6 md:text-2xl">
                  Your Day Timeline
                </h2>
                {itinerary.activities.map((activity, index) => (
                  <TimelineActivity
                    key={activity.id}
                    activity={activity}
                    isLast={index === itinerary.activities.length - 1}
                    isActive={activeActivityId === activity.id}
                    isSwapping={swappingId === activity.id}
                    swapError={swapErrors[activity.id]}
                    onHover={setActiveActivityId}
                    onSelect={setActiveActivityId}
                    onSwap={handleSwap}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="fixed bottom-8 right-8 top-24 z-10 w-[min(45vw,720px)]">
                <Card className="h-full overflow-hidden">
                  <CardContent className="p-0 h-full">
                    <div className="h-full">
                      <ItineraryMap
                        activities={itinerary.activities}
                        activeActivityId={activeActivityId}
                        onMarkerSelect={selectActivity}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function parseResultsPayload(resultsParam: string | null): ResultsPayload {
  if (!resultsParam) {
    throw new Error("Missing itinerary results.");
  }

  const parsed = JSON.parse(resultsParam) as Partial<ResultsPayload>;

  if ("itinerary" in parsed && parsed.itinerary) {
    return parsed as ResultsPayload;
  }

  throw new Error("Invalid itinerary results.");
}

function ResultsPageWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let payload: ResultsPayload | null = null;
  let error: string | null = null;

  try {
    const explicitError = searchParams?.get("error");
    if (explicitError) {
      throw new Error(explicitError);
    }

    const resultsParam = searchParams?.get("results");
    payload = parseResultsPayload(resultsParam);
  } catch (err) {
    console.error("Error loading itinerary:", err);
    error = err instanceof Error ? err.message : "Failed to load itinerary";
  }

  if (error || !payload?.itinerary) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <MobileNav />
          <main className="container mx-auto max-w-[1600px] p-4 sm:p-6 md:p-8">
            <p className="mb-4 text-sm text-red-500 sm:text-base">
              {error || "Failed to load itinerary"}
            </p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Go Home
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return <ResultsContent payload={payload} />;
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1">
            <MobileNav />
            <main className="container mx-auto max-w-[1600px] p-4 sm:p-6 md:p-8">
              <div className="flex flex-col items-center justify-center gap-6 py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="space-y-2 text-center">
                  <h3 className="font-serif text-xl italic text-primary">
                    Crafting your perfect itinerary
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Just a moment while we load your adventure...
                  </p>
                </div>
                <div className="w-full max-w-2xl space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </main>
          </div>
        </div>
      }
    >
      <ResultsPageWrapper />
    </Suspense>
  );
}
