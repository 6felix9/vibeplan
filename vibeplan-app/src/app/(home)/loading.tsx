import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { DiscoverSkeleton } from "@/components/DiscoverSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />

        <main className="min-h-screen px-2.5 pb-14 pt-5 sm:px-6 sm:pt-7 md:px-10">
          <section className="mx-auto w-full max-w-5xl pb-9 pt-4 sm:pb-12 sm:pt-6">
            <div className="mb-5 flex items-center justify-center gap-2 font-serif text-3xl italic leading-tight text-black sm:mb-6 sm:text-5xl">
              <Sparkles className="h-5 w-5 text-black sm:h-7 sm:w-7" />
              Discover what fits today
            </div>

            <Skeleton className="h-[3.25rem] w-full rounded-[24px] sm:h-[3.75rem]" />

            <div className="mt-5 flex gap-2 overflow-x-auto px-1 pb-1 sm:mt-6 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
              ))}
            </div>
          </section>

          <DiscoverSkeleton />
        </main>
      </div>
    </div>
  );
}
