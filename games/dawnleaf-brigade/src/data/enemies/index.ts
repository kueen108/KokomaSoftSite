import { BOMBER } from './bomber';
import { WRAITH } from './wraith';
import { SENTINEL } from './sentinel';
import type { EnemyDefinition, EnemyKind } from '../../types/stage';
import { BRUTE } from './brute';
import { GRUNT } from './grunt';
import { JUGGERNAUT } from './juggernaut';
import { OVERSEER } from './overseer';
import { SKIRMISHER } from './skirmisher';

/**
 * Lookup from kind to definition. A registry, not an entry — each enemy still
 * lives in its own file (REQ-002); this only puts them behind one name so
 * callers do not import every enemy module individually.
 *
 * Typed as a total `Record`, so adding a kind to `EnemyKind` without adding its
 * definition here is a compile error rather than a stage that spawns nothing.
 */
export const ENEMY_DEFINITIONS: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  grunt: GRUNT,
  bomber: BOMBER,
  wraith: WRAITH,
  sentinel: SENTINEL,

  brute: BRUTE,
  skirmisher: SKIRMISHER,
  juggernaut: JUGGERNAUT,
  overseer: OVERSEER,
};

/** The definition for one enemy kind. */
export function enemyDefinition(kind: EnemyKind): EnemyDefinition {
  return ENEMY_DEFINITIONS[kind];
}
