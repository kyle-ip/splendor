import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'splendor-solo-hints';

type SoloHintsApi = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const SoloHintsContext = createContext<SoloHintsApi | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function SoloHintsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readStored);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const api = useMemo(
    () => ({ enabled, setEnabled, toggle }),
    [enabled, setEnabled, toggle],
  );

  return (
    <SoloHintsContext.Provider value={api}>{children}</SoloHintsContext.Provider>
  );
}

export function useSoloHints(): SoloHintsApi {
  const ctx = useContext(SoloHintsContext);
  if (!ctx) {
    throw new Error('useSoloHints must be used within SoloHintsProvider');
  }
  return ctx;
}

export function useSoloHintsOptional(): SoloHintsApi | null {
  return useContext(SoloHintsContext);
}
