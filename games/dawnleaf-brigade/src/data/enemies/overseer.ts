import { translate } from '../../i18n';
import type { EnemyDefinition } from '../../types/stage';

/**
 * The overseer: the first support enemy, and the only aura source on the
 * enemy side (SPEC-UNIT-ROSTER-001 REQ-017/REQ-018) — mirroring the
 * bannerman, but with no composition question to answer: there is no second
 * enemy-side aura source to overlap with (design.md §4).
 *
 * Its own aura constants live in `balance.ts`, appended after the
 * bannerman's, and are applied through the same `isWithinAura`/`effectiveStats`
 * pair the ally side uses (REQ-017) — the aura rule itself does not know
 * which side is asking.
 */
export const OVERSEER: EnemyDefinition = {
  kind: 'overseer',
  displayName: translate('감독관'),
  baseStats: {
    maxHp: 40,
    attackDamage: 4,
    attackIntervalMs: 1400,
    speed: 45,
  },
  attackRange: 0,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy-overseer',
  tintColor: 0x7a4fae,
  // Provisional (design.md §5) — see `skirmisher.ts` for the same note.
  // Distinct from every other enemy's pair (an existing StageSystem test
  // requires pairwise-unique width/height across all five kinds); design.md
  // §5's literal 40x48 collided with the grunt's, so this file departs from
  // that table by the minimum needed to restore distinctness.
  width: 44,
  height: 52,
};
