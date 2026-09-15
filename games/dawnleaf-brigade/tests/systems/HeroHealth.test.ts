import { describe, expect, it } from 'vitest';
import { regenerateHealth, resolveModeOutcome } from '../../src/systems/CombatSystem';

describe('hero vitality', () => {
  it('recovers according to elapsed time, including fractional steps, without exceeding max', () => {
    expect(regenerateHealth({ current: 150, max: 200 }, 250, 2).current).toBe(150.5);
    expect(regenerateHealth({ current: 199, max: 200 }, 2000, 2).current).toBe(200);
    expect(regenerateHealth({ current: 150, max: 200 }, -100, 2).current).toBe(150);
  });
  it('never revives a dead hero', () => {
    expect(regenerateHealth({ current: 0, max: 200 }, 10000, 2).current).toBe(0);
  });
  it.each(['campaign', 'boss', 'survival'] as const)(
    'hero death is defeat in %s, even on a simultaneous victory',
    (mode) => {
      expect(
        resolveModeOutcome(
          mode,
          { current: 100, max: 100 },
          { current: 0, max: 100 },
          { current: 0, max: 200 },
        ),
      ).toBe('defeat');
      expect(
        resolveModeOutcome(
          mode,
          { current: 100, max: 100 },
          { current: 100, max: 100 },
          { current: 1, max: 200 },
        ),
      ).toBe('ongoing');
    },
  );
});
