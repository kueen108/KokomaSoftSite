// @MX:ANCHOR: [AUTO] Boss rules — which phase a boss is in, and what a
// finished boss battle records.
// @MX:REASON: The phase query is asked every frame by both the Boss entity and
// BattleScene's HUD, and the record rule runs at settlement. A fault in the
// phase rule makes the boss fight with the wrong numbers or with none at all,
// and a fault in the record rule loses a clear the player actually earned —
// neither raises an error and both look like ordinary play. Engine-independent
// by contract (REQ-023, C-1): nothing here may import the rendering engine or
// the boss registry.
/**
 * Boss battle rules.
 *
 * Like every module here it imports nothing but `../types/` (C-1). The boss
 * definition arrives as an argument rather than being looked up, for the reason
 * `StageSystem` takes the campaign ordering as one: a registry import would put
 * content inside a rule module, and an argument also lets the same rules be
 * asked about a boss that is not the shipped one, which is what the tests do.
 */
import type { BossDefinition, BossId, BossPhase } from '../types/boss';
import type { BattleOutcome } from '../types/combat';
import type { PersistedState } from '../types/save';

/**
 * The phase a boss is in right now (REQ-014).
 *
 * Computed from the current hit points every time it is asked, rather than
 * tracked as a sequence of transitions. That is the same judgement `AuraSystem`
 * makes about aura membership and for the same reason: a state query has no
 * ordering to get wrong. Watching for crossings does — one large hit spanning
 * two thresholds advances a single step, and a heal never comes back — and a
 * missed transition raises nothing. The boss simply fights with numbers from a
 * phase it has already left.
 *
 * A phase's `enterAtPercent` is the health it is entered AT, on the way down.
 * So a phase applies once health has fallen to that percentage, and the active
 * one is the last in list order whose threshold health has reached — the
 * deepest phase entered so far.
 *
 * The comparison multiplies where the obvious form would divide. `currentHp /
 * maxHp <= percent / 100` decides the boundary by comparing two floating-point
 * values, and whether `396 / 600` is the same double as `0.66` depends on the
 * numbers; when it is not, the boss stays a frame in the wrong phase and
 * nothing looks broken. Multiplied out, every term is a whole number and the
 * boundary is exact: `396 x 100` and `66 x 600` are both 39600 (design.md §4.2).
 *
 * Total and single-valued because of REQ-013's two conditions, not by accident,
 * and those conditions also fix the direction of the comparison. The first
 * phase enters at 100, so a boss at full health matches at least one — which is
 * true only this way round; reverse the inequality and full health anchors
 * nothing while zero health matches nothing at all. The percentages strictly
 * decrease, so "the last one matched" names exactly one phase. AC-014 is what
 * keeps both conditions true.
 *
 * Written as the requirement writes it, hp on the left, so the clause and this
 * line can be read side by side without flipping either mentally. REQ-014 and
 * design.md §4.2 were corrected to this direction in spec.md 0.2.0; §4.2 now
 * carries a six-row check table.
 */
export function bossPhaseAt(definition: BossDefinition, currentHp: number): BossPhase {
  let active = definition.phases[0];

  for (const phase of definition.phases) {
    if (currentHp * 100 <= phase.enterAtPercent * definition.maxHp) {
      active = phase;
    }
  }

  return active;
}

/**
 * The state after a boss battle ends (REQ-018, REQ-019).
 *
 * The outcome is an argument rather than a condition at the call site, for the
 * reason `recordStageResult` takes one: wrapping this in `if (victory)` inside
 * the scene would move REQ-019 out of reach of any unit test, leaving it as
 * "did the scene remember the branch" — a question only a played battle could
 * answer (design.md §5).
 *
 * An identifier already recorded is left alone, so beating the same boss again
 * writes nothing (REQ-018). A boss stays challengeable after it is cleared, so
 * this path is ordinary play rather than an edge case; appending regardless
 * would raise no error and show nothing on screen, while the save document grew
 * by one string per rematch.
 */
export function recordBossResult(
  state: PersistedState,
  bossId: BossId,
  outcome: BattleOutcome,
): PersistedState {
  if (outcome !== 'victory' || state.bossesCleared.includes(bossId)) {
    return state;
  }

  return { ...state, bossesCleared: [...state.bossesCleared, bossId] };
}
