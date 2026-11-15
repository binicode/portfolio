/**
 * Splits text into words that brighten as they scroll into the middle of
 * the view (CSS scroll-driven animation, see `.reveal-word`). Without
 * support, or with reduced motion, the text simply renders at full
 * strength. Server-rendered; no JavaScript.
 *
 * `emphasis`: a phrase inside `text` that carries the promise; its words
 * reveal into the signal colour (an <em> with `emph`).
 */
export default function RevealWords({ text, emphasis }: { text: string; emphasis?: string }) {
  const start = emphasis ? text.indexOf(emphasis) : -1;
  const parts =
    start === -1 || !emphasis
      ? [{ text, emph: false }]
      : [
          { text: text.slice(0, start), emph: false },
          { text: emphasis, emph: true },
          { text: text.slice(start + emphasis.length), emph: false },
        ].filter((part) => part.text.trim() !== '');

  const words = (value: string) => value.trim().split(/\s+/);
  return (
    <>
      {parts.map((part, p) => {
        const spans = words(part.text).map((word, i, all) => (
          <span key={i} className="reveal-word">
            {word}
            {i < all.length - 1 ? ' ' : ''}
          </span>
        ));
        // Keep the space between parts outside the emphasis, unless the next part is punctuation.
        const gap = p < parts.length - 1 && !/^[.,;:!?]/.test(parts[p + 1].text.trim()) ? ' ' : '';
        return part.emph ? (
          <span key={p}>
            <em className="emph">{spans}</em>
            {gap}
          </span>
        ) : (
          <span key={p}>
            {spans}
            {gap}
          </span>
        );
      })}
    </>
  );
}
