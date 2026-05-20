import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const IMAGE_CLASSES = [
  "h-28 sm:h-48",
  "h-32 sm:h-60",
  "h-24 sm:h-44",
  "h-[7.5rem] sm:h-56",
  "h-36 sm:h-72",
  "h-24 sm:h-40",
];

const NOTE_CLASSES = [
  "rotate-[-1.5deg]",
  "rotate-[1deg]",
  "rotate-[0.5deg]",
  "rotate-[-0.5deg]",
  "rotate-[1.5deg]",
  "rotate-[-1deg]",
];

export function DiscoverSkeleton() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-col gap-2 px-1.5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:px-0">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-72" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 items-start">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-full rounded-lg border border-red-100 bg-[#fffdf8] p-1.5 sm:p-2.5",
              NOTE_CLASSES[i % NOTE_CLASSES.length]
            )}
          >
            <Skeleton
              className={cn("mb-2 w-full rounded-md", IMAGE_CLASSES[i % IMAGE_CLASSES.length])}
            />
            <div className="space-y-2 px-0.5 pb-0.5 sm:px-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="space-y-1 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
