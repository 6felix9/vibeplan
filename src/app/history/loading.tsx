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

          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <article
                key={index}
                className="relative overflow-hidden rounded-xl border border-red-100 bg-[#fffdf8] shadow-[0_8px_20px_rgba(93,28,28,0.04)]"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>

                      <div className="space-y-2">
                        <Skeleton className="h-8 w-4/5 max-w-xl" />
                        <Skeleton className="h-4 w-full max-w-3xl" />
                        <Skeleton className="h-4 w-2/3 max-w-2xl" />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Skeleton className="h-6 w-28 rounded" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded" />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-4 border-t border-red-100/50 pt-4 md:items-end md:border-t-0 md:pl-6 md:pt-0">
                      <div className="flex flex-col gap-1.5 md:items-end">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-36" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-28 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
