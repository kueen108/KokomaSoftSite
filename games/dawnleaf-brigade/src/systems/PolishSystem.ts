/** Readability and crowd-control budgets shared by combat and its verification. */
export const FORMATION_GAP = 44;
export const SPLASH_TARGET_LIMIT = 3;
export const HEAL_TARGET_LIMIT = 3;
export interface Marcher {
  readonly x: number;
  readonly lane: number;
  readonly moving: boolean;
}
/** Same-lane followers wait behind the closest friendly body; other lanes can pass. */
export function formationStops(units: readonly Marcher[], direction: 1 | -1): Set<number> {
  const order = units.map((u, i) => ({ u, i })).sort((a, b) => direction * (b.u.x - a.u.x));
  const stopped = new Set<number>(),
    front = new Map<number, number>();
  for (const { u, i } of order) {
    const x = front.get(u.lane);
    if (u.moving && x !== undefined && Math.abs(x - u.x) < FORMATION_GAP) stopped.add(i);
    front.set(u.lane, u.x);
  }
  return stopped;
}
export function validLevel(value: unknown, max = 5): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value)))
    : 0;
}
export function validGold(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(999999, Math.floor(value)))
    : 0;
}
