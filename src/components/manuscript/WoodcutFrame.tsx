import type { ReactNode } from 'react';

/** Simple woodcut corner fleuron (leaf + right angle). */
function Corner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 3h10M3 3v10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <path
        d="M3 3l7 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="square"
      />
      <path
        d="M11 4c2.5 1.5 4 3.5 4.5 6.5M4 11c1.5 2.5 3.5 4 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

/**
 * Double-line woodcut frame with corner fleurons.
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
      <Corner className="frame-corner frame-corner-tl text-splendor-ink/75" />
      <Corner className="frame-corner frame-corner-tr text-splendor-ink/75" />
      <Corner className="frame-corner frame-corner-bl text-splendor-ink/75" />
      <Corner className="frame-corner frame-corner-br text-splendor-ink/75" />
      <div className={pad ? 'relative z-[1] p-5 md:p-7' : 'relative z-[1]'}>
        {children}
      </div>
    </div>
  );
}

/** Horizontal ink rule with a diamond knot — woodcut ledger divider. */
export function InkRule({ className = '' }: { className?: string }) {
  return (
    <div className={`ink-rule ${className}`} role="presentation">
      <span className="ink-rule-line" />
      <svg
        className="ink-rule-knot text-splendor-ink/80"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden
      >
        <path
          d="M7 1.5L12.5 7 7 12.5 1.5 7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      </svg>
      <span className="ink-rule-line" />
    </div>
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
    </svg>
  );
}
