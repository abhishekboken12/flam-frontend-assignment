/**
 * Small, original line-art illustrations. All inline SVG, all drawn
 * for this app — no external image requests, nothing that can fail
 * to load or raise copyright concerns.
 */

/** Header mark: a highlighter striking through a card corner. */
export function PencilMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="6" y="9" width="24" height="17" rx="1.5" fill="#faf5e9" stroke="#c98a2b" strokeWidth="1.6" />
      <line x1="10.5" y1="15" x2="24" y2="15" stroke="#ddd2b6" strokeWidth="1.4" />
      <line x1="10.5" y1="19" x2="21" y2="19" stroke="#ddd2b6" strokeWidth="1.4" />
      <g transform="rotate(28 30 24)">
        <rect x="25" y="6" width="6" height="20" rx="1.5" fill="#c98a2b" />
        <rect x="25" y="6" width="6" height="5" rx="1.5" fill="#8f5e14" />
        <polygon points="25,26 31,26 28,32" fill="#8f5e14" />
      </g>
    </svg>
  );
}

/** Idle state: a loose fan of blank cards, waiting to be filled. */
export function EmptyDeckArt({ width = 168 }) {
  return (
    <svg width={width} viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <g transform="rotate(-8 60 70)">
        <rect x="30" y="35" width="90" height="60" rx="4" fill="#232a36" stroke="#3a4256" strokeWidth="1.5" />
      </g>
      <g transform="rotate(4 60 70)">
        <rect x="38" y="30" width="90" height="60" rx="4" fill="#2b3242" stroke="#3a4256" strokeWidth="1.5" />
      </g>
      <rect x="45" y="26" width="94" height="62" rx="4" fill="#faf5e9" stroke="#ddd2b6" strokeWidth="1.5" />
      <line x1="55" y1="42" x2="120" y2="42" stroke="#e4d9c1" strokeWidth="2" />
      <line x1="55" y1="52" x2="129" y2="52" stroke="#e4d9c1" strokeWidth="2" />
      <line x1="55" y1="62" x2="110" y2="62" stroke="#e4d9c1" strokeWidth="2" />
      <circle cx="150" cy="98" r="16" fill="#c98a2b" opacity="0.16" />
      <path d="M143 98 l5 5 l9 -11" stroke="#c98a2b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Perfect quiz round celebration — a small original ribbon badge. */
export function RibbonBadge({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path d="M22 34 L14 52 L24 47 L30 55 L36 47 L46 52 L38 34 Z" fill="#8f5e14" opacity="0.5" />
      <circle cx="30" cy="24" r="17" fill="#c98a2b" />
      <circle cx="30" cy="24" r="17" fill="none" stroke="#8f5e14" strokeWidth="1.5" />
      <path d="M22 24 l5.5 5.5 L39 17" stroke="#faf5e9" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
