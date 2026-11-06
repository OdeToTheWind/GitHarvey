/**
 * A tiny wrapper over localStorage for NON-SECRET values. Blocked or full storage never throws:
 * the app keeps working, the value just is not remembered. The GitHub token never goes here.
 */
export interface LocalStore {
  get(): string | null;
  set(value: string): void;
  remove(): void;
  subscribe(listener: () => void): () => void;
}

function area(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createLocalStore(key: string): LocalStore {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());
  return {
    get() {
      try {
        return area()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        area()?.setItem(key, value);
      } catch {
        // Blocked storage: not remembered.
      }
      notify();
    },
    remove() {
      try {
        area()?.removeItem(key);
      } catch {
        // ignore
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
