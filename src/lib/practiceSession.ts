const PREFIX = 'splendor-practice:';

export function saveSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
