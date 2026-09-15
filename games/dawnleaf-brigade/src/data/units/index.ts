import { MAGE } from './mage';
import { CLERIC } from './cleric';
import { LANCER } from './lancer';
import type { AllyUnitType, UnitDefinition } from '../../types/unit';
import { ARCHER } from './archer';
import { BANNERMAN } from './bannerman';
import { DEALER } from './dealer';
import { GUARDIAN } from './guardian';
import { TANKER } from './tanker';

/**
 * Lookup from type to definition. A registry, not an entry — each unit still
 * lives in its own file (C-11); this only puts them behind one name so callers
 * do not import every unit module individually.
 */
export const UNIT_DEFINITIONS: Readonly<Record<AllyUnitType, UnitDefinition>> = {
  tanker: TANKER,
  mage: MAGE,
  cleric: CLERIC,
  lancer: LANCER,

  dealer: DEALER,
  archer: ARCHER,
  guardian: GUARDIAN,
  bannerman: BANNERMAN,
};

/** The definition for one ally type. */
export function unitDefinition(type: AllyUnitType): UnitDefinition {
  return UNIT_DEFINITIONS[type];
}
