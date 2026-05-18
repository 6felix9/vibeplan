"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, DollarSign, Loader2, Map, MapPin, RefreshCw, Tag } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TimelineActivity } from "@/components/TimelineActivity";
import { ItineraryMap } from "@/components/ItineraryMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { mockItinerary } from "@/lib/mock-api-data";

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
  discount?: string;
  source_link?: string;
  source_type?: string;
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
  activities: Activity[];
}

function ResultsContent({ itinerary }: { itinerary: Itinerary }) {
  const router = useRouter();
  const [mapOpen, setMapOpen] = useState(false);

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
              onClick={() => router.push("/history")}
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
                  <ItineraryMap activities={itinerary.activities} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[1fr_minmax(450px,45%)]">
            <div>
              <h1 className="mb-3 font-serif text-xl italic leading-tight sm:mb-4 sm:text-2xl md:mb-6 md:text-4xl lg:text-5xl">
                {itinerary.title}
              </h1>

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

              <div className="space-y-0">
                <h2 className="mb-4 text-lg font-semibold sm:text-xl md:mb-6 md:text-2xl">
                  Your Day Timeline
                </h2>
                {itinerary.activities.map((activity, index) => (
                  <TimelineActivity
                    key={activity.id}
                    activity={activity}
                    isLast={index === itinerary.activities.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-8">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-[calc(100vh-8rem)] min-h-[600px]">
                      <ItineraryMap activities={itinerary.activities} />
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

function ResultsPageWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let itinerary = mockItinerary as Itinerary;
  let error: string | null = null;

  try {
    const resultsParam = searchParams?.get("results");
    itinerary = resultsParam
      ? (JSON.parse(resultsParam) as Itinerary)
      : (mockItinerary as Itinerary);
  } catch (err) {
    console.error("Error loading itinerary:", err);
    error = "Failed to load itinerary";
  }

  if (error || !itinerary) {
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

  return <ResultsContent itinerary={itinerary} />;
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
