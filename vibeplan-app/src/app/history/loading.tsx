import { HistorySkeleton } from "@/components/HistorySkeleton";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <MobileNav />

        <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 md:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-80 sm:h-12 sm:w-[34rem]" />
            </div>
            <Skeleton className="h-4 w-44" />
          </div>

          <HistorySkeleton />
        </main>
      </div>
    </div>
  );
}
