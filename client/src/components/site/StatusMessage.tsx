import type { ReactNode } from 'react';

interface StatusMessageProps {
  code?: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}

/** Shared layout for not-found and error states. */
export default function StatusMessage({ code, title, children, actions }: StatusMessageProps) {
  return (
    <section className="container-page py-[clamp(4rem,12vw,9rem)]">
      <div className="max-w-2xl">
        {code && <p className="font-semiwide text-sm font-semibold tabular-nums text-muted-foreground">{code}</p>}
        <h1 className="mt-4 font-wide text-h1 font-semibold">{title}</h1>
        <div className="mt-6 max-w-[34rem] text-lead text-muted-foreground">{children}</div>
        <div className="mt-10 flex flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  );
}
