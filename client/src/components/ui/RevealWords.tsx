/**
 * Splits text into words that brighten as they scroll into the middle of
 * the view (CSS scroll-driven animation, see `.reveal-word`). Without
 * support, or with reduced motion, the text simply renders at full
 * strength. Server-rendered; no JavaScript.
 */
export default function RevealWords({ text }: { text: string }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="reveal-word">
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}
