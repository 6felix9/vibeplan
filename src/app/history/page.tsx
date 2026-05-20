"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  History,
  MapPin,
  Trash2,
  Compass,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockHistoryItineraries, type HistoryItinerary } from "@/lib/mock-history-data";

export default function HistoryPage() {
  const router = useRouter();
  const [historyList, setHistoryList] = useState<HistoryItinerary[]>(mockHistoryItineraries);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleViewItinerary = (item: HistoryItinerary) => {
    // Package up the itinerary data matching the ResultsPayload shape
    const payload = {
      itinerary: item.itinerary,
      constraints: {
        query: item.itinerary.title,
        budget: null,
        area: item.itinerary.summary.area,
        date: item.plannedAt,
        vibe: item.vibe,
        categories: [],
      },
      retrievalMode: "mock",
    };

    const params = new URLSearchParams();
    params.set("results", JSON.stringify(payload));
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <MobileNav />

        <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 md:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d72d2d]">
                History
              </p>
              <h1 className="font-serif text-3xl italic text-primary sm:text-5xl">
                Previously planned itineraries
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {historyList.length} past plan{historyList.length === 1 ? "" : "s"} generated.
            </p>
          </div>

          {historyList.length > 0 ? (
            <div className="flex flex-col gap-4">
              {historyList.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => handleViewItinerary(item)}
                  className="group relative cursor-pointer overflow-hidden border border-red-100 bg-[#fffdf8] shadow-[0_8px_20px_rgba(93,28,28,0.04)] transition-all hover:scale-[1.005] hover:border-red-200 hover:shadow-[0_12px_28px_rgba(93,28,28,0.08)]"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      {/* Left side: Vibe, Title, Description, and Timeline preview */}
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-[#d72d2d] text-white hover:bg-[#bd2424] shrink-0">
                            {item.vibe}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-[#d72d2d] shrink-0" />
                            {item.plannedAt}
                          </span>
                        </div>

                        <div>
                          <h2 className="font-serif text-2xl italic leading-snug text-primary group-hover:text-[#d72d2d] transition-colors">
                            {item.itinerary.title}
                          </h2>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.itinerary.activities.map((activity, index) => (
                            <div key={activity.id} className="flex items-center text-xs">
                              <span className="rounded bg-primary/5 px-2 py-0.5 font-medium text-primary">
                                {activity.title}
                              </span>
                              {index < item.itinerary.activities.length - 1 && (
                                <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground/50 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side: Metadata tags and actions */}
                      <div className="flex flex-col gap-4 border-t border-red-100/50 pt-4 md:border-t-0 md:pt-0 md:items-end shrink-0 md:pl-6">
                        <div className="flex flex-col gap-1.5 text-xs text-primary/80 md:items-end">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-[#d72d2d] shrink-0" />
                            <span className="font-semibold">{item.budgetRange}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#d72d2d] shrink-0" />
                            <span className="max-w-[220px] truncate">{item.itinerary.summary.area}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => handleViewItinerary(item)}
                            className="rounded-full bg-[#d72d2d] text-white hover:bg-[#bd2424]"
                          >
                            View Plan
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <button
                            type="button"
                            aria-label={`Delete itinerary ${item.itinerary.title}`}
                            onClick={(e) => handleDelete(item.id, e)}
                            className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-[#d72d2d] transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-red-200 bg-[#fffdf8] px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d72d2d]">
                <History className="h-7 w-7" />
              </div>
              <h2 className="font-serif text-2xl italic text-primary">
                No planned itineraries yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Plans you generate on Discover will show up here to revisit later.
              </p>
              <Button asChild className="mt-5 rounded-full bg-[#d72d2d] text-white hover:bg-[#bd2424]">
                <Link href="/">
                  <Compass className="mr-2 h-4 w-4" />
                  Plan Your First Trip
                </Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
