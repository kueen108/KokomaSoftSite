import type { BossDefinition, BossId } from '../../types/boss';
import { GRAVE_WARDEN } from './grave-warden';

/**
 * Lookup from identifier to definition. A registry, not an entry — each boss
 * still lives in its own file (REQ-012); this only puts them behind one name.
 *
 * Typed as a total `Record`, so adding an identifier to `BossId` without adding
 * its definition here is a compile error rather than a boss mode that starts a
 * battle with nothing in it.
 */
const BOSS_DEFINITIONS: Readonly<Record<BossId, BossDefinition>> = {
  'grave-warden': GRAVE_WARDEN,
};

/**
 * Every boss this build ships, in registry order.
 *
 * There is one, so there is no order to speak of yet and no screen that picks
 * between them (spec.md §5). The list exists because the rules that filter a
 * stored cleared-boss record (REQ-022) and the phase checks in the tests both
 * need to ask "every boss", and neither should have to name one.
 */
export const BOSSES: readonly BossDefinition[] = Object.values(BOSS_DEFINITIONS);

/** The definition for one boss identifier. */
export function bossDefinition(id: BossId): BossDefinition {
  return BOSS_DEFINITIONS[id];
}
