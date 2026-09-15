import { describe, expect, it } from 'vitest';
import { limitHeroAdvance } from '../../src/systems/PositioningSystem';

describe('hero frontline movement', () => {
  it('moves freely without an enemy ahead', () => {
    expect(limitHeroAdvance(100, 200, 20, [])).toBe(200);
    expect(limitHeroAdvance(100, 200, 20, [{ x: 50, halfWidth: 30 }])).toBe(200);
  });
  it('stops at the body edge and cannot tunnel through on a long frame', () => {
    const enemies = [{ x: 300, halfWidth: 30 }];
    expect(limitHeroAdvance(100, 200, 20, enemies)).toBe(200);
    expect(limitHeroAdvance(100, 1000, 20, enemies)).toBe(242);
    expect(limitHeroAdvance(242, 250, 20, enemies)).toBe(242);
  });
  it('uses the nearest blocking edge regardless of array order', () => {
    expect(
      limitHeroAdvance(100, 500, 20, [
        { x: 400, halfWidth: 30 },
        { x: 300, halfWidth: 40 },
      ]),
    ).toBe(232);
  });
  it('allows retreat even while overlapping or surrounded', () => {
    const enemies = [
      { x: 300, halfWidth: 30 },
      { x: 280, halfWidth: 30 },
    ];
    expect(limitHeroAdvance(290, 200, 20, enemies)).toBe(200);
    expect(limitHeroAdvance(290, 310, 20, enemies)).toBe(290);
    expect(limitHeroAdvance(290, 290, 20, enemies)).toBe(290);
  });
});
