"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  DollarSign,
  History,
  MapPin,
  Trash2,
} from "lucide-react";
import { HistorySkeleton } from "@/components/HistorySkeleton";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOrInitializeSessionId } from "@/lib/browserSession";
import type {
  Itinerary,
  ItineraryApiResponse,
  ItineraryConstraints,
} from "@/lib/itinerary/types";

type HistoryRow = {
  id: string;
  created_at: string;
  query: string;
  itinerary: Itinerary;
  constraints: ItineraryConstraints | null;
  retrieval_mode: ItineraryApiResponse["retrievalMode"];
  title: string;
  summary: string | null;
  area: string | null;
  budget: string | null;
  vibe: string | null;
};

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HistoryPage() {
  const router = useRouter();
  const [historyList, setHistoryList] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getOrInitializeSessionId();

    async function loadHistory() {
      try {
        const response = await fetch(`/api/history?sessionId=${encodeURIComponent(id)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load itinerary history.");
        }

        setHistoryList(data.history ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load itinerary history.");
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, sessionId: getOrInitializeSessionId() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete itinerary history.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete itinerary history.");
    }
  };

  const handleViewItinerary = (item: HistoryRow) => {
    const payload: ItineraryApiResponse & { historyId: string } = {
      itinerary: item.itinerary,
      constraints:
        item.constraints ?? {
          query: item.query,
          budget: null,
          area: item.area,
          date: null,
          vibe: item.vibe,
          categories: [],
        },
      retrievalMode: item.retrieval_mode,
      historyId: item.id,
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

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <HistorySkeleton />
          ) : historyList.length > 0 ? (
            <div className="flex flex-col gap-4">
              {historyList.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => handleViewItinerary(item)}
                  className="group relative cursor-pointer overflow-hidden border border-red-100 bg-[#fffdf8] shadow-[0_8px_20px_rgba(93,28,28,0.04)] transition-all hover:scale-[1.005] hover:border-red-200 hover:shadow-[0_12px_28px_rgba(93,28,28,0.08)]"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className="shrink-0 bg-[#d72d2d] text-white hover:bg-[#bd2424]">
                            {item.vibe || item.constraints?.vibe || "Live plan"}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#d72d2d]" />
                            {formatHistoryDate(item.created_at)}
                          </span>
                        </div>

                        <div>
                          <h2 className="font-serif text-2xl italic leading-snug text-primary transition-colors group-hover:text-[#d72d2d]">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {item.summary || item.itinerary.summary.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.itinerary.activities.map((activity, index) => (
                            <div key={activity.id} className="flex items-center text-xs">
                              <span className="rounded bg-primary/5 px-2 py-0.5 font-medium text-primary">
                                {activity.title}
                              </span>
                              {index < item.itinerary.activities.length - 1 && (
                                <ArrowRight className="mx-1 h-3 w-3 shrink-0 text-muted-foreground/50" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-4 border-t border-red-100/50 pt-4 md:items-end md:border-t-0 md:pl-6 md:pt-0">
                        <div className="flex flex-col gap-1.5 text-xs text-primary/80 md:items-end">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 shrink-0 text-[#d72d2d]" />
                            <span className="font-semibold">
                              {item.budget || item.itinerary.summary.budget}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#d72d2d]" />
                            <span className="max-w-[220px] truncate">
                              {item.area || item.itinerary.summary.area}
                            </span>
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
                            aria-label={`Delete itinerary ${item.title}`}
                            onClick={(e) => handleDelete(item.id, e)}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-[#d72d2d]"
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
