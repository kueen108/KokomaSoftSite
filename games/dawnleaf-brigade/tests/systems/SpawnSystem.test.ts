import { describe, expect, it } from 'vitest';

import { dueSpawns } from '../../src/systems/SpawnSystem';
import type { WaveSchedule } from '../../src/types/stage';

const schedule: WaveSchedule = [
  { spawnAtMs: 1000, enemyKind: 'grunt', count: 1 },
  { spawnAtMs: 3000, enemyKind: 'grunt', count: 1 },
  { spawnAtMs: 5000, enemyKind: 'grunt', count: 1 },
];

function spawnTimes(entries: readonly { spawnAtMs: number }[]): number[] {
  return entries.map((entry) => entry.spawnAtMs);
}

describe('dueSpawns', () => {
  // AC-011a — one oversized window still yields each entry exactly once
  it('returns every entry inside a window that spans all of them', () => {
    expect(spawnTimes(dueSpawns(schedule, 0, 6000))).toEqual([1000, 3000, 5000]);
  });

  // AC-011b — consecutive windows each yield exactly one entry
  it('returns one entry per consecutive window', () => {
    expect(spawnTimes(dueSpawns(schedule, 0, 1500))).toEqual([1000]);
    expect(spawnTimes(dueSpawns(schedule, 1500, 3500))).toEqual([3000]);
    expect(spawnTimes(dueSpawns(schedule, 3500, 6000))).toEqual([5000]);
  });

  // AC-011b — consecutive windows and one big window agree
  it('yields the same entries whether stepped or taken in one window', () => {
    const stepped = [
      ...dueSpawns(schedule, 0, 1500),
      ...dueSpawns(schedule, 1500, 3500),
      ...dueSpawns(schedule, 3500, 6000),
    ];

    expect(spawnTimes(stepped)).toEqual(spawnTimes(dueSpawns(schedule, 0, 6000)));
  });

  // The reason the signature takes an interval rather than a single timestamp:
  // an entry sitting exactly on a window edge must belong to one window only.
  it('assigns an entry landing on a window boundary to exactly one window', () => {
    const onBoundary: WaveSchedule = [{ spawnAtMs: 1500, enemyKind: 'grunt', count: 1 }];

    expect(dueSpawns(onBoundary, 0, 1500)).toHaveLength(0);
    expect(dueSpawns(onBoundary, 1500, 3500)).toHaveLength(1);
  });

  // Stage 1 opens with a spawn at t=0, so the very first frame must catch it.
  it('returns an entry scheduled at time zero on the first frame', () => {
    const atZero: WaveSchedule = [{ spawnAtMs: 0, enemyKind: 'grunt', count: 1 }];

    expect(dueSpawns(atZero, 0, 16)).toHaveLength(1);
  });

  it('returns nothing for a window that falls between two entries', () => {
    expect(dueSpawns(schedule, 1100, 1500)).toHaveLength(0);
  });

  it('returns nothing for an empty schedule', () => {
    expect(dueSpawns([], 0, 10000)).toHaveLength(0);
  });

  // REQ-013 — pure function, argument is not mutated
  it('does not mutate the schedule it was given', () => {
    dueSpawns(schedule, 0, 6000);

    expect(schedule).toHaveLength(3);
    expect(schedule[0]?.spawnAtMs).toBe(1000);
  });
});
