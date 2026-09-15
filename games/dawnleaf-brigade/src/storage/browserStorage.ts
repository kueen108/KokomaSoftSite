// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. This module exists precisely to hold the one thing the
// node test environment cannot run — the browser global — so that SaveSystem
// stays pure and fully testable (REQ-023, research.md §E). The serialisation
// and failure rules it feeds ARE unit-tested in SaveSystem. This is not
// pending work.
import type { StorageAdapter } from '../types/save';

/**
 * The real `localStorage`, or null where it cannot be reached.
 *
 * Private browsing and blocked-storage settings make the *property access*
 * throw, not just the read, so the probe below is a write-and-remove rather
 * than a presence check. Returning null instead of throwing is what lets
 * `SaveSystem.loadState` treat an unavailable adapter as one more route to the
 * default state (REQ-016) — the player gets a game that starts fresh rather
 * than a game that does not start.
 */
export function browserStorage(): StorageAdapter | null {
  try {
    const probeKey = 'paladogweb:probe';

    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);

    return window.localStorage;
  } catch {
    return null;
  }
}
