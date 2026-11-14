import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LIVE_SYSTEMS } from '@/lib/systems';
import OpenChatButton from '@/components/chat/OpenChatButton';
import StackMap from './StackMap';

/**
 * The products running on this site, in the same row style as case
 * studies. Used on the work page while the CMS has nothing published, so
 * the page shows real, working things instead of an empty list.
 */
export default function LiveSystemsList() {
  return (
    <ul className="border-b border-border">
      {LIVE_SYSTEMS.map((system) => (
        <li
          key={system.name}
          className="grid gap-6 border-t border-border py-8 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8 lg:grid-cols-12 lg:py-10"
        >
          <StackMap techStack={system.stack} className="lg:col-span-4" />
          <div className="flex flex-col lg:col-span-8 lg:pl-4">
            <p className="label text-accent">Live on this site</p>
            <h2 className="mt-2 text-title font-medium">{system.name}</h2>
            <p className="mt-3 max-w-[40rem] text-muted-foreground">{system.body}</p>
            <div className="mt-auto pt-6">
              {system.action.kind === 'chat' ? (
                <OpenChatButton mode="chat" className="label inline-flex items-center gap-1.5 transition-colors hover:text-accent">
                  {system.action.label}
                </OpenChatButton>
              ) : (
                <Link
                  href={system.action.href}
                  className="label group inline-flex items-center gap-1.5 transition-colors hover:text-accent"
                >
                  {system.action.label}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                  />
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
