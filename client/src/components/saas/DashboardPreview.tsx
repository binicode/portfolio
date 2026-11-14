import DashboardBody from './DashboardBody';
import PreviewWindow from './PreviewWindow';
import { SAMPLE_ACCOUNT, SAMPLE_STATS } from './sample-stats';

/**
 * The live demo on `/saas` and the locked dashboard: the real Creator
 * Dashboard on sample data, rendered by the same DashboardBody subscribers
 * get, so it can never drift from the product. HTML rather than a
 * screenshot: sharp at every size, and it actually works (chart readouts,
 * sorting). The home page uses DashboardPoster instead.
 */
export default function DashboardPreview({ className = '' }: { className?: string }) {
  return (
    <figure id="demo" className={className}>
      <PreviewWindow>
        <DashboardBody stats={SAMPLE_STATS} account={SAMPLE_ACCOUNT} variant="demo" />
      </PreviewWindow>
      <figcaption className="mt-3 text-caption text-muted-foreground">
        Live demo, sample data. Hover the charts.
      </figcaption>
    </figure>
  );
}
