import type { ReactNode } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import DashboardHeader from './DashboardHeader';

function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>;
}

/**
 * Placeholder for the live dashboard while provider numbers load. It mirrors
 * DashboardBody's three bands with the same container queries (stat rail;
 * the two features; repositories beside the account and activity) and the
 * cards' rendered heights with sample data, so the swap to real numbers
 * doesn't jump. The greeting is real: it needs only the session.
 */
export default function DashboardSkeleton({ name }: { name: string }) {
  return (
    <div aria-busy="true">
      <DashboardHeader name={name} summary={<Skeleton className="h-4 w-72 max-w-full" />}>
        <Skeleton className="h-9 w-56" />
      </DashboardHeader>
      <p role="status" className="sr-only">
        Loading your numbers
      </p>

      <div className="@container mt-6 grid gap-4 lg:mt-8">
        <div className="@container">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border @md:grid-cols-3 @3xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`bg-card px-4 py-3.5 sm:px-5 sm:py-4 ${index === 4 ? 'col-span-2 @md:col-span-2 @3xl:col-span-1' : ''}`}
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-6 w-16 sm:h-[1.625rem]" />
                <Skeleton className="mt-1.5 h-4 w-28 max-w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 @3xl:grid-cols-12">
          {['@3xl:col-span-7', '@3xl:col-span-5'].map((span) => (
            <Card key={span} className={`flex min-h-[18.125rem] flex-col p-4 sm:min-h-[19rem] sm:p-5 ${span}`}>
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="mt-3 h-10 w-40" />
              <Skeleton className="mt-5 w-full flex-1" />
            </Card>
          ))}
        </div>

        <div className="grid items-start gap-4 @5xl:grid-cols-12">
          {/* Repository grid height by its column count: one (phones), two, three, then two again beside the side rail. */}
          <Card className="min-h-[50.375rem] p-4 sm:p-5 @lg:min-h-[36rem] @3xl:min-h-[29.375rem] @5xl:col-span-8 @5xl:min-h-[35.25rem]">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
            <Skeleton className="mt-4 h-32 w-full rounded-lg" />
            <div className="mt-2 grid gap-2 @lg:grid-cols-2">
              {[0, 1, 2, 3].map((tile) => (
                <Skeleton key={tile} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </Card>
          <div className="grid items-start gap-4 @3xl:grid-cols-2 @5xl:col-span-4 @5xl:grid-cols-1">
            <Card className="min-h-[11.5rem] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1.5 h-3 w-36 max-w-full" />
                </div>
              </div>
              <Skeleton className="mt-4 h-8 w-full" />
              <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            </Card>
            <Card className="min-h-[21.25rem] p-4 sm:min-h-[21.75rem] sm:p-5">
              <Skeleton className="h-4 w-32" />
              <div className="mt-4 space-y-4">
                {[0, 1, 2, 3, 4].map((row) => (
                  <Skeleton key={row} className="h-9 w-full" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
