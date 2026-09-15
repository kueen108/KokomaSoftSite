// @MX:ANCHOR: [AUTO] Campaign progression — the single place deciding which
// stages are open, what a finished battle records, and how heavy a stage is.
// @MX:REASON: Four call sites across two scenes and the difficulty gate.
// StageSelectScene asks it twice per row to draw the list and again before
// starting a battle; BattleScene asks it once at settlement. A fault in the
// unlock rule locks the player out of the campaign or opens all of it, and a
// fault in the record rule loses progress on a battle that was actually won —
// neither raises an error, and both look like ordinary screens. Engine-
// independent by contract (REQ-020, C-1): nothing here may import the rendering
// engine or the stage registry, or the difficulty metric leaves the measurable
// set and REQ-016 stops being checkable without a browser.
/**
 * Campaign stage rules: what is open, what a battle result writes down, and how
 * heavy a stage is.
 *
 * Like every module here it imports nothing but `../types/` (C-1). That is what
 * keeps the three rules below measurable without a browser — and for the
 * difficulty metric it is the whole point, because that metric is this SPEC's
 * replacement for a completion condition that could not be judged mechanically
 * at all (spec.md §1).
 *
 * Campaign order arrives as an argument rather than being read from the stage
 * registry. Importing the registry would put content inside a rule module and
 * break that contract; taking it as an argument also means the same rules can
 * be asked about a different ordering, which is what the tests do.
 */
import type { BattleOutcome } from '../types/combat';
import type { PersistedState } from '../types/save';
import type { EnemyDefinition, EnemyKind, StageConfig, StageId } from '../types/stage';

/**
 * Whether a stage may be entered (REQ-009, REQ-010).
 *
 * The rule reads only the stage immediately before this one, not the whole
 * record. "Everything before it is cleared" would be the same answer today at
 * more cost, and it would also quietly decide what happens to a save that skips
 * one — a question the campaign has no rule for yet.
 *
 * A stage absent from the ordering it is judged against is locked rather than
 * open: without that, an identifier the ordering does not contain would index
 * past the start of the list and answer from `undefined`.
 */
export function isStageUnlocked(
  orderedStages: readonly StageConfig[],
  stageId: StageId,
  clearedStages: readonly StageId[],
): boolean {
  const index = orderedStages.findIndex((stage) => stage.id === stageId);

  if (index < 0) {
    return false;
  }

  // REQ-009: the first stage has no predecessor to require, and a campaign
  // whose entry point depended on the record would have no entry point at all
  // on the one save every player starts from.
  if (index === 0) {
    return true;
  }

  return clearedStages.includes(orderedStages[index - 1].id);
}

/**
 * The state after a battle ends (REQ-011, REQ-012).
 *
 * The outcome is an argument rather than a condition at the call site. Wrapping
 * this in `if (victory)` inside the scene would move REQ-012 out of reach of
 * any unit test — it would become "did the scene remember the branch", which
 * only a played battle could answer (design.md §5).
 *
 * An identifier already recorded is left alone, so replaying a cleared stage
 * writes nothing (REQ-011). Appending regardless would raise no error and show
 * nothing on screen; the save document would simply grow by one string every
 * time the player enjoyed a stage twice.
 */
export function recordStageResult(
  state: PersistedState,
  stageId: StageId,
  outcome: BattleOutcome,
): PersistedState {
  if (outcome !== 'victory' || state.clearedStages.includes(stageId)) {
    return state;
  }

  return { ...state, clearedStages: [...state.clearedStages, stageId] };
}

/**
 * How heavy a stage is: every enemy's hit points plus the enemy base's
 * (REQ-016).
 *
 * Exactly two terms and no third. The requirement enumerates its inputs and
 * closes the list, because this figure stands in for a completion condition
 * that could not be judged mechanically — "you cannot clear it without
 * upgrading" depends on how well the player plays. Any strictly increasing
 * function would satisfy an increase check, so if the formula were not pinned
 * the check could drift onto some other quantity without anyone noticing.
 *
 * Attack damage and speed are deliberately absent: folding them in needs a
 * weighting, and there is no evidence for any particular weight (design.md
 * §4.2). This is a device for catching a curve that flattens or inverts, not a
 * measure of whether a stage is fun.
 *
 * Enemy hit points arrive as a lookup argument for the same reason the ordering
 * does — the enemy registry is content, and this module holds rules.
 */
export function difficultyMetric(
  stage: StageConfig,
  enemies: Readonly<Record<EnemyKind, EnemyDefinition>>,
): number {
  const waveHitPoints = stage.waves.reduce(
    (total, entry) => total + entry.count * enemies[entry.enemyKind].baseStats.maxHp,
    0,
  );

  return waveHitPoints + stage.enemyBaseHp;
}
