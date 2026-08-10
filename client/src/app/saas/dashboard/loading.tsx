import Skeleton from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-[20px] border border-white/5 bg-card p-6">
            <Skeleton className="h-6 w-24" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
