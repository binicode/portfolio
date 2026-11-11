import type { ReactNode } from 'react';
import StackCard from './StackCard';
import { STACK, type StackCategory } from './stack';
import InterfaceIllustration from './illustrations/InterfaceIllustration';
import ApiIllustration from './illustrations/ApiIllustration';
import DataIllustration from './illustrations/DataIllustration';
import ServicesIllustration from './illustrations/ServicesIllustration';

const ART: Record<StackCategory['slug'], ReactNode> = {
  interface: <InterfaceIllustration />,
  api: <ApiIllustration />,
  data: <DataIllustration />,
  services: <ServicesIllustration />,
};

/**
 * The four layers of the stack orbiting a fixed centre line.
 *
 * Server-rendered, no client JavaScript. Motion is CSS only (globals.css,
 * "Stack orbit"): each card follows the hero's scroll timeline through four
 * poses on an ellipse — front, left, back, right — so scrolling brings
 * Interface, API, Data and Services forward in turn, and scrolling up
 * reverses it. Transform and opacity only, so it runs on the compositor.
 * Depth comes from real 3D (perspective + translateZ) on wider screens and
 * a flat crossfade on phones.
 *
 * Without scroll-driven animation support, or with reduced motion, the same
 * markup is a plain grid of four cards.
 */
export default function TechnologyStackOrbit() {
  return (
    <div className="orbit">
      {/* The fixed focal point: a centre line through the orbit, as on a structural drawing. */}
      <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" className="orbit-axis">
        <ellipse cx="50" cy="50" rx="22.4" ry="7" className="d-faint" />
        <ellipse cx="50" cy="50" rx="27" ry="9.5" className="d-dashed" />
        <path d="M50 0V100" className="orbit-axis-line" />
      </svg>
      <span aria-hidden="true" className="orbit-axis-label label">
        Full stack
      </span>

      <ol className="orbit-stage">
        {STACK.map((category) => (
          <li key={category.slug} className="orbit-card">
            <StackCard category={category} art={ART[category.slug]} />
            {/* Darkens the card as it recedes; cards stay opaque so nothing shows through. */}
            <span aria-hidden="true" className="orbit-scrim" />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Progress legend under the orbit: the four layers, with an accent bar that
 * travels with the scroll to the one in front. Decorative (aria-hidden): the
 * cards carry the same content for assistive tech.
 */
export function StackLegend() {
  return (
    <div aria-hidden="true" className="hs-legend">
      <span className="hs-legend-indicator" />
      {STACK.map((category) => (
        <div key={category.slug} className="hs-legend-item">
          <span className="hs-legend-key">{category.key}.</span>
          <span className="font-medium text-foreground">{category.name}</span>
          <span className="hs-legend-detail">{category.technologies.map((technology) => technology.name).join(', ')}</span>
        </div>
      ))}
    </div>
  );
}
