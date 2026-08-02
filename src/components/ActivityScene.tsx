// A parent-and-child scene for the activity detail page.
//
// DomainArt (the small badge shown in lists) is deliberately abstract — at
// 48–56px an icon reads better than a busy scene. But on the detail page, the
// hero image is the one thing a parent who cannot read the instructions can
// still understand: it needs to show A PARENT AND A CHILD actually doing the
// activity, not a symbol standing in for the topic.
//
// The figures are simple flat shapes — round head, no drawn facial identity
// beyond two dots and a smile — deliberately generic rather than a rendering
// of any real child's face, appropriate for a children's-health app.

import type { ReactNode } from 'react';
import { resolveArtKey, type DomainArtKey } from './DomainArt';

const GROUND_GRASS = '#CFE8D8';
const GROUND_FLOOR = '#EFE6D2';
const SKIN = '#FFD9AE';
const HAIR = '#4A3728';

interface FigureProps {
  cx: number;
  groundY: number;
  scale?: number;
  headScale?: number;
  shirt: string;
  pants?: string;
  hairKind?: 'bun' | 'short' | 'pigtails';
  leftArmAngle?: number;
  rightArmAngle?: number;
}

/**
 * One flat character, built from a handful of rounded rectangles and a
 * circle. Arms are drawn hanging straight down (angle 0) and rotated clockwise
 * around the shoulder — 90° swings the arm to point at the character's own
 * left, 180° points it up, 270° points it right — so every pose below is
 * just an angle pair rather than a hand-drawn limb.
 */
function Figure({
  cx, groundY, scale = 1, headScale = scale, shirt, pants = '#3B4A46',
  hairKind = 'short', leftArmAngle = 10, rightArmAngle = -10,
}: FigureProps) {
  const legH = 26 * scale;
  const torsoH = 30 * scale;
  const headR = 12 * headScale;
  const hipY = groundY - legH;
  const shoulderY = hipY - torsoH + 4 * scale;
  const headCy = shoulderY - headR - 2 * headScale;
  const armW = 6.5 * scale;
  const armLen = torsoH * 0.9;

  return (
    <g>
      <rect x={cx - 8 * scale} y={hipY} width={6.5 * scale} height={legH} rx={3.2 * scale} fill={pants} />
      <rect x={cx + 1.5 * scale} y={hipY} width={6.5 * scale} height={legH} rx={3.2 * scale} fill={pants} />
      <rect x={cx - 13 * scale} y={shoulderY - 4 * scale} width={26 * scale} height={torsoH + 8 * scale} rx={10 * scale} fill={shirt} />
      <rect
        x={cx - 16 * scale - armW / 2} y={shoulderY} width={armW} height={armLen} rx={armW / 2} fill={shirt}
        transform={`rotate(${leftArmAngle} ${cx - 16 * scale} ${shoulderY})`}
      />
      <rect
        x={cx + 16 * scale - armW / 2} y={shoulderY} width={armW} height={armLen} rx={armW / 2} fill={shirt}
        transform={`rotate(${rightArmAngle} ${cx + 16 * scale} ${shoulderY})`}
      />
      <circle cx={cx} cy={headCy} r={headR} fill={SKIN} />
      {hairKind === 'short' && (
        <path d={`M ${cx - headR} ${headCy} a ${headR} ${headR * 0.85} 0 0 1 ${headR * 2} 0 Z`} fill={HAIR} />
      )}
      {hairKind === 'bun' && (
        <>
          <path d={`M ${cx - headR} ${headCy} a ${headR} ${headR * 0.8} 0 0 1 ${headR * 2} 0 Z`} fill={HAIR} />
          <circle cx={cx} cy={headCy - headR * 1.15} r={headR * 0.42} fill={HAIR} />
        </>
      )}
      {hairKind === 'pigtails' && (
        <>
          <path d={`M ${cx - headR * 0.9} ${headCy - headR * 0.3} a ${headR * 0.9} ${headR * 0.7} 0 0 1 ${headR * 1.8} 0 Z`} fill={HAIR} />
          <circle cx={cx - headR * 0.95} cy={headCy + headR * 0.15} r={headR * 0.3} fill={HAIR} />
          <circle cx={cx + headR * 0.95} cy={headCy + headR * 0.15} r={headR * 0.3} fill={HAIR} />
        </>
      )}
      <circle cx={cx - headR * 0.32} cy={headCy + headR * 0.05} r={headR * 0.11} fill="#18302B" />
      <circle cx={cx + headR * 0.32} cy={headCy + headR * 0.05} r={headR * 0.11} fill="#18302B" />
      <path
        d={`M ${cx - headR * 0.28} ${headCy + headR * 0.4} q ${headR * 0.28} ${headR * 0.22} ${headR * 0.56} 0`}
        stroke="#18302B" strokeWidth={headR * 0.1} fill="none" strokeLinecap="round"
      />
    </g>
  );
}

const PARENT_X = 96;
const CHILD_X = 214;
const GROUND_Y = 150;

/** Parent and child both reaching toward a shared object at the centre. */
function ForwardScene({ parentShirt, childShirt, prop, ground = GROUND_FLOOR }: {
  parentShirt: string; childShirt: string; prop: ReactNode; ground?: string;
}) {
  return (
    <>
      <rect x="0" y="148" width="320" height="32" fill={ground} />
      <Figure cx={PARENT_X} groundY={GROUND_Y} scale={1} shirt={parentShirt} hairKind="bun" leftArmAngle={12} rightArmAngle={300} />
      <Figure cx={CHILD_X} groundY={GROUND_Y} scale={0.68} headScale={0.85} shirt={childShirt} hairKind="short" leftArmAngle={50} rightArmAngle={-10} />
      {prop}
    </>
  );
}

/** Parent and child standing, a step apart, exchanging something above them. */
function FacingScene({ parentShirt, childShirt, bubble, ground = GROUND_FLOOR }: {
  parentShirt: string; childShirt: string; bubble: ReactNode; ground?: string;
}) {
  return (
    <>
      <rect x="0" y="148" width="320" height="32" fill={ground} />
      <Figure cx={100} groundY={GROUND_Y} scale={1} shirt={parentShirt} hairKind="bun" />
      <Figure cx={210} groundY={GROUND_Y} scale={0.7} headScale={0.88} shirt={childShirt} hairKind="pigtails" />
      {bubble}
    </>
  );
}

const SCENES: Record<DomainArtKey, ReactNode> = {
  // Parent tossing a ball, child reaching up to catch it.
  gross_motor: (
    <>
      <rect x="0" y="148" width="320" height="32" fill={GROUND_GRASS} />
      <Figure cx={PARENT_X} groundY={GROUND_Y} scale={1} shirt="#4B8F83" hairKind="bun" leftArmAngle={12} rightArmAngle={230} />
      <Figure cx={CHILD_X} groundY={GROUND_Y} scale={0.68} headScale={0.85} shirt="#FFD28A" hairKind="short" leftArmAngle={155} rightArmAngle={205} />
      <circle cx="168" cy="58" r="12" fill="#FFEAD1" stroke="#E8B95A" strokeWidth="2" />
      <path d="M158 54 q10 8 20 0 M158 62 q10 8 20 0" stroke="#E8B95A" strokeWidth="1.6" fill="none" />
      <path d="M186 46 q7 -5 12 -1 M182 74 q4 7 11 6" stroke="#9DBFB4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),

  // Parent points to a low stack of cups; the child (drawn a touch smaller,
  // to read as crouched over them) nests one inside another.
  fine_motor: (
    <ForwardScene
      parentShirt="#2A7355" childShirt="#FBE8A6"
      prop={(
        <g transform="translate(172,140)">
          <path d="M-16 0 h14 l-2 -13 h-10 Z" fill="#4B8F83" />
          <path d="M2 0 h14 l-2 -13 h-10 Z" fill="#73C7A5" />
          <path d="M-7 -13 h14 l-2 -12 h-10 Z" fill="#FFD28A" />
        </g>
      )}
    />
  ),

  // A little sound wave and speech bubble between two faces.
  speech: (
    <FacingScene
      parentShirt="#4B8F83" childShirt="#E68AA0"
      bubble={(
        <>
          <path d="M178 60 h34 a8 8 0 0 1 8 8 v14 a8 8 0 0 1 -8 8 h-16 l-8 9 v-9 h-10 a8 8 0 0 1 -8 -8 v-14 a8 8 0 0 1 8 -8 Z" fill="#FFFFFF" stroke="#4B8F83" strokeWidth="2" />
          <circle cx="192" cy="76" r="2.4" fill="#4B8F83" />
          <circle cx="200" cy="76" r="2.4" fill="#4B8F83" />
          <circle cx="208" cy="76" r="2.4" fill="#4B8F83" />
        </>
      )}
    />
  ),

  // Book held open between them at the centre; both lean in to look at it.
  language: (
    <ForwardScene
      parentShirt="#D8CCFF" childShirt="#FFD28A"
      prop={(
        <g transform="translate(155,90)">
          <path d="M0 -14 C-8 -19 -22 -19 -30 -15 v26 c8 -4 22 -4 30 1 Z" fill="#FFFFFF" stroke="#4B8F83" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M0 -14 C8 -19 22 -19 30 -15 v26 c-8 -4 -22 -4 -30 1 Z" fill="#FFFFFF" stroke="#4B8F83" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M-24 -8 h13 M-24 -1 h13 M-24 6 h9" stroke="#9DBFB4" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="-6" r="4.5" fill="#FFD28A" />
        </g>
      )}
    />
  ),

  // Two speech bubbles above two figures taking turns.
  communication: (
    <FacingScene
      parentShirt="#4B8F83" childShirt="#D8CCFF"
      bubble={(
        <>
          <path d="M64 44 h36 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-20 l-8 8 v-8 h-8 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 Z" fill="#4B8F83" />
          <path d="M78 58 h20" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M212 64 h36 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-8 v8 l-8 -8 h-20 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 Z" fill="#FFD28A" />
          <path d="M226 78 h20" stroke="#8A6A24" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    />
  ),

  // Shape blocks on the floor between them, child pointing them out.
  cognitive: (
    <ForwardScene
      parentShirt="#2A7355" childShirt="#4B8F83"
      prop={(
        <g transform="translate(160,124)">
          <circle cx="-14" cy="0" r="9" fill="#73C7A5" />
          <rect x="0" y="-9" width="18" height="18" rx="3" fill="#4B8F83" />
          <path d="M28 9 h-12 l6 -16 Z" fill="#FFD28A" />
        </g>
      )}
    />
  ),

  // A large puzzle piece both are fitting together at the centre.
  problem_solving: (
    <ForwardScene
      parentShirt="#D8CCFF" childShirt="#73C7A5"
      prop={(
        <g transform="translate(158,96)">
          <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#D8CCFF" />
          <circle cx="0" cy="-16" r="6" fill="#D8CCFF" />
          <circle cx="16" cy="0" r="6" fill="#D8CCFF" />
          <circle cx="-4" cy="-4" r="1.8" fill="#5F4CA8" />
          <circle cx="6" cy="-4" r="1.8" fill="#5F4CA8" />
          <path d="M-4 5 q5 4 10 0" stroke="#5F4CA8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
    />
  ),

  // Two children, playing side by side, a small heart between them.
  social: (
    <>
      <rect x="0" y="148" width="320" height="32" fill={GROUND_FLOOR} />
      <Figure cx={112} groundY={GROUND_Y} scale={0.72} headScale={0.88} shirt="#FFD28A" hairKind="short" leftArmAngle={12} rightArmAngle={300} />
      <Figure cx={200} groundY={GROUND_Y} scale={0.72} headScale={0.88} shirt="#E68AA0" hairKind="pigtails" leftArmAngle={60} rightArmAngle={-10} />
      <path d="M156 78 c-2.4 -2.6 -6.6 -1 -6.6 2.2 c0 2.6 3.3 4.9 6.6 7.2 c3.3 -2.3 6.6 -4.6 6.6 -7.2 c0 -3.2 -4.2 -4.8 -6.6 -2.2 Z" fill="#E76F8E" />
    </>
  ),

  // Parent and child, a step closer than usual, reaching in — a hug forming.
  emotional: (
    <ForwardScene
      parentShirt="#E68AA0" childShirt="#4B8F83"
      prop={(
        <path transform="translate(155,84)" d="M0 18 C-13 8 -18 -1 -12 -8 c4 -4.4 11 -3 13 1.4 c2 -4.4 9 -5.8 13 -1.4 c6 7 1 16 -14 26 Z" fill="#E76F8E" />
      )}
    />
  ),

  // Child at a bowl of food, parent close by, encouraging.
  self_help: (
    <ForwardScene
      parentShirt="#2A7355" childShirt="#FBE8A6"
      prop={(
        <g transform="translate(228,138)">
          <path d="M-16 0 a16 8 0 0 0 32 0 Z" fill="#4B8F83" />
          <ellipse cx="0" cy="0" rx="16" ry="4" fill="#5FA396" />
          <g transform="rotate(-20 10 -10)">
            <rect x="8" y="-24" width="4" height="18" rx="2" fill="#FFD28A" />
            <ellipse cx="10" cy="-26" r="4.4" fill="#FFD28A" />
          </g>
        </g>
      )}
    />
  ),

  // A three-block tower rising between them, a spark on top.
  play: (
    <ForwardScene
      parentShirt="#4B8F83" childShirt="#D8CCFF"
      prop={(
        <g transform="translate(160,124)">
          <rect x="-15" y="-14" width="30" height="14" rx="4" fill="#4B8F83" />
          <rect x="-12" y="-26" width="24" height="12" rx="4" fill="#FFD28A" />
          <rect x="-9" y="-37" width="18" height="11" rx="4" fill="#73C7A5" />
          <path d="M16 -46 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 Z" fill="#E8B95A" />
        </g>
      )}
    />
  ),

  // A piece of fruit offered from parent's hand toward the child.
  nutrition: (
    <ForwardScene
      parentShirt="#FFD28A" childShirt="#73C7A5"
      prop={(
        <g transform="translate(158,96)">
          <circle cx="0" cy="0" r="12" fill="#E05B5B" />
          <path d="M0 -12 q0 -5 3 -7" stroke="#7A4A2B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <ellipse cx="5" cy="-16" rx="5" ry="2.8" fill="#4B8F83" transform="rotate(-24 5 -16)" />
        </g>
      )}
    />
  ),

  // Bedtime: a small bed, the child tucked in, parent bent beside it.
  sleep: (
    <>
      <rect x="0" y="0" width="320" height="180" fill="#0F2A25" />
      <circle cx="266" cy="34" r="16" fill="#F1EFE4" />
      <circle cx="272" cy="30" r="13" fill="#0F2A25" />
      <circle cx="46" cy="26" r="1.6" fill="#FBE8A6" />
      <circle cx="86" cy="44" r="1.2" fill="#FBE8A6" />
      <circle cx="120" cy="22" r="1.6" fill="#FBE8A6" />
      <rect x="0" y="148" width="320" height="32" fill="#0A211D" />
      <rect x="60" y="112" width="150" height="38" rx="8" fill="#3E7A6E" />
      <rect x="60" y="104" width="150" height="16" rx="6" fill="#4B8F83" />
      <circle cx="82" cy="104" r="13" fill={SKIN} />
      <path d="M69 104 a13 11 0 0 1 26 0 Z" fill={HAIR} />
      <circle cx="78" cy="104" r="1.4" fill="#18302B" />
      <circle cx="86" cy="104" r="1.4" fill="#18302B" />
      <Figure cx={228} groundY={150} scale={0.94} shirt="#6B5B95" hairKind="bun" leftArmAngle={10} rightArmAngle={330} />
    </>
  ),

  // Parent and child, hands joined, crossing safely together.
  safety: (
    <>
      <rect x="0" y="148" width="320" height="32" fill={GROUND_GRASS} />
      <Figure cx={128} groundY={GROUND_Y} scale={1} shirt="#1E5A52" hairKind="bun" leftArmAngle={12} rightArmAngle={272} />
      <Figure cx={198} groundY={GROUND_Y} scale={0.68} headScale={0.85} shirt="#FBE8A6" hairKind="short" leftArmAngle={88} rightArmAngle={-10} />
      <g transform="translate(160,42) scale(0.62)">
        <path d="M0 -22 L22 -13 v17 c0 14 -9.5 22 -22 28 c-12.5 -6 -22 -14 -22 -28 v-17 Z" fill="#4B8F83" />
        <path d="M-10 0 l7.5 8 L14 -9" stroke="#FBFAF5" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  ),

  // Sun coming up over the two of them, starting the day together.
  daily_routine: (
    <>
      <rect x="0" y="148" width="320" height="32" fill={GROUND_GRASS} />
      <circle cx="160" cy="46" r="19" fill="#FFD28A" />
      <g stroke="#E8B95A" strokeWidth="3.4" strokeLinecap="round">
        <path d="M160 18 v-7" /><path d="M160 74 v7" />
        <path d="M132 46 h-7" /><path d="M188 46 h7" />
        <path d="M141 27 l-5 -5" /><path d="M179 27 l5 -5" />
        <path d="M141 65 l-5 5" /><path d="M179 65 l5 5" />
      </g>
      <Figure cx={PARENT_X} groundY={GROUND_Y} scale={1} shirt="#FFD28A" hairKind="bun" leftArmAngle={12} rightArmAngle={-12} />
      <Figure cx={CHILD_X} groundY={GROUND_Y} scale={0.68} headScale={0.85} shirt="#4B8F83" hairKind="short" leftArmAngle={190} rightArmAngle={-10} />
    </>
  ),

  // Child with a small school bag, parent waving them off.
  school_readiness: (
    <>
      <rect x="0" y="148" width="320" height="32" fill={GROUND_GRASS} />
      <Figure cx={PARENT_X} groundY={GROUND_Y} scale={1} shirt="#D8CCFF" hairKind="bun" leftArmAngle={12} rightArmAngle={200} />
      <g transform="translate(226,118)">
        <rect x="-9" y="-4" width="18" height="22" rx="6" fill="#B0703E" />
        <rect x="-6" y="-9" width="12" height="8" rx="3" fill="#8F5A32" />
        <path d="M-9 3 q-5 -14 4 -19 M9 3 q5 -14 -4 -19" stroke="#8F5A32" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
      <Figure cx={CHILD_X} groundY={GROUND_Y} scale={0.68} headScale={0.85} shirt="#2A7355" hairKind="short" leftArmAngle={10} rightArmAngle={190} />
    </>
  ),
};

/** Landscape (16:9) parent-and-child scene for the activity detail page. */
export function ActivityScene({ domainKey, className }: { domainKey?: string | null; className?: string }) {
  const key = resolveArtKey(domainKey);
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true" focusable="false" className={className}>
      {SCENES[key]}
    </svg>
  );
}
