import { Skeleton } from "@/components/ui/skeleton"

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeletons */}
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Filters Skeletons */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-5 w-60 mb-6" />

        {/* Events Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-soft border border-neutral-200">
              <Skeleton className="h-48 w-full" />
              <div className="p-5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
