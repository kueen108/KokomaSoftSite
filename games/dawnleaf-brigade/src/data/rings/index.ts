// @MX:NOTE: [AUTO] No unit test covers this directory, and that is a decision
// rather than an omission. These files hold numbers and no logic, so a missing
// or mistyped field is caught by `npm run typecheck` rather than by a test, and
// the level rules those numbers have to obey ARE tested — RingSystem.test.ts
// reads the shipped definitions back and checks every level step against them.
import type { RingDefinition, RingType } from '../../types/ring';
import { MANA_RING } from './mana';
import { RUPTURE_RING } from './rupture';

/**
 * Lookup from type to definition. A registry, not an entry — each ring still
 * lives in its own file (C-5); this only puts them behind one name so callers
 * do not import every ring module individually.
 */
export const RING_DEFINITIONS: Readonly<Record<RingType, RingDefinition>> = {
  mana: MANA_RING,
  rupture: RUPTURE_RING,
};

/** The definition for one ring type. */
export function ringDefinition(type: RingType): RingDefinition {
  return RING_DEFINITIONS[type];
}
