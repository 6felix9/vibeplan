"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DiscoverSkeleton } from "@/components/DiscoverSkeleton";
import { type HomeActivity } from "@/lib/homeActivities";
import { cn } from "@/lib/utils";
import { useSavedActivities } from "@/lib/hooks/useSavedActivities";

const CATEGORY_KEY = "vibeplan:discover-category";

type SortOrder = "random" | "newest" | "price-asc" | "price-desc" | "a-z";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "newest", label: "Recently Added" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "a-z", label: "A–Z" },
];

function parsePriceValue(price: string): number {
  const match = price.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ""));
}

function buildLoadingHref(query: string) {
  const searchParams = {
    activities: [],
    budget: 2,
    mbti: "",
    spicy: false,
    query,
  };
  const params = new URLSearchParams();
  params.set("data", JSON.stringify(searchParams));
  return `/loading?${params.toString()}`;
}

function shuffleActivities(activities: HomeActivity[]) {
  const shuffled = [...activities];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomValue =
      typeof crypto !== "undefined"
        ? crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
        : Math.random();
    const j = Math.floor(randomValue * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function HomeDiscover({ initialActivities }: { initialActivities: HomeActivity[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity | null>(
    null
  );
  const [activities, setActivities] = useState<HomeActivity[] | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("random");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const { isSaved, toggleSaved } = useSavedActivities();

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setActivities(shuffleActivities(initialActivities));
    });

    return () => cancelAnimationFrame(frameId);
  }, [initialActivities]);

  const categories = useMemo(() => {
    const allCats = initialActivities.map((activity) => activity.category);
    return ["All", ...Array.from(new Set(allCats))];
  }, [initialActivities]);

  useEffect(() => {
    const stored = localStorage.getItem(CATEGORY_KEY);
    if (!stored) return;
    const validCats = new Set(initialActivities.map((a) => a.category));
    if (stored === "All" || validCats.has(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(stored);
    }
  }, [initialActivities]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSortOpen]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    localStorage.setItem(CATEGORY_KEY, category);
  };

  const featuredActivities = useMemo(() => {
    if (!activities) return [];
    const filtered =
      selectedCategory === "All"
        ? activities
        : activities.filter((a) => a.category === selectedCategory);

    if (sortOrder === "random") return filtered;

    const sorted = [...filtered];
    if (sortOrder === "newest") {
      const originalIndex = new Map(initialActivities.map((a, i) => [a.id, i]));
      sorted.sort((a, b) => (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0));
    } else if (sortOrder === "price-asc") {
      sorted.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
    } else if (sortOrder === "price-desc") {
      sorted.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
    } else if (sortOrder === "a-z") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [selectedCategory, activities, sortOrder, initialActivities]);

  const submitSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    router.push(buildLoadingHref(trimmedQuery));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch(query);
  };

  const planAroundActivity = (activity: HomeActivity) => {
    submitSearch(
      `Plan a day around ${activity.title} near ${activity.location}. Keep it ${activity.vibe.toLowerCase()} and include deals if possible.`
    );
  };

  return (
    <>
      <main className="min-h-screen px-2.5 pb-14 pt-5 sm:px-6 sm:pt-7 md:px-10">
        <section className="mx-auto w-full max-w-5xl pb-9 pt-4 sm:pb-12 sm:pt-6">
          <div className="mb-5 flex items-center justify-center gap-2 font-serif text-3xl italic leading-tight text-black sm:mb-6 sm:text-5xl">
            <Sparkles className="h-5 w-5 text-black sm:h-7 sm:w-7" />
            Discover what fits today
          </div>

          <form
            onSubmit={handleSubmit}
            className="group relative isolate flex w-full items-center gap-2 rounded-[24px] border border-red-200 bg-white/85 p-1.5 shadow-[0_18px_56px_rgba(89,28,28,0.12)] backdrop-blur-md transition-all focus-within:border-red-400 focus-within:bg-white sm:p-2"
          >
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-[#d72d2d] sm:h-11 sm:w-11">
              <Search className="h-5 w-5" />
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              required
              placeholder="Find me a date idea under $40, a weekend promo, or something artsy tonight"
              className="relative z-10 h-10 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-11 sm:text-base"
            />
            <Button
              type="submit"
              className="relative z-10 h-10 shrink-0 rounded-full bg-[#d72d2d] px-3 text-white hover:border-red-900 hover:bg-[#bd2424] sm:h-11 sm:px-5"
            >
              <span className="hidden sm:inline">Enter</span>
              <ArrowRight className="h-5 w-5 sm:ml-2" />
            </Button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto px-1 pb-1 sm:mt-6 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectCategory(category)}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
                    isSelected
                      ? "border-[#d72d2d] bg-[#d72d2d] text-white shadow-[0_10px_24px_rgba(215,45,45,0.18)]"
                      : "border-red-100 bg-white/70 text-primary/75 hover:border-red-200 hover:bg-white hover:text-primary"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {activities ? (
        <section className="mx-auto max-w-7xl">
          <div className="mb-4 flex flex-col gap-2 px-1.5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:px-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d72d2d]">
                Fresh picks
              </p>
              <h1 className="font-serif text-2xl italic text-primary sm:text-4xl">
                Activities, promos, and little plans
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                {featuredActivities.length} pick{featuredActivities.length === 1 ? "" : "s"}
              </p>
              <div ref={sortRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((o) => !o)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
                    isSortOpen
                      ? "border-[#d72d2d] bg-[#d72d2d] text-white"
                      : "border-red-100 bg-white/70 text-primary/75 hover:border-red-200 hover:bg-white hover:text-primary"
                  )}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {SORT_OPTIONS.find((o) => o.value === sortOrder)?.label ?? "Sort"}
                  </span>
                  <span className="sm:hidden">Sort</span>
                </button>
                {isSortOpen && (
                  <div className="absolute left-0 top-11 z-30 min-w-[180px] rounded-xl border border-red-100 bg-[#fffdf8] py-1 shadow-lg sm:left-auto sm:right-0">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortOrder(option.value);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-red-50",
                          sortOrder === option.value
                            ? "font-semibold text-[#d72d2d]"
                            : "text-primary/80"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 items-start">
            {featuredActivities.map((activity, index) => (
              <div
                key={activity.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedActivity(activity)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedActivity(activity);
                  }
                }}
                className={cn(
                  "group w-full rounded-lg border border-red-100 bg-[#fffdf8] p-1.5 text-left shadow-[0_10px_24px_rgba(93,28,28,0.1)] transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:border-red-300 hover:shadow-[0_18px_44px_rgba(93,28,28,0.18)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 sm:p-2.5",
                  activity.noteClass
                )}
              >
                <div className="relative mb-2 overflow-hidden rounded-md bg-red-50">
                  <div className={cn("relative w-full", activity.imageClass)}>
                    <Image
                      src={activity.image}
                      alt={activity.title}
                      fill
                      sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 48vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={index < 3}
                    />
                  </div>
                  <div className="absolute left-2 top-2 rounded-full bg-[#d72d2d] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {activity.category}
                  </div>
                  <button
                    type="button"
                    aria-label={isSaved(activity.id) ? `Unsave ${activity.title}` : `Save ${activity.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(activity.id);
                    }}
                    className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#d72d2d] shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                  >
                    <Heart className={cn("h-4 w-4", isSaved(activity.id) ? "fill-current" : "")} />
                  </button>
                  {activity.discount && (
                    <div className="absolute bottom-2 right-2 max-w-[78%] rounded-full bg-white/92 px-2 py-0.5 text-[9px] font-semibold leading-tight text-[#d72d2d] shadow-sm sm:max-w-none sm:text-[10px]">
                      {activity.discount}
                    </div>
                  )}
                </div>

                <div className="relative space-y-2 px-0.5 pb-0.5 sm:px-1">
                  <span className="absolute -right-1 -top-5 h-6 w-9 rotate-6 rounded-sm bg-red-500/15 sm:-top-6 sm:h-7 sm:w-10" />
                  <div>
                    <h2 className="pr-4 font-serif text-base leading-tight text-primary sm:pr-6 sm:text-xl">
                      {activity.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
                      {activity.description}
                    </p>
                  </div>

                  <div className="grid gap-1 overflow-hidden text-[11px] leading-tight text-primary/80 sm:text-xs">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <Tag className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="truncate">{activity.price}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <Clock className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="truncate">{activity.time}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {activity.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-red-200 bg-white/70 px-1.5 py-0 text-[9px] sm:px-2 sm:text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ) : (
          <DiscoverSkeleton />
        )}
      </main>

      <Sheet
        open={Boolean(selectedActivity)}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] w-full overflow-y-auto rounded-t-[20px] border-red-100 bg-[#fffdf8] p-0 sm:h-full sm:max-w-xl sm:rounded-none sm:border-l sm:border-t-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right"
        >
          {selectedActivity && (
            <div className="rounded-t-[20px] overflow-hidden sm:rounded-none">
              <div className="relative h-80 w-full bg-red-50">
                {/* Drag handle indicator for mobile bottom sheet */}
                <div className="absolute left-1/2 top-2.5 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-white/40 sm:hidden" />
                <Image
                  src={selectedActivity.image}
                  alt={selectedActivity.title}
                  fill
                  sizes="(min-width: 640px) 36rem, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />
                <Badge className="absolute bottom-5 left-6 bg-[#d72d2d] text-white">
                  {selectedActivity.category}
                </Badge>
              </div>

              <div className="space-y-6 p-6">
                <SheetHeader>
                  <SheetTitle className="font-serif text-4xl italic leading-tight text-primary">
                    {selectedActivity.title}
                  </SheetTitle>
                  <SheetDescription className="text-base leading-7">
                    {selectedActivity.description}
                  </SheetDescription>
                </SheetHeader>

                <div className="grid gap-3 rounded-lg border border-red-100 bg-white/70 p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-[#d72d2d]" />
                    <span>{selectedActivity.price}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-[#d72d2d]" />
                    <span>{selectedActivity.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[#d72d2d]" />
                    <span>{selectedActivity.location}</span>
                  </div>
                  {selectedActivity.discount && (
                    <div className="flex items-center gap-3 font-medium text-[#d72d2d]">
                      <Sparkles className="h-4 w-4" />
                      <span>{selectedActivity.discount}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Best for
                  </p>
                  <p className="text-base text-primary">
                    {selectedActivity.vibe}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedActivity.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-red-50 text-primary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => planAroundActivity(selectedActivity)}
                  className="h-12 w-full rounded-full bg-[#d72d2d] text-white hover:border-red-900 hover:bg-[#bd2424]"
                >
                  Plan around this
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
