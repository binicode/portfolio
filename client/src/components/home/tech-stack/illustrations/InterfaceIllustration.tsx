import ArtSheet from './ArtSheet';

/** Interface: a page drawn as a plan, one component bracketed in the accent, with its width dimensioned. */
export default function InterfaceIllustration() {
  return (
    <ArtSheet>
      {/* Window and address bar */}
      <rect x="44" y="16" width="232" height="120" rx="5" className="d-structure d-fill" />
      <path d="M44 30H276" className="d-faint" />
      <rect x="116" y="21" width="88" height="5" rx="2.5" className="d-faint" />

      {/* Layout: header, navigation, content blocks; one still streaming in */}
      <rect x="54" y="38" width="212" height="10" rx="1.5" className="d-faint" />
      <rect x="54" y="56" width="44" height="70" rx="1.5" className="d-faint" />
      <rect x="108" y="56" width="74" height="34" rx="1.5" className="d-structure" />
      <rect x="190" y="56" width="76" height="34" rx="1.5" className="d-dashed" />
      <rect x="108" y="98" width="158" height="28" rx="1.5" className="d-faint" />

      {/* The component in focus */}
      <path d="M103 61V51H113M177 51H187V61M103 85V95H113M177 95H187V85" className="d-accent" />

      {/* Width dimension */}
      <path d="M44 148H276M44 144V152M276 144V152" className="d-leader" />
    </ArtSheet>
  );
}
