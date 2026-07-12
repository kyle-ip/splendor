/** Hand-drawn vine flourish for manuscript margins */
export function VineFlourish({
  className = '',
  mirror = false,
}: {
  className?: string;
  mirror?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M24 8c-2 28-14 42-14 72s16 40 16 72-18 44-14 80c2 18 10 36 12 56"
        stroke="#8a7040"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M24 40c8-2 14 6 10 14m-8 36c-10 0-14 10-8 16m6 48c9-2 12 8 7 14m-5 52c-9 2-12 12-6 16"
        stroke="#5c1f2e"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="28" cy="52" r="3.2" fill="#2a3f5f" opacity="0.5" />
      <circle cx="18" cy="108" r="2.8" fill="#5c1f2e" opacity="0.45" />
      <circle cx="30" cy="168" r="3" fill="#1f6b45" opacity="0.4" />
      <circle cx="17" cy="228" r="2.6" fill="#c4a35a" opacity="0.55" />
      <path
        d="M24 70c6-8 14-6 12 2-4 6-10 4-12-2zm-4 70c-7-6-14-2-10 5 5 5 11 2 10-5zm8 58c6-7 13-3 10 4-4 6-11 3-10-4z"
        fill="#8a7040"
        opacity="0.35"
      />
    </svg>
  );
}

/** Corner knot like illuminated manuscript corners */
export function IlluminatedCorner({
  className = '',
  position = 'tl',
}: {
  className?: string;
  position?: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const rotate =
    position === 'tl'
      ? 0
      : position === 'tr'
        ? 90
        : position === 'br'
          ? 180
          : 270;

  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M4 36V10c0-4 2-6 6-6h26"
        stroke="#c4a35a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 36V14c0-2 1-4 4-4h24"
        stroke="#5c1f2e"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
      <circle cx="12" cy="12" r="3.5" fill="#2a3f5f" opacity="0.7" />
      <circle cx="12" cy="12" r="1.6" fill="#c4a35a" />
      <path
        d="M18 8c4 0 6 3 4 5M8 18c0 4 3 6 5 4"
        stroke="#1f6b45"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ManuscriptDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 max-w-[5rem] bg-gradient-to-r from-transparent to-splendor-gold/70" />
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
        <path
          d="M2 8c4-6 8-6 12 0s8 6 12 0"
          stroke="#8a7040"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="8" r="2.4" fill="#5c1f2e" />
        <circle cx="14" cy="8" r="1" fill="#c4a35a" />
      </svg>
      <span className="h-px flex-1 max-w-[5rem] bg-gradient-to-l from-transparent to-splendor-gold/70" />
    </div>
  );
}
