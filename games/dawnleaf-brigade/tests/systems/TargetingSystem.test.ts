import { describe, expect, it } from 'vitest';

import { isWithinRange, nearestCandidateWithinRange } from '../../src/systems/TargetingSystem';

describe('isWithinRange', () => {
  // AC-006 — a candidate closer than the range belongs to it
  it('counts a candidate inside the range as within it', () => {
    expect(isWithinRange(500, 620, 200)).toBe(true);
  });

  // AC-006 — the decisive boundary case: <=, not <, matching AuraSystem's
  // policy by coincidence of arithmetic only (design.md §3) — the two rules
  // are independently specified even though they agree here.
  it('returns true for a candidate exactly at the range boundary', () => {
    expect(isWithinRange(500, 700, 200)).toBe(true);
  });

  it('returns true for a candidate exactly at the range boundary on the left side too', () => {
    expect(isWithinRange(500, 300, 200)).toBe(true);
  });

  // AC-006 — one pixel past the edge is out
  it('excludes a candidate one pixel beyond the range', () => {
    expect(isWithinRange(500, 701, 200)).toBe(false);
  });

  // REQ-004 — one-dimensional distance, unaware of which side the candidate is on
  it('measures distance without regard to which side the candidate is on', () => {
    expect(isWithinRange(500, 350, 200)).toBe(true);
    expect(isWithinRange(500, 250, 200)).toBe(false);
  });

  it('counts a candidate standing on the source position as within range', () => {
    expect(isWithinRange(500, 500, 200)).toBe(true);
  });
});

describe('nearestCandidateWithinRange', () => {
  // AC-006 — the nearest of several is selected, not the first or the farthest
  it('returns the nearest of several candidates within range', () => {
    expect(nearestCandidateWithinRange(500, [620, 550, 900], 200)).toBe(550);
  });

  it('returns the nearest candidate regardless of which side it is on', () => {
    expect(nearestCandidateWithinRange(500, [650, 420], 300)).toBe(420);
  });

  // AC-006 — nothing in range yields null, not a sentinel like -1 or Infinity
  it('returns null when nothing is in range', () => {
    expect(nearestCandidateWithinRange(500, [900, 1000], 200)).toBeNull();
  });

  it('returns null for an empty candidate list', () => {
    expect(nearestCandidateWithinRange(500, [], 200)).toBeNull();
  });

  // A candidate exactly on the boundary is still a valid pick for "nearest"
  it('includes a boundary candidate as a possible nearest', () => {
    expect(nearestCandidateWithinRange(500, [700, 900], 200)).toBe(700);
  });

  // AC-006 / REQ-004 — pure function, argument is not mutated
  it('does not mutate the candidate array it was given', () => {
    const candidates = [620, 550, 900];

    nearestCandidateWithinRange(500, candidates, 200);

    expect(candidates).toEqual([620, 550, 900]);
  });
});
