import { translate } from '../../i18n/index';
import type { GameMode, ModeDefinition } from '../../types/mode';
import { GRAVE_WARDEN } from '../bosses/grave-warden';

/**
 * Lookup from mode to definition. A registry, not an entry.
 *
 * Typed as a total `Record`, so adding an identifier to `GameMode` without
 * adding its definition here is a compile error rather than a mode that never
 * appears on the select screen.
 *
 * The three definitions live in this file rather than one file each, unlike
 * stages, enemies, units and rings. Those are content — numbers and rosters
 * that grow. A mode definition is a name, a sentence and a destination, and
 * three of them side by side is where the differences between the modes are
 * actually readable. plan.md §A fixes the file set this way.
 */
const MODE_DEFINITIONS: Readonly<Record<GameMode, ModeDefinition>> = {
  campaign: {
    mode: 'campaign',
    displayName: translate('CAMPAIGN  캠페인'),
    description: translate('Clear the stages in order. 스테이지를 순서대로 공략합니다.'),
    order: 1,
    // The one mode with a second question to ask, so it is the one mode whose
    // entry is a screen rather than a battle (design.md §1.2). The stage select
    // screen is reached unchanged — it knows nothing about modes and does not
    // need to (plan.md §A PRESERVE, D-5).
    entry: { kind: 'stage-select' },
  },
  survival: {
    mode: 'survival',
    displayName: translate('SURVIVAL  서바이벌'),
    // States the absence of victory outright, because that is the fact a
    // player cannot recover from not knowing: entering expecting to win makes
    // the guaranteed defeat read as a broken game rather than as the score
    // screen it is (REQ-003).
    description: translate('Endless waves, no victory — how long can you last? 승리는 없습니다.'),
    order: 2,
    entry: { kind: 'battle', launch: { mode: 'survival' } },
  },
  boss: {
    mode: 'boss',
    displayName: translate('BOSS  보스전'),
    description: translate('One boss, three phases. 보스 하나와 세 페이즈를 상대합니다.'),
    order: 3,
    // One boss, so there is nothing to choose between and this mode enters it
    // directly (spec.md §5). Named rather than taken as the registry's first
    // entry: picking by position would silently change which boss this mode
    // means the moment a second one is added. When that happens this becomes a
    // selection screen, which is the unlock condition spec.md §5 records.
    entry: { kind: 'battle', launch: { mode: 'boss', bossDefinition: GRAVE_WARDEN } },
  },
};

/**
 * Every mode in menu order, and the only place that order is defined (REQ-001).
 *
 * Sorted here from each definition's `order` rather than from the literal
 * sequence above, so the sequence in the record carries no meaning and cannot
 * quietly become a second ordering. Everything that lists or routes modes reads
 * this list. Two places that disagree would not error — the select screen and
 * the router would simply believe different games.
 */
export const GAME_MODE_DEFINITIONS: readonly ModeDefinition[] = Object.values(
  MODE_DEFINITIONS,
).sort((left, right) => left.order - right.order);
