import { ALLY_BASE_HP } from '../../config/balance';
import type { SurvivalConfig } from '../../types/mode';

/**
 * Survival tuning (design.md §3.3).
 *
 * These are a chosen starting point, not a balanced curve — the same standing
 * as every other number in this project. Nothing here has been validated by
 * play.
 *
 * Survival is less exposed to that uncertainty than the campaign is, and the
 * difference is structural rather than reassuring: there is no gate to pass, so
 * numbers that are too harsh produce a low score rather than a wall. A low
 * score is still a finished run.
 */
export const SURVIVAL_CONFIG: SurvivalConfig = {
  // Stage 1 sends one enemy every 2000ms. Survival's wave `n` sends `n` at
  // once, so an equal gap would bury the screen by the time the count reaches
  // the double digits. Three times the gap keeps the early waves loose and
  // pushes the point where waves start overlapping later, which is where the
  // run is supposed to end.
  waveIntervalMs: 6000,
  // The same base health all three campaign stages use, and deliberately not a
  // survival-specific number: a different value would make a survival record
  // incomparable to any campaign experience the player already has.
  allyBaseHp: ALLY_BASE_HP,
  // One brute per three enemies (REQ-006). This is what stops the difficulty
  // curve from being a single axis: the count rises, and so does the share of
  // enemies that cannot be answered by shooting. SPEC-CAMPAIGN-STAGE-001 made
  // two enemy kinds so that they would demand different responses, and mixing
  // the ratio over time is what actually spends that.
  //
  // An argument rather than a constant `SurvivalSystem` reads, so the rules
  // stay inside the `../types/` import boundary (C-1).
  brutePeriod: 3,
};
