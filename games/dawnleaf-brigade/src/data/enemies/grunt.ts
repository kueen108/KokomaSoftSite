import { translate } from '../../i18n';
import {
  ENEMY_ATTACK_DAMAGE,
  ENEMY_ATTACK_INTERVAL_MS,
  ENEMY_HP,
  ENEMY_SPEED,
} from '../../config/balance';
import type { EnemyDefinition } from '../../types/stage';

/**
 * The grunt: the fast, fragile enemy the game has always had.
 *
 * Its four numbers are imported from `balance.ts` rather than copied across.
 * Copying would put the same figure in two files, and the shared constants
 * would then be free to drift away from the enemy that used to read them with
 * nothing failing (spec.md §2 — this SPEC moves where numbers live, it does not
 * change them). Those constants stay exactly as they are (C-5); this file only
 * reads them.
 *
 * Deliberately no `TEXTURE` import, following `data/units/tanker.ts`: pulling
 * `config/gameConfig` in here would drag Phaser into a module the
 * node-environment unit tests import.
 */
export const GRUNT: EnemyDefinition = {
  kind: 'grunt',
  displayName: translate('보병'),
  baseStats: {
    maxHp: ENEMY_HP,
    attackDamage: ENEMY_ATTACK_DAMAGE,
    attackIntervalMs: ENEMY_ATTACK_INTERVAL_MS,
    speed: ENEMY_SPEED,
  },
  // Melee, unchanged from today (SPEC-UNIT-ROSTER-001 REQ-003).
  attackRange: 0,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy',
  tintColor: 0xd0503c,
  // The size the grunt has had since Phase 1, now declared here instead of
  // written as a literal at the point of generation. Unchanged on purpose: the
  // grunt is the baseline the brute is read against, and moving both at once
  // would leave nothing to compare (design.md §4.1, the same reasoning that
  // keeps stage 1's numbers where they are).
  width: 40,
  height: 48,
};
