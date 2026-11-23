import ButtonLink from '@/components/ui/ButtonLink';
import { PLANNER_NOTE } from '@/lib/site';
import OpenChatButton from '@/components/chat/OpenChatButton';
import { buttonClasses } from '@/components/ui/button-styles';
import TechnologyStackOrbit, { StackLegend } from './tech-stack/TechnologyStackOrbit';
import CursorReadout from './CursorReadout';

/**
 * Home hero and stack orbit in one pinned scene.
 *
 * With scroll-driven animation support (and motion allowed), the stage is
 * sticky inside a tall section: the intro fades out, the frame zooms in
 * from nothing to fill the stage, and further scrolling turns the stack
 * orbit so each layer comes to the front in turn. Everything is CSS
 * (globals.css, "Hero system" and "Stack orbit"), transform and opacity only.
 *
 * Without support, or with reduced motion, the same markup lays out as a
 * normal page: intro, heading, then the four layers as a grid.
 */
export default function HeroSystem() {
  return (
    <section aria-labelledby="hero-title" className="hs theme-sand">
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
            Your product, built to <em className="emph">hold up</em>.
          </h1>
          <p className="mx-auto mt-6 max-w-[30rem] text-muted-foreground sm:text-lead">
            SaaS, AI features and online stores. Two run live on this site.
          </p>
          {/* For a prospective client: start the project, or see proof first. */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <OpenChatButton mode="discovery" className={buttonClasses('accent')}>
              Plan your project
            </OpenChatButton>
            <ButtonLink href="#work" variant="secondary">
              See the work
            </ButtonLink>
          </div>
          <p className="mt-4 text-body-sm text-muted-foreground">{PLANNER_NOTE}</p>
        </div>

        <div className="hs-head">
          <h2 className="text-h2 font-medium">One engineer. The whole stack.</h2>
        </div>

        <div className="hs-frame">
          <div className="hs-frame-inner theme-patina">
            <div className="hs-orbit-box">
              <TechnologyStackOrbit />
            </div>
          </div>
        </div>

        <StackLegend />

        <CursorReadout />
      </div>
    </section>
  );
}
