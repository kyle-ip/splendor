import type { ReactNode } from 'react';

/** Vine-scroll woodcut corner fleuron (leaf + tendril + gilt tip). Flip for TR/BL/BR. */
function Corner({ className }: { className?: string }) {
  return (
    <svg
      className={`frame-corner-svg ${className ?? ''}`}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
    >
      {/* Outer angle */}
      <path
        className="ink-draw-path"
        pathLength={1}
        d="M4 4h14M4 4v14"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="square"
      />
      {/* Vine scroll */}
      <path
        className="ink-draw-path"
        pathLength={1}
        d="M4 4c6 1.5 10 5 12 11M4 4c1.5 6 5 10 11 12"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Leaf curls */}
      <path
        className="ink-draw-path"
        pathLength={1}
        d="M10 6c3 0.8 5.2 2.8 6 5.5M6 10c0.8 3 2.8 5.2 5.5 6"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        className="ink-draw-path"
        pathLength={1}
        d="M15 8c2.2 1.2 3.5 3 3.8 5.2M8 15c1.2 2.2 3 3.5 5.2 3.8"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Gilt tip dots */}
      <circle cx="4.8" cy="4.8" r="1.35" fill="var(--illum-gilt)" opacity="0.85" />
      <circle cx="17.5" cy="5.5" r="0.9" fill="currentColor" opacity="0.55" />
      <circle cx="5.5" cy="17.5" r="0.9" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/**
 * Double-line woodcut frame with vine-scroll corner fleurons.
 * Use for hero blocks and featured manuscript panels.
 */
export function WoodcutFrame({
  children,
  className = '',
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className={`frame-woodcut relative ${className}`}>
      <Corner className="frame-corner frame-corner-tl text-splendor-ink/80" />
      <Corner className="frame-corner frame-corner-tr text-splendor-ink/80" />
      <Corner className="frame-corner frame-corner-bl text-splendor-ink/80" />
      <Corner className="frame-corner frame-corner-br text-splendor-ink/80" />
      <div className={pad ? 'relative z-[1] p-5 md:p-7' : 'relative z-[1]'}>
        {children}
      </div>
    </div>
  );
}

type InkRuleKnot = 'diamond' | 'leaf' | 'cross';

/** Horizontal ink rule with a center knot — woodcut ledger divider. */
export function InkRule({
  className = '',
  knot = 'diamond',
  double = false,
}: {
  className?: string;
  knot?: InkRuleKnot;
  /** Slightly wider double ink bar for chapter titles */
  double?: boolean;
}) {
  return (
    <div
      className={`ink-rule ${double ? 'ink-rule--double' : ''} ${className}`}
      role="presentation"
    >
      <span className="ink-rule-line" />
      <svg
        className="ink-rule-knot text-splendor-ink/80"
        width={knot === 'leaf' ? 16 : 14}
        height={knot === 'leaf' ? 16 : 14}
        viewBox="0 0 14 14"
        aria-hidden
      >
        {knot === 'diamond' && (
          <>
            <path
              className="ink-draw-path"
              pathLength={1}
              d="M7 1.5L12.5 7 7 12.5 1.5 7Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="7" cy="7" r="1.2" fill="var(--illum-gilt)" opacity="0.9" />
          </>
        )}
        {knot === 'leaf' && (
          <>
            <path
              className="ink-draw-path"
              pathLength={1}
              d="M7 2c2.5 2 4 4.2 4 6.2S9.2 12 7 12 3 10.2 3 8.2 4.5 4 7 2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path
              d="M7 4.5v5.5"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.7"
            />
            <circle cx="7" cy="7" r="1" fill="var(--illum-gilt)" opacity="0.85" />
          </>
        )}
        {knot === 'cross' && (
          <>
            <path
              className="ink-draw-path"
              pathLength={1}
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
            <circle cx="7" cy="7" r="1.35" fill="var(--illum-gilt)" opacity="0.9" />
          </>
        )}
      </svg>
      <span className="ink-rule-line" />
    </div>
  );
}

/** Rubricated eyebrow — vermilion small-caps label (Pentiment-style red ink). */
export function Rubric({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  if (
    children == null ||
    children === false ||
    (typeof children === 'string' && children.trim() === '')
  ) {
    return null;
  }
  return <span className={`rubric ${className}`}>{children}</span>;
}

/**
 * Illuminated drop-cap initial — ink frame, faint lapis/gilt wash, Cinzel letter.
 */
export function IlluminatedInitial({
  letter,
  className = '',
}: {
  letter: string;
  className?: string;
}) {
  const ch = letter.trim().charAt(0) || '·';
  return (
    <span
      className={`illuminated-initial animate-ink-bloom ${className}`}
      aria-hidden
    >
      <span className="illuminated-initial-letter">{ch}</span>
    </span>
  );
}

/** Small brand-corner mark for sidebar header. */
export function WoodcutMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 2h7M2 2v7M2 2l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <path
        d="M18 18h-7M18 18v-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <circle cx="2.8" cy="2.8" r="1" fill="var(--illum-gilt)" opacity="0.8" />
    </svg>
  );
}
