import { Skeleton } from "@/components/ui/skeleton";

export function SavedActivitiesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-lg border border-red-100 bg-[#fffdf8] shadow-[0_10px_24px_rgba(93,28,28,0.1)]"
        >
          <div className="relative h-56 bg-red-50">
            <Skeleton className="h-full w-full rounded-none" />
            <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/75" />
            <Skeleton className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/75" />
          </div>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="grid gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
