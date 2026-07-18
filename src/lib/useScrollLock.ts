import { useEffect } from 'react';

/**
 * While active, disable scroll anchoring / smooth scroll so layout and
 * focus changes (gem takes, AI turns) do not jump the viewport.
 * Manual scrollbar / wheel scrolling stays fully available.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    const prevAnchor = html.style.overflowAnchor;

    html.style.scrollBehavior = 'auto';
    html.style.overflowAnchor = 'none';
    html.classList.add('viewport-stable');

    return () => {
      html.style.scrollBehavior = prevBehavior;
      html.style.overflowAnchor = prevAnchor;
      html.classList.remove('viewport-stable');
    };
  }, [active]);
}
