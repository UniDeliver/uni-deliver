import { useSyncExternalStore } from 'react';

/**
 * Tiny global flag so screens under the animated splash (e.g. welcome) can wait for it
 * to finish lifting away before running their own intro, and continue from its last frame.
 */
let done = false;
const listeners = new Set<() => void>();

export function markSplashDone() {
  if (done) return;
  done = true;
  listeners.forEach(l => l());
}

export function useSplashDone() {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => done
  );
}
