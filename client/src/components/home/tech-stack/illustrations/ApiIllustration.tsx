import ArtSheet from './ArtSheet';

/** API: a request crossing validation and an auth check to a route, and the response coming back. */
export default function ApiIllustration() {
  return (
    <ArtSheet>
      {/* Client */}
      <rect x="24" y="48" width="58" height="64" rx="4" className="d-structure d-fill" />
      <path d="M34 64H72M34 74H64M34 84H68" className="d-faint" />

      {/* Request, through two checkpoints */}
      <path d="M82 70H196" className="d-structure" />
      <path d="M190 66L196 70L190 74" className="d-structure" />
      <rect x="126" y="62" width="10" height="16" rx="2" className="d-node" />
      <rect x="156" y="62" width="10" height="16" rx="2" className="d-bubble" />
      <text x="88" y="62" className="d-label">
        GET
      </text>

      {/* Response */}
      <path d="M196 94H82" className="d-dashed" />
      <path d="M88 90L82 94L88 98" className="d-dashed" />
      <text x="88" y="110" className="d-label">
        200
      </text>

      {/* Server and its routes; the matched one in the accent */}
      <rect x="196" y="30" width="100" height="100" rx="4" className="d-structure d-fill" />
      <path d="M206 44H286" className="d-faint" />
      <circle cx="212" cy="60" r="2.5" className="d-node" />
      <path d="M220 60H276" className="d-faint" />
      <circle cx="212" cy="76" r="2.5" className="d-bubble" />
      <path d="M220 76H286" className="d-accent" />
      <circle cx="212" cy="92" r="2.5" className="d-node" />
      <path d="M220 92H266" className="d-faint" />
      <circle cx="212" cy="108" r="2.5" className="d-node" />
      <path d="M220 108H280" className="d-faint" />
    </ArtSheet>
  );
}
