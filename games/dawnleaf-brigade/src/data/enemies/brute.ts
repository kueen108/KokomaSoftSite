import { translate } from '../../i18n';
import type { EnemyDefinition } from '../../types/stage';

/**
 * The brute: slow and durable, the opposite corner from the grunt.
 *
 * Three times the grunt's hit points and a little over twice its damage, but
 * roughly half its speed and a longer gap between attacks. Slow is what makes
 * it answerable: an ally unit has time to get in front of it, so the counter to
 * a brute is summoning rather than shooting. At the mace's 20 damage a grunt
 * dies in two hits and a brute in five, which is past what the player can
 * sustain alone (design.md §4.1).
 *
 * Its numbers are literals rather than `balance.ts` constants because no such
 * constants exist — the shared file describes the one enemy Phase 1 had, and
 * C-5 keeps it append-only. A stage-varying number belongs to the thing it
 * describes (REQ-017).
 */
export const BRUTE: EnemyDefinition = {
  kind: 'brute',
  displayName: translate('거한'),
  baseStats: {
    maxHp: 90,
    attackDamage: 12,
    attackIntervalMs: 1600,
    speed: 35,
  },
  // Melee, unchanged from today (SPEC-UNIT-ROSTER-001 REQ-003).
  attackRange: 0,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy-brute',
  tintColor: 0x8a5a3c,
  // 1.4x the grunt's width and 1.375x its height (design.md §4.1) — enough to
  // read as a different mass at a glance while moving, without becoming a wall
  // that blocks the lane. Colour carried this distinction alone until 0.3.0,
  // and on a moving screen it did not carry it far enough.
  width: 56,
  height: 66,
};
