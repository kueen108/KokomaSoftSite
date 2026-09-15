// @MX:ANCHOR: [AUTO] Ranged-attack range judgement — the pure module deciding
// whether a candidate lies within a unit's attack range and, if several do,
// which is nearest.
// @MX:REASON: BattleScene calls this every frame for every ranged unit on
// both sides (SPEC-UNIT-ROSTER-001 REQ-005/REQ-006/REQ-010/REQ-011), and it is
// the only place that question is answered. Engine-independent by contract
// (REQ-004, REQ-009, REQ-023) so the range judgement stays testable without a
// browser — nothing in this file may import the rendering engine or touch a
// browser global.
//
// @MX:NOTE: [AUTO] The arithmetic here is identical to
// `AuraSystem.isWithinAura` — both are `Math.abs(a - b) <= r` on the same
// single lane. The two are still separate functions in separate modules
// rather than one reused by the other, because they are different game rules
// that happen to share a formula: aura membership answers "does the Paladog's
// light reach this unit", attack range answers "can this unit hit that one
// without moving". If the aura's boundary policy ever changes, this module
// must not change with it (design.md §3).
/** True while `candidateX` lies within `range` of `sourceX` (REQ-004). */
export function isWithinRange(sourceX: number, candidateX: number, range: number): boolean {
  return Math.abs(sourceX - candidateX) <= range;
}

/**
 * The nearest of `candidateXs` that lies within `range` of `sourceX`, or
 * `null` when none do (REQ-004, REQ-005). A tie for nearest position is
 * resolved by keeping the first one encountered.
 *
 * `null` rather than a sentinel such as `-1` or `Infinity`: neither is a
 * position a caller could otherwise receive, so both would need a separate
 * check anyway, and `null` is the same "nothing here" the rest of this
 * codebase already uses (`AllyUnit`'s `EngagedTarget | null`).
 */
export function nearestCandidateWithinRange(
  sourceX: number,
  candidateXs: readonly number[],
  range: number,
): number | null {
  let nearest: number | null = null;
  let nearestDistance = Infinity;

  for (const candidateX of candidateXs) {
    const distance = Math.abs(sourceX - candidateX);

    if (distance <= range && distance < nearestDistance) {
      nearest = candidateX;
      nearestDistance = distance;
    }
  }

  return nearest;
}
