/** Push a snapshot and drop anything older than the previous round. */
export function pushCappedHistory<T>(
  history: T[],
  snapshot: T,
  getRound: (s: T) => number,
): T[] {
  const round = getRound(snapshot);
  const minRound = Math.max(0, round - 1);
  return [...history, snapshot].filter((s) => getRound(s) >= minRound);
}
