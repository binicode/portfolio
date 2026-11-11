import Skeleton from '@/components/ui/Skeleton';

/** Same frame as the dashboard: metric row, then table and mentions. */
export default function DashboardLoading() {
  return (
    <div className="container-page py-[clamp(2.5rem,6vw,4.5rem)]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>
      <Skeleton className="h-10 w-56" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:mt-10 lg:grid-cols-3 md:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-md border border-border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-9 w-32" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-6 h-10 w-full" />
            <Skeleton className="mt-6 h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="rounded-md border border-border bg-card p-5 xl:col-span-8">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-5 xl:col-span-4">
          <Skeleton className="h-6 w-48" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
