// New file, deliberately separate from AuraSystem.test.ts (plan.md M2 —
// the existing test file for `isWithinAura`/`effectiveStats` must show zero
// diff, since REQ-014/AC-015 re-verify nothing about those two exports; this
// file exercises only the new `isWithinAnyAura` export.
import { describe, expect, it } from 'vitest';

import { isWithinAnyAura } from '../../src/systems/AuraSystem';
import type { AuraSource } from '../../src/systems/AuraSystem';

describe('isWithinAnyAura', () => {
  // REQ-014/REQ-015 — a unit inside exactly one source's radius is a member
  it('counts a unit inside one source as a member', () => {
    const sources: readonly AuraSource[] = [{ x: 500, radius: 200 }];

    expect(isWithinAnyAura(sources, 600)).toBe(true);
  });

  it('excludes a unit outside every source', () => {
    const sources: readonly AuraSource[] = [{ x: 500, radius: 200 }];

    expect(isWithinAnyAura(sources, 800)).toBe(false);
  });

  // design.md §4 — Paladog + bannerman overlap. Membership does not compose
  // multipliers; it only asks whether at least one source covers the unit.
  it('counts a unit inside two overlapping sources as a member', () => {
    const sources: readonly AuraSource[] = [
      { x: 500, radius: 200 },
      { x: 900, radius: 160 },
    ];

    expect(isWithinAnyAura(sources, 780)).toBe(true);
  });

  it('counts a unit inside only the second of several sources as a member', () => {
    const sources: readonly AuraSource[] = [
      { x: 100, radius: 50 },
      { x: 900, radius: 160 },
    ];

    expect(isWithinAnyAura(sources, 780)).toBe(true);
  });

  // REQ-015/REQ-017 — no live source at all (e.g. no bannerman/overseer on
  // the field) means no membership, not an error.
  it('returns false when there are no sources', () => {
    expect(isWithinAnyAura([], 500)).toBe(false);
  });

  // The boundary policy matches `isWithinAura`'s own <= rule, inherited by
  // delegation rather than restated.
  it('counts a unit exactly on a source boundary as a member', () => {
    const sources: readonly AuraSource[] = [{ x: 500, radius: 200 }];

    expect(isWithinAnyAura(sources, 700)).toBe(true);
  });

  // REQ-023 — pure function, argument is not mutated
  it('does not mutate the source list it was given', () => {
    const sources: AuraSource[] = [{ x: 500, radius: 200 }];

    isWithinAnyAura(sources, 600);

    expect(sources).toEqual([{ x: 500, radius: 200 }]);
  });
});
