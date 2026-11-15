import StackMap from './StackMap';

/**
 * The window for a case study with no screenshot: its architecture, drawn
 * from the CMS stack, on the product's dark material. The map is sized for
 * a card, so in a window this large it is zoomed (real layout, still crisp
 * text) rather than left small in the middle of the dark.
 */
export default function StackWindow({ techStack }: { techStack: readonly string[] }) {
  return (
    <div className="theme-deep absolute inset-0 flex items-center justify-center overflow-hidden p-5 sm:p-10">
      <StackMap
        techStack={techStack}
        layout="flow"
        className="w-full max-w-[42rem] md:[zoom:1.35] lg:[zoom:1.6] xl:[zoom:1.75]"
      />
    </div>
  );
}
