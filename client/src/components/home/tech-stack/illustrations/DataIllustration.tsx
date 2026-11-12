import ArtSheet from './ArtSheet';

// Stored embeddings, and the three nearest to the query point.
const POINTS: Array<[number, number]> = [
  [198, 42],
  [272, 32],
  [292, 112],
  [206, 112],
  [228, 128],
  [284, 74],
  [190, 84],
];
const NEAREST: Array<[number, number]> = [
  [216, 66],
  [264, 56],
  [252, 96],
];
const QUERY: [number, number] = [240, 74];

/** Data: the database as stacked disks, and vector search finding the nearest neighbours of a query. */
export default function DataIllustration() {
  return (
    <ArtSheet>
      {/* Database */}
      <ellipse cx="92" cy="34" rx="50" ry="11" className="d-structure d-fill" />
      <path d="M42 34V114M142 34V114" className="d-structure" />
      <path d="M42 114A50 11 0 0 0 142 114" className="d-structure" />
      <path d="M42 61A50 11 0 0 0 142 61M42 88A50 11 0 0 0 142 88" className="d-faint" />

      {/* Into the embedding space */}
      <path d="M146 74H178" className="d-dashed" />

      {/* Search radius and nearest neighbours */}
      <circle cx={QUERY[0]} cy={QUERY[1]} r="34" className="d-dashed" />
      {NEAREST.map(([x, y]) => (
        <path key={`l${x}`} d={`M${QUERY[0]} ${QUERY[1]}L${x} ${y}`} className="d-leader" />
      ))}
      {POINTS.map(([x, y]) => (
        <circle key={`p${x}`} cx={x} cy={y} r="2.5" className="d-node" />
      ))}
      {NEAREST.map(([x, y]) => (
        <circle key={`n${x}`} cx={x} cy={y} r="3" className="d-bubble" />
      ))}
      <circle cx={QUERY[0]} cy={QUERY[1]} r="4" className="fill-accent" />
    </ArtSheet>
  );
}
