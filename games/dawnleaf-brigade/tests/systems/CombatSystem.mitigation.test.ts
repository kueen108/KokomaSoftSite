// New file, deliberately separate from CombatSystem.test.ts (plan.md M2 —
// that file's existing coverage for `applyDamage` and friends stays diff-free;
// this file exercises only the new `mitigatedDamage` export).
import { describe, expect, it } from 'vitest';

import { mitigatedDamage } from '../../src/systems/CombatSystem';

describe('mitigatedDamage', () => {
  // AC-013 — the decisive case
  it('reduces raw damage by the given percentage', () => {
    expect(mitigatedDamage(100, 30)).toBe(70);
  });

  // AC-013 — a reduction of zero is the identity
  it('returns the raw damage unchanged at zero percent reduction', () => {
    expect(mitigatedDamage(100, 0)).toBe(100);
  });

  // AC-013 — boundary: a negative reduction cannot amplify damage
  it('clamps a negative reduction percentage to zero', () => {
    expect(mitigatedDamage(100, -10)).toBe(100);
  });

  // AC-013 — boundary: a reduction over 100% cannot invert into healing
  it('clamps a reduction percentage over 100 to a full block', () => {
    expect(mitigatedDamage(100, 150)).toBe(0);
  });

  it('rounds a fractional result to a whole number', () => {
    // 33 * (1 - 0.30) = 23.1
    expect(mitigatedDamage(33, 30)).toBe(23);
  });

  it('applies the same percentage regardless of the raw damage amount', () => {
    expect(mitigatedDamage(50, 50)).toBe(25);
    expect(mitigatedDamage(10, 50)).toBe(5);
  });
});
