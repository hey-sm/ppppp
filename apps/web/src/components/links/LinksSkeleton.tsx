import { Skeleton } from "@/components/ui/skeleton"

export function LinksSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border bg-card">
          <div className="flex items-start justify-between gap-3 border-b p-6 pb-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-6">
            {[0, 1].map((j) => (
              <div
                key={j}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Skeleton className="size-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}