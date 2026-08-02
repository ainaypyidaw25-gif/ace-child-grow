// Flat illustration per developmental domain, shown wherever an activity has no
// approved media yet.
//
// Why drawn SVG rather than photos or generated images: a scene is ~1 KB, so
// all sixteen ship in the bundle and work offline on the slow connections this
// app targets; the artwork is original (no licensing to clear, no real
// children's faces); and it uses the design tokens, so every card looks like
// one system. When a real, professionally approved asset is attached through
// the CMS (libraryMedia), the screens already prefer it — this is the default,
// not a replacement for the media pipeline.
//
// The art is decorative: the adjacent title carries the meaning, so every scene
// renders aria-hidden.

import { DOMAIN_KEYS } from '../content/taxonomy';

export type DomainArtKey = (typeof DOMAIN_KEYS)[number];

/** Unknown or missing domains fall back to the generic play scene. */
export function resolveArtKey(domainKey?: string | null): DomainArtKey {
  return domainKey && (DOMAIN_KEYS as readonly string[]).includes(domainKey)
    ? (domainKey as DomainArtKey)
    : 'play';
}

// Scene backgrounds. Soft tints of the design tokens; sleep is deliberately the
// one dark card (night) so the set reads as a family, not a grid of sameness.
const BG: Record<DomainArtKey, string> = {
  gross_motor: '#E7F5EF',
  fine_motor: '#FDF3CF',
  speech: '#FFECF2',
  language: '#E7F5EF',
  communication: '#F0EAFF',
  cognitive: '#F4F7F3',
  problem_solving: '#E7F5EF',
  social: '#FDF3CF',
  emotional: '#FFECF2',
  self_help: '#E7F5EF',
  play: '#F4F7F3',
  nutrition: '#FFF1E2',
  sleep: '#1E5A52',
  safety: '#E7F5EF',
  daily_routine: '#FFF6DC',
  school_readiness: '#F0EAFF',
};

const SCENES: Record<DomainArtKey, JSX.Element> = {
  // Bouncing ball with motion arcs.
  gross_motor: (
    <>
      <ellipse cx="48" cy="72" rx="16" ry="4" fill="#CDE6DB" />
      <circle cx="48" cy="46" r="19" fill="#FFD28A" />
      <path d="M31 41 Q48 53 65 41" stroke="#E8722B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M24 28 Q27 19 35 16" stroke="#73C7A5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M72 28 Q69 19 61 16" stroke="#73C7A5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Nesting-cup pyramid.
  fine_motor: (
    <>
      <rect x="20" y="66" width="56" height="4" rx="2" fill="#E8D9A8" />
      <path d="M24 66 h16 l-2.5 -15 h-11 Z" fill="#4B8F83" />
      <path d="M56 66 h16 l-2.5 -15 h-11 Z" fill="#73C7A5" />
      <path d="M40 51 h16 l-2.5 -15 h-11 Z" fill="#FFD28A" />
      <path d="M60 30 l2 -6 M64 32 l5 -4" stroke="#E8B95A" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // A little face speaking, sound rippling out.
  speech: (
    <>
      <circle cx="38" cy="48" r="17" fill="#FFEAD1" />
      <circle cx="32" cy="44" r="2.2" fill="#18302B" />
      <circle cx="44" cy="44" r="2.2" fill="#18302B" />
      <ellipse cx="38" cy="55" rx="4.5" ry="5.5" fill="#B0543F" />
      <path d="M62 40 q6 8 0 16" stroke="#4B8F83" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M69 35 q9 13 0 26" stroke="#73C7A5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Open picture book.
  language: (
    <>
      <path d="M48 32 C41 27 30 27 24 31 v33 c6 -4 17 -4 24 1 Z" fill="#FFFFFF" stroke="#4B8F83" strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 32 C55 27 66 27 72 31 v33 c-6 -4 -17 -4 -24 1 Z" fill="#FFFFFF" stroke="#4B8F83" strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 39 h12 M30 46 h12 M30 53 h9" stroke="#9DBFB4" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="43" r="5" fill="#FFD28A" />
      <path d="M54 56 q6 -4 12 0" stroke="#73C7A5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Two speech bubbles taking turns.
  communication: (
    <>
      <rect x="16" y="24" width="36" height="24" rx="11" fill="#4B8F83" />
      <path d="M28 47 l-3 9 10 -7 Z" fill="#4B8F83" />
      <circle cx="28" cy="36" r="2.4" fill="#FBFAF5" />
      <circle cx="36" cy="36" r="2.4" fill="#FBFAF5" />
      <circle cx="44" cy="36" r="2.4" fill="#FBFAF5" />
      <rect x="44" y="48" width="36" height="24" rx="11" fill="#FFD28A" />
      <path d="M68 71 l3 9 -10 -7 Z" fill="#FFD28A" />
      <path d="M52 60 h20" stroke="#8A6A24" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  // Shape blocks lined up on the floor.
  cognitive: (
    <>
      <rect x="18" y="66" width="60" height="4" rx="2" fill="#DDE7E2" />
      <circle cx="30" cy="56" r="10" fill="#73C7A5" />
      <rect x="44" y="46" width="20" height="20" rx="4" fill="#4B8F83" />
      <path d="M78 66 h-12 l6 -16 Z" fill="#FFD28A" />
    </>
  ),
  // Puzzle piece with a knob and a socket.
  problem_solving: (
    <>
      <rect x="28" y="30" width="40" height="40" rx="7" fill="#D8CCFF" />
      <circle cx="48" cy="30" r="7" fill="#D8CCFF" />
      <circle cx="68" cy="50" r="7" fill="#D8CCFF" />
      <circle cx="48" cy="70" r="7" fill="#E7F5EF" />
      <circle cx="41" cy="45" r="2.4" fill="#5F4CA8" />
      <circle cx="55" cy="45" r="2.4" fill="#5F4CA8" />
      <path d="M41 56 q7 5 14 0" stroke="#5F4CA8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  ),
  // Two friends and a shared heart.
  social: (
    <>
      <circle cx="36" cy="50" r="15" fill="#FFEAD1" />
      <circle cx="31" cy="47" r="2" fill="#18302B" />
      <circle cx="41" cy="47" r="2" fill="#18302B" />
      <path d="M31 54 q5 4 10 0" stroke="#18302B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="62" cy="55" r="12" fill="#FFDCB8" />
      <circle cx="58" cy="52" r="1.8" fill="#18302B" />
      <circle cx="66" cy="52" r="1.8" fill="#18302B" />
      <path d="M58 58 q4 3.5 8 0" stroke="#18302B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 27 c-2.5 -2.8 -7 -1 -7 2.4 c0 2.8 3.5 5.2 7 7.6 c3.5 -2.4 7 -4.8 7 -7.6 c0 -3.4 -4.5 -5.2 -7 -2.4 Z" fill="#E76F8E" />
    </>
  ),
  // A heart with a gentle face.
  emotional: (
    <>
      <path d="M48 74 C29 59 22 46 29 37 c5 -7 15 -6 19 2 c4 -8 14 -9 19 -2 c7 9 0 22 -19 37 Z" fill="#E76F8E" />
      <circle cx="41" cy="46" r="2.4" fill="#FBFAF5" />
      <circle cx="55" cy="46" r="2.4" fill="#FBFAF5" />
      <path d="M41 54 q7 5 14 0" stroke="#FBFAF5" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  ),
  // A child's bowl with the spoon standing in it, learning to self-feed.
  self_help: (
    <>
      <rect x="24" y="66" width="48" height="4" rx="2" fill="#CDE6DB" />
      <path d="M26 48 a22 18 0 0 0 44 0 Z" fill="#4B8F83" />
      <ellipse cx="48" cy="48" rx="22" ry="5.5" fill="#5FA396" />
      <g transform="rotate(-18 60 34)">
        <rect x="57.5" y="20" width="5" height="26" rx="2.5" fill="#FFD28A" />
        <ellipse cx="60" cy="48" rx="6" ry="7" fill="#FFD28A" />
      </g>
      <path d="M36 30 q-2 -5 1 -8" stroke="#9DBFB4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Three-block stacking tower, mid-build.
  play: (
    <>
      <rect x="22" y="70" width="52" height="4" rx="2" fill="#DDE7E2" />
      <rect x="33" y="56" width="30" height="14" rx="4" fill="#4B8F83" />
      <rect x="36" y="43" width="24" height="12" rx="4" fill="#FFD28A" />
      <rect x="39" y="31" width="18" height="11" rx="4" fill="#73C7A5" />
      <path d="M64 26 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 Z" fill="#E8B95A" />
      <path d="M30 24 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 Z" fill="#E76F8E" />
    </>
  ),
  // Fruit in reach: apple and banana.
  nutrition: (
    <>
      <rect x="22" y="66" width="52" height="4" rx="2" fill="#EDD9C2" />
      <circle cx="41" cy="52" r="14" fill="#E05B5B" />
      <path d="M41 38 q0 -5 3 -7" stroke="#7A4A2B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="47" cy="33" rx="5.5" ry="3" fill="#4B8F83" transform="rotate(-24 47 33)" />
      <path d="M60 40 q16 7 9 24 q-1.5 4 -6 3 q9 -12 -6 -22 q-1.5 -4 3 -5 Z" fill="#FFD28A" stroke="#E8B95A" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  // Night: crescent moon, stars, a small cloud.
  sleep: (
    <>
      <circle cx="52" cy="46" r="17" fill="#FBFAF5" />
      <circle cx="60" cy="40" r="14" fill="#1E5A52" />
      <circle cx="28" cy="28" r="2" fill="#FBE8A6" />
      <circle cx="72" cy="24" r="1.6" fill="#FBE8A6" />
      <path d="M30 62 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="#FBE8A6" />
      <path d="M52 70 a5 5 0 0 1 10 0 Z M58 70 a6 6 0 0 1 12 0 Z" fill="#3E7A6E" />
    </>
  ),
  // Shield with a check: safe and supervised.
  safety: (
    <>
      <path d="M48 20 L70 29 v17 c0 14 -9.5 22 -22 28 C35.5 68 26 60 26 46 V29 Z" fill="#4B8F83" />
      <path d="M38 48 l7.5 8 L61 39" stroke="#FBFAF5" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Morning sun above the ground.
  daily_routine: (
    <>
      <circle cx="48" cy="44" r="13" fill="#FFD28A" />
      <g stroke="#E8B95A" strokeWidth="3.5" strokeLinecap="round">
        <path d="M48 22 v-5" />
        <path d="M48 66 v5" />
        <path d="M26 44 h-5" />
        <path d="M70 44 h5" />
        <path d="M33 29 l-3.5 -3.5" />
        <path d="M63 29 l3.5 -3.5" />
        <path d="M33 59 l-3.5 3.5" />
        <path d="M63 59 l3.5 3.5" />
      </g>
      <rect x="18" y="74" width="60" height="6" rx="3" fill="#73C7A5" />
    </>
  ),
  // Pencil and paper, ready for school.
  school_readiness: (
    <>
      <rect x="26" y="24" width="32" height="42" rx="5" fill="#FFFFFF" stroke="#C9BCF0" strokeWidth="2.5" />
      <path d="M33 34 h18 M33 42 h18 M33 50 h12" stroke="#C9BCF0" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="rotate(45 64 50)">
        <rect x="60" y="28" width="9" height="34" rx="2" fill="#FFD28A" stroke="#E8B95A" strokeWidth="1.5" />
        <path d="M60 62 h9 l-4.5 9 Z" fill="#FFEAD1" stroke="#E8B95A" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="64.5" cy="68" r="1.6" fill="#18302B" />
      </g>
    </>
  ),
};

/**
 * Decorative domain illustration. Rounded corners come from the background
 * shape itself, so callers only pick a size (e.g. className="h-14 w-14").
 */
export function DomainArt({ domainKey, className }: { domainKey?: string | null; className?: string }) {
  const key = resolveArtKey(domainKey);
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className={className}>
      <rect x="0" y="0" width="96" height="96" rx="26" fill={BG[key]} />
      {SCENES[key]}
    </svg>
  );
}
