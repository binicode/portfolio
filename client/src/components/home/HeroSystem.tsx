import ButtonLink from '@/components/ui/ButtonLink';
import StackDrawing from './StackDrawing';
import SystemExplorer from './SystemExplorer';
import CursorReadout from './CursorReadout';

/**
 * Home hero and stack explorer in one pinned scene.
 *
 * With scroll-driven animation support (and motion allowed), the stage is
 * sticky inside a tall section: the intro fades out, then the drawing
 * frame zooms and fades in from nothing to fill the stage, then the layer
 * explorer appears. Everything is CSS (globals.css, "Hero system"),
 * transform and opacity only.
 *
 * Without support, or with reduced motion, the same markup lays out as a
 * normal page: intro, drawing, explorer.
 */
export default function HeroSystem() {
  return (
    <section aria-labelledby="hero-title" className="hs theme-ink hero-glow">
      <div className="hs-stage">
        <div aria-hidden="true" className="hs-guides">
          <div className="container-page h-full">
            <div className="column-guides h-full border-x border-foreground/[0.06]" />
          </div>
        </div>
        <span aria-hidden="true" className="hs-side hs-side-left">
          Structures
        </span>
        <span aria-hidden="true" className="hs-side hs-side-right">
          Software
        </span>

        <div className="hs-intro container-page">
          <h1 id="hero-title" className="mx-auto max-w-[16ch] text-h1 font-medium">
            Software engineered to hold up.
          </h1>
          <p className="mx-auto mt-6 max-w-[30rem] text-muted-foreground sm:text-lead">
            I design and build web apps and SaaS products, from interface to database.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="#work">See the work</ButtonLink>
            <ButtonLink href="/saas" variant="secondary">
              Explore the SaaS
            </ButtonLink>
          </div>
        </div>

        <SystemExplorer
          head={
            <h2 className="text-h3 font-medium sm:text-title">Every layer carries the next.</h2>
          }
        >
          <div className="hs-frame">
            <div className="hs-frame-inner">
              <div className="hs-drawing-box">
                <StackDrawing className="hs-drawing" />
              </div>
            </div>
          </div>
        </SystemExplorer>

        <CursorReadout />
      </div>
    </section>
  );
}
