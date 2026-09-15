import { translate } from '../../i18n/index';
import type { BossDefinition } from '../../types/boss';

/**
 * The Grave Warden: one boss, three phases (design.md §4.3).
 *
 * As its health falls it becomes faster and hits more often while each
 * individual blow gets weaker — damage per second rises from 8.33 to 12.5 while
 * the hit itself drops from 15 to 10. The shape is deliberate. A boss that only
 * grew stronger would be indistinguishable from one with a big health bar, and
 * a boss that only weakened would make its last third a formality; this way the
 * stretch where the player feels nearly finished is the most dangerous one.
 *
 * 600 hit points is 30 mace hits, and mana caps the player at 1.5 shots per
 * second, so shooting alone takes about twenty seconds — during which the boss
 * is advancing on the ally base the whole time. Summoning is therefore not
 * optional here, which is what makes this a different battle rather than a
 * long one.
 *
 * Deliberately no `TEXTURE` import, following `data/enemies/grunt.ts`: pulling
 * `config/gameConfig` in here would drag Phaser into a module the
 * node-environment unit tests import.
 */
export const GRAVE_WARDEN: BossDefinition = {
  id: 'grave-warden',
  displayName: translate('Grave Warden  무덤지기'),
  maxHp: 1400,
  textureKey: 'tex-boss-grave-warden',
  tintColor: 0x6b4a8a,
  // Larger than both enemy kinds on both axes — grunt is 40x48 and brute 56x66
  // (REQ-012). Not a round-up of the brute but a clear step past it: at the
  // brute's size with a different colour the boss would read as a third enemy
  // rather than as the thing the battle is about, which is the failure
  // SPEC-CAMPAIGN-STAGE-001 0.3.0 found when colour alone carried a
  // distinction on a moving screen.
  width: 96,
  height: 120,
  // Entry percentages start at 100 and strictly decrease (REQ-013). Both
  // properties are what make `bossPhaseAt` total and single-valued: 100 catches
  // a full-health boss, and the decrease means one health value can satisfy
  // several thresholds but only ever has one last match.
  phases: [
    {
      displayName: translate("Warden's Guard  수문장의 방벽"),
      enterAtPercent: 100,
      stats: { attackDamage: 15, attackIntervalMs: 1800, speed: 30 },
    },
    {
      displayName: translate('Cracked Armour  갈라진 갑주'),
      enterAtPercent: 66,
      stats: { attackDamage: 12, attackIntervalMs: 1200, speed: 50 },
    },
    {
      displayName: translate('Last Stand  최후의 발악'),
      enterAtPercent: 33,
      stats: { attackDamage: 10, attackIntervalMs: 800, speed: 70 },
    },
  ],
};
