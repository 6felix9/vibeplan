"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
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
import { cn } from "@/lib/utils";

type HomeActivity = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  price: string;
  time: string;
  location: string;
  discount?: string;
  vibe: string;
  tags: string[];
  imageClass: string;
  noteClass: string;
};

const activities: HomeActivity[] = [
  {
    id: "midnight-pottery",
    title: "Midnight Pottery Jam",
    category: "Artsy",
    description:
      "Clay, playlists, and a tiny dessert bar after dark. Good for dates that need less talking and more making.",
    image:
      "https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=900&q=80",
    price: "$28 per pax",
    time: "Fri, 8:30 PM",
    location: "Tiong Bahru Studio",
    discount: "2-for-1 after 8 PM",
    vibe: "Hands-on, low pressure, cozy",
    tags: ["Date", "Indoor", "Workshop"],
    imageClass: "h-28 sm:h-48",
    noteClass: "rotate-[-1.5deg]",
  },
  {
    id: "rooftop-cinema",
    title: "Rooftop Cinema Picnic",
    category: "Event",
    description:
      "Outdoor movie night with beanbags, skyline views, and snack bundles cheaper than the usual dinner plan.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    price: "$18 entry",
    time: "Sat, 7:15 PM",
    location: "Bugis Rooftop",
    discount: "Student tickets available",
    vibe: "Breezy, cinematic, casual",
    tags: ["Movie", "Outdoor", "Promo"],
    imageClass: "h-32 sm:h-60",
    noteClass: "rotate-[1deg]",
  },
  {
    id: "ramen-stamp",
    title: "Hidden Ramen Stamp Trail",
    category: "Food",
    description:
      "Three tiny ramen counters, one stamp card, and a free gyoza reward if you finish the route.",
    image:
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=900&q=80",
    price: "$12-$22",
    time: "Daily, lunch onward",
    location: "Orchard to Dhoby Ghaut",
    discount: "Free side on final stop",
    vibe: "Tasty, walkable, a little competitive",
    tags: ["Food", "Walk", "Discount"],
    imageClass: "h-24 sm:h-44",
    noteClass: "rotate-[0.5deg]",
  },
  {
    id: "neon-bouldering",
    title: "Neon Bouldering Night",
    category: "Sports",
    description:
      "Beginner-friendly climbing with glow holds, rental shoes, and instructors walking the floor.",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80",
    price: "$24 with rentals",
    time: "Wed, 6:00 PM",
    location: "Kallang",
    vibe: "Active, social, beginner-safe",
    tags: ["Fitness", "Group", "Indoor"],
    imageClass: "h-[7.5rem] sm:h-56",
    noteClass: "rotate-[-0.5deg]",
  },
  {
    id: "indie-market",
    title: "Indie Makers Market",
    category: "Shopping",
    description:
      "Local candles, zines, ceramics, thrift racks, and a coffee cart tucked into the back lane.",
    image:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
    price: "Free entry",
    time: "Sun, 11:00 AM",
    location: "Joo Chiat",
    discount: "Bundle deals at 4 stalls",
    vibe: "Browsey, sunny, easy to leave",
    tags: ["Market", "Thrift", "Cafe"],
    imageClass: "h-28 sm:h-48",
    noteClass: "rotate-[1.5deg]",
  },
  {
    id: "mystery-dessert",
    title: "Mystery Dessert Counter",
    category: "Offer",
    description:
      "A rotating secret plated dessert menu. Tell them your mood and they pick the flavor profile.",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
    price: "$9-$16",
    time: "Thu-Sun, 3:00 PM",
    location: "Haji Lane",
    discount: "15% off before 5 PM",
    vibe: "Sweet, spontaneous, low commitment",
    tags: ["Dessert", "Cafe", "Deal"],
    imageClass: "h-[7.5rem] sm:h-56",
    noteClass: "rotate-[-1deg]",
  },
  {
    id: "sunrise-kayak",
    title: "Sunrise Kayak Loop",
    category: "Outdoor",
    description:
      "Calm-water route with guide, dry bag, and breakfast kopi at the finish point.",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    price: "$35 per pax",
    time: "Sat, 6:45 AM",
    location: "Punggol Waterway",
    vibe: "Fresh air, quiet, worth waking up",
    tags: ["Outdoor", "Morning", "Water"],
    imageClass: "h-36 sm:h-72",
    noteClass: "rotate-[0.75deg]",
  },
  {
    id: "arcade-hour",
    title: "Retro Arcade Hour",
    category: "Games",
    description:
      "Unlimited tokens for a one-hour window, with old fighting cabinets and rhythm games in the back.",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    price: "$14 pass",
    time: "Mon-Thu, 5:00 PM",
    location: "Somerset",
    discount: "Weekday off-peak pass",
    vibe: "Fast, nostalgic, group-friendly",
    tags: ["Games", "Indoor", "Budget"],
    imageClass: "h-24 sm:h-40",
    noteClass: "rotate-[-1.25deg]",
  },
  {
    id: "gallery-afterhours",
    title: "Gallery Afterhours",
    category: "Culture",
    description:
      "Late gallery entry, mini curator talks, and a quiet courtyard bar with mocktails under $10.",
    image:
      "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=900&q=80",
    price: "$10 entry",
    time: "Fri, 7:00 PM",
    location: "Civic District",
    vibe: "Polished, calm, conversation-ready",
    tags: ["Museum", "Night", "Artsy"],
    imageClass: "h-[7.5rem] sm:h-52",
    noteClass: "rotate-[1.25deg]",
  },
];

const categoryFilters = [
  "All",
  ...Array.from(new Set(activities.map((activity) => activity.category))),
];

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

export function HomeDiscover() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity | null>(
    null
  );

  const featuredActivities = useMemo(() => {
    if (selectedCategory === "All") return activities;
    return activities.filter((activity) => activity.category === selectedCategory);
  }, [selectedCategory]);

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
            {categoryFilters.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(category)}
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
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {featuredActivities.length} pick{featuredActivities.length === 1 ? "" : "s"} matching your filter.
            </p>
          </div>

          <div className="columns-2 gap-2.5 sm:columns-3 sm:gap-4 xl:columns-4">
            {featuredActivities.map((activity, index) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => setSelectedActivity(activity)}
                className={cn(
                  "group mb-2.5 w-full break-inside-avoid rounded-lg border border-red-100 bg-[#fffdf8] p-1.5 text-left shadow-[0_10px_24px_rgba(93,28,28,0.1)] transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:border-red-300 hover:shadow-[0_18px_44px_rgba(93,28,28,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 sm:mb-4 sm:p-2.5",
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

                  <div className="grid gap-1 text-[11px] leading-tight text-primary/80 sm:text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Tag className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="min-w-0 truncate">{activity.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="min-w-0 truncate">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3 w-3 shrink-0 text-[#d72d2d]" />
                      <span className="min-w-0 truncate">{activity.location}</span>
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
              </button>
            ))}
          </div>
        </section>
      </main>

      <Sheet
        open={Boolean(selectedActivity)}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-red-100 bg-[#fffdf8] p-0 sm:max-w-xl"
        >
          {selectedActivity && (
            <div>
              <div className="relative h-80 w-full bg-red-50">
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
