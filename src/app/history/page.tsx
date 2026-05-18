"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Clock, Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockPublicItineraries } from "@/lib/mock-api-data";

const budgetLabels = [
  "Broke Student",
  "Budget-Friendly",
  "Moderate",
  "Comfortable",
  "Atas Boss",
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getResultsHref(item: (typeof mockPublicItineraries)[number]) {
  return `/results?results=${encodeURIComponent(
    JSON.stringify(item.itinerary_data)
  )}`;
}

export default function HistoryPage() {
  const history = mockPublicItineraries;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <MobileNav />

        <main className="container mx-auto max-w-4xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-4xl italic md:text-5xl">
              Search History
            </h1>
            <p className="text-lg text-muted-foreground">
              Mock searches and activity recommendations
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {history.map((item) => (
              <Link key={item.id} href={getResultsHref(item)}>
                <Card className="cursor-pointer transition-all hover:border-cyan-400">
                  <CardHeader>
                    <div className="flex-1">
                      <CardTitle className="mb-2 font-sans text-lg font-medium">
                        {item.query || "Untitled itinerary"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(item.created_at)} -{" "}
                        {formatDate(item.created_at)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {item.activities.map((activity) => (
                          <Badge key={activity} variant="secondary">
                            {activity}
                          </Badge>
                        ))}
                        {item.budget !== undefined && (
                          <Badge variant="outline">
                            {budgetLabels[item.budget]}
                          </Badge>
                        )}
                        {item.num_pax && (
                          <Badge variant="outline">{item.num_pax} pax</Badge>
                        )}
                        {item.mbti && (
                          <Badge variant="outline">{item.mbti}</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Found {item.itinerary_data?.activities?.length || 0}{" "}
                        activities
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {history.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="mb-2 text-lg font-medium">
                    No mock history yet
                  </p>
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Add entries to mock-api-data.ts to populate this page.
                  </p>
                  <Button asChild>
                    <Link href="/">Start Planning</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
