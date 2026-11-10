import Skeleton from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="container-page py-[clamp(2.5rem,6vw,4.5rem)]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>
      <Skeleton className="h-10 w-56" />
      <div className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-10">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-6">
            <Skeleton className="h-6 w-24" />
            <div className="mt-6 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
