import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-10 rounded-full" />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white">
          <div className="container px-4 md:px-6 text-center space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
            <Skeleton className="h-10 w-full max-w-md mx-auto" />
          </div>
        </section>

        <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <Skeleton className="h-10 w-1/3 mx-auto mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <Skeleton className="h-10 w-1/3 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gray-100 p-6 md:py-12 w-full dark:bg-gray-800">
        <div className="container max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm">
          <div className="grid gap-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid gap-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid gap-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid gap-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid gap-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </footer>
    </div>
  )
}
