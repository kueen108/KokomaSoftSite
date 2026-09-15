import { STAGE_4 } from './stage-4';
import { STAGE_5 } from './stage-5';
import { STAGE_6 } from './stage-6';
import { STAGE_7 } from './stage-7';
import { STAGE_8 } from './stage-8';
import { STAGE_9 } from './stage-9';
import { STAGE_10 } from './stage-10';
import { STAGE_11 } from './stage-11';
import { STAGE_12 } from './stage-12';
import type { StageConfig, StageId } from '../../types/stage';
import { STAGE_ONE } from './stage-1';
import { STAGE_THREE } from './stage-3';
import { STAGE_TWO } from './stage-2';

/**
 * Lookup from identifier to definition. A registry, not an entry — each stage
 * still lives in its own file (REQ-001).
 *
 * Typed as a total `Record`, so adding an identifier to `StageId` without
 * adding its definition here is a compile error rather than a campaign with a
 * hole in it.
 */
const STAGE_DEFINITIONS: Readonly<Record<StageId, StageConfig>> = {
  'stage-1': STAGE_ONE,
  'stage-2': STAGE_TWO,
  'stage-3': STAGE_THREE,
  'stage-4': STAGE_4,
  'stage-5': STAGE_5,
  'stage-6': STAGE_6,
  'stage-7': STAGE_7,
  'stage-8': STAGE_8,
  'stage-9': STAGE_9,
  'stage-10': STAGE_10,
  'stage-11': STAGE_11,
  'stage-12': STAGE_12,
};

/**
 * The campaign in order, and the only place that order is defined (REQ-004).
 *
 * Sorted here from each stage's `order` rather than relying on the literal
 * sequence above, so inserting a stage is a matter of giving it an `order` and
 * nothing else. Everything that cares about progression — the select screen,
 * unlock determination, the result screen's next-stage route — reads this list;
 * none of them reads `order` directly, which is what keeps the ordering in one
 * place instead of two that can disagree. Two places that disagree do not
 * error: the select screen and the unlock rule simply believe different
 * campaigns.
 */
export const CAMPAIGN_STAGES: readonly StageConfig[] = Object.values(STAGE_DEFINITIONS).sort(
  (left, right) => left.order - right.order,
);

/** The stage after this one in campaign order, or null at the end (REQ-018). */
export function nextStage(id: StageId): StageConfig | null {
  const index = CAMPAIGN_STAGES.findIndex((stage) => stage.id === id);

  if (index < 0) {
    return null;
  }

  return CAMPAIGN_STAGES[index + 1] ?? null;
}
