export interface FrontlineObstacle {
  readonly x: number;
  readonly halfWidth: number;
}

/** Swept forward movement stops at the enemy front. Retreat is never trapped. */
export function limitHeroAdvance(
  from: number,
  desired: number,
  heroHalfWidth: number,
  obstacles: readonly FrontlineObstacle[],
): number {
  if (desired <= from) return desired;
  let limit = desired;
  for (const enemy of obstacles) {
    if (enemy.x < from) continue;
    const edge = enemy.x - Math.max(0, enemy.halfWidth) - Math.max(0, heroHalfWidth) - 8;
    // A newly overlapping enemy stops further advance, but never teleports Lumi.
    limit = Math.min(limit, Math.max(from, edge));
  }
  return limit;
}
