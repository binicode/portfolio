import Link from 'next/link';
import StatRail from './StatRail';
import FeatureTrends from './FeatureTrends';
import PreviewWindow from './PreviewWindow';
import { SAMPLE_STATS } from './sample-stats';

/**
 * A static picture of the Creator Dashboard for the home page: the stat rail
 * and the two trend features on sample data, linking to the live demo. It
 * imports only server modules and passes no chart frame, so it adds no
 * JavaScript to the portfolio's most important page. The frame is `inert`:
 * nothing inside is focusable.
 */
export default function DashboardPoster({ className = '' }: { className?: string }) {
  return (
    <figure className={className}>
      <PreviewWindow inert>
        <div className="@container grid gap-3">
          <StatRail stats={SAMPLE_STATS} />
          <FeatureTrends stats={SAMPLE_STATS} links={false} splitAt="poster" />
        </div>
      </PreviewWindow>
      <figcaption className="mt-3 text-caption text-muted-foreground">
        Sample data.{' '}
        <Link href="/saas#demo" className="link text-foreground">
          Try the live demo
        </Link>
      </figcaption>
    </figure>
  );
}
