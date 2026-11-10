'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { STACK_LEGEND } from './stack-legend';

/**
 * Tabs for the stack drawing's layers (A–D). The active layer is written to
 * `data-layer` on a display:contents wrapper, and CSS dims the other layers
 * in the drawing — no per-frame JavaScript.
 *
 * Auto-advance is driven by the active tab's CSS progress line: when its
 * animation ends, the next tab activates. Hovering or focusing the tabs
 * pauses it (animation-play-state), a manual choice stops it, and with
 * reduced motion there is no animation, so it never advances on its own.
 */
export default function SystemExplorer({ head, children }: { head: ReactNode; children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (index: number, focus = false) => {
    setAuto(false);
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = STACK_LEGEND.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key], true);
    }
  };

  return (
    <div className="contents" data-layer={STACK_LEGEND[active].key}>
      {children}

      <div className="hs-head">
        {head}
        {STACK_LEGEND.map((item, index) => (
          <p
            key={item.key}
            role="tabpanel"
            id={`layer-panel-${item.key}`}
            aria-labelledby={`layer-tab-${item.key}`}
            hidden={index !== active}
            className="hs-panel"
          >
            {item.body}
          </p>
        ))}
      </div>

      <div role="tablist" aria-label="Layers of the stack" onKeyDown={onKeyDown} className="hs-tabs">
        {STACK_LEGEND.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`layer-tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`layer-panel-${item.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className="hs-tab group"
            >
              <span aria-hidden="true" className="hs-tab-progress">
                {selected && auto && (
                  <span
                    className="hs-tab-progress-bar"
                    onAnimationEnd={() => setActive((i) => (i + 1) % STACK_LEGEND.length)}
                  />
                )}
              </span>
              <span className="flex items-baseline gap-2.5">
                <span className="hs-tab-key">{item.key}.</span>
                <span className="font-medium">{item.layer}</span>
              </span>
              <span className="hs-tab-detail">{item.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
