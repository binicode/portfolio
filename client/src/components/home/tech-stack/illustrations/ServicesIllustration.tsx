import ArtSheet from './ArtSheet';

// Payments, commerce, the model and the embeddings provider around your API.
const PROVIDERS: Array<{ x: number; y: number; to: [number, number] }> = [
  { x: 54, y: 38, to: [128, 66] },
  { x: 266, y: 38, to: [192, 66] },
  { x: 54, y: 122, to: [128, 94] },
  { x: 266, y: 122, to: [192, 94] },
];

/** Services: four providers wired to the API, with a timeout gate on each call and a webhook coming back. */
export default function ServicesIllustration() {
  return (
    <ArtSheet>
      {/* Connections, each with a timeout gate */}
      {PROVIDERS.map(({ x, y, to }) => {
        const mx = (x + to[0]) / 2;
        const my = (y + to[1]) / 2;
        return (
          <g key={`${x}-${y}`}>
            <path d={`M${x} ${y}L${to[0]} ${to[1]}`} className="d-faint" />
            <path d={`M${mx - 3} ${my - 4}L${mx + 3} ${my + 4}`} className="d-structure" />
          </g>
        );
      })}

      {/* Webhook back from the payments provider */}
      <path d="M64 50C80 74 98 80 124 80" className="d-accent" />
      <path d="M118 76L124 80L118 84" className="d-accent" />

      {/* Your API */}
      <rect x="128" y="58" width="64" height="44" rx="4" className="d-structure d-fill" />
      <path d="M140 74H180M140 86H170" className="d-faint" />

      {/* Providers */}
      {PROVIDERS.map(({ x, y }) => (
        <g key={`n${x}-${y}`}>
          <circle cx={x} cy={y} r="14" className="d-node" />
          <circle cx={x} cy={y} r="5" className="d-faint" />
        </g>
      ))}
    </ArtSheet>
  );
}
