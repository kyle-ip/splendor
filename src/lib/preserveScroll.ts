/**
 * Run a state update without letting the browser jump the viewport
 * when layout above/below the click target changes.
 */
export function preserveScroll(run: () => void) {
  const y = window.scrollY;
  run();
  const restore = () => {
    if (window.scrollY !== y) window.scrollTo(0, y);
  };
  // After React's sync work / microtasks, then after layout & paint.
  queueMicrotask(restore);
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
}
