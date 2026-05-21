"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Heart,
  MapPin,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { SavedActivitiesSkeleton } from "@/components/SavedActivitiesSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildActivityLoadingHref,
  buildPlanAroundQuery,
} from "@/lib/activityPlanning";
import { useSavedActivities } from "@/lib/hooks/useSavedActivities";

export default function SavedPage() {
  const router = useRouter();
  const { savedActivities, isLoading, toggleSaved } = useSavedActivities();

  const planAroundActivity = (activity: (typeof savedActivities)[number]) => {
    router.push(buildActivityLoadingHref(buildPlanAroundQuery(activity)));
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
                Saved
              </p>
              <h1 className="font-serif text-3xl italic text-primary sm:text-5xl">
                Your saved activities
              </h1>
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-52" />
            ) : (
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {savedActivities.length} saved pick
                {savedActivities.length === 1 ? "" : "s"} from Discover.
              </p>
            )}
          </div>

          {isLoading ? (
            <SavedActivitiesSkeleton />
          ) : savedActivities.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedActivities.map((activity) => (
                <article
                  key={activity.id}
                  className="overflow-hidden rounded-lg border border-red-100 bg-[#fffdf8] shadow-[0_10px_24px_rgba(93,28,28,0.1)]"
                >
                  <div className="relative h-56 bg-red-50">
                    <Image
                      src={activity.image}
                      alt={activity.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="object-cover"
                    />
                    <Badge className="absolute left-3 top-3 bg-[#d72d2d] text-white">
                      {activity.category}
                    </Badge>
                    <button
                      type="button"
                      aria-label={`Unsave ${activity.title}`}
                      onClick={() => toggleSaved(activity.id)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#d72d2d] shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <h2 className="font-serif text-2xl italic leading-tight text-primary">
                        {activity.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-primary/80">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 shrink-0 text-[#d72d2d]" />
                        <span className="min-w-0 truncate">{activity.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-[#d72d2d]" />
                        <span className="min-w-0 truncate">{activity.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-[#d72d2d]" />
                        <span className="min-w-0 truncate">
                          {activity.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {activity.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-red-200 bg-white/70 text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => planAroundActivity(activity)}
                        className="h-10 flex-1 rounded-full bg-[#d72d2d] text-white hover:border-red-900 hover:bg-[#bd2424]"
                      >
                        Plan around this
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSaved(activity.id)}
                        className="h-10 w-10 rounded-full border-red-200 text-[#d72d2d] hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove saved activity</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-red-200 bg-[#fffdf8] px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d72d2d]">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="font-serif text-2xl italic text-primary">
                No saved activities yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Save activities from Discover to build a shortlist for later.
              </p>
              <Button asChild className="mt-5 rounded-full bg-[#d72d2d] text-white hover:bg-[#bd2424]">
                <Link href="/">Browse Discover</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
