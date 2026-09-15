// @MX:ANCHOR: [AUTO] Central combat rule module — damage, death, attack gating,
// mana economy and win/loss adjudication for the whole battle.
// @MX:REASON: Highest fan-in module in this SPEC. BattleScene, Paladog,
// EnemyUnit, Projectile and Base all call into it, and every rule this SPEC
// defines lands here. Engine-independent by contract (REQ-013) so it stays
// unit-testable without a browser — nothing in this file may import the
// rendering engine (structure.md @NAV:DEC-SYSTEMS-PURITY, verified by AC-015a).
import type { AttackState, BattleOutcome, Health } from '../types/combat';
import type { GameMode } from '../types/mode';

/** Reduces health by `damage`, never below zero. */
export function applyDamage(health: Health, damage: number): Health {
  return { current: Math.max(0, health.current - damage), max: health.max };
}

/** True once health has been spent. Negative values count as dead. */
export function isDead(health: Health): boolean {
  return health.current <= 0;
}

/**
 * The mace attack gate: off cooldown AND mana at or above the cost (REQ-006).
 * A press that fails this check is discarded outright — callers must not queue
 * it for replay when the gate reopens (REQ-008).
 */
export function canAttack(state: AttackState): boolean {
  return state.cooldownRemainingMs <= 0 && state.mana >= state.attackCost;
}

/** Charges the attack cost and starts the cooldown (REQ-006). */
export function consumeAttackCost(state: AttackState): AttackState {
  return {
    ...state,
    mana: state.mana - state.attackCost,
    cooldownRemainingMs: state.cooldownMs,
  };
}

/** Regenerates mana for one elapsed step, capped at the maximum (REQ-009). */
export function regenerateMana(state: AttackState, deltaMs: number): AttackState {
  const regenerated = state.mana + (state.manaRegenPerSec * deltaMs) / 1000;

  return { ...state, mana: Math.min(state.manaMax, regenerated) };
}

/** Counts the attack cooldown down by one elapsed step, never below zero. */
export function tickCooldown(state: AttackState, deltaMs: number): AttackState {
  return {
    ...state,
    cooldownRemainingMs: Math.max(0, state.cooldownRemainingMs - deltaMs),
  };
}

// @MX:NOTE: [AUTO] The ally-base check runs FIRST on purpose — this ordering is
// the win/loss tie-break, not an accident of how the branches were typed.
// An enemy attack tick and a player hit can land on the same frame and drive
// both bases to zero together; without a pinned priority the same situation
// would report victory on one run and defeat on the next. REQ-014 fixes it as
// defeat. Reordering these two branches silently changes game behaviour.
/** Adjudicates the battle. Ally-base collapse takes priority (REQ-014). */
export function resolveOutcome(allyBase: Health, enemyBase: Health): BattleOutcome {
  if (isDead(allyBase)) {
    return 'defeat';
  }

  if (isDead(enemyBase)) {
    return 'victory';
  }

  return 'ongoing';
}

/**
 * What each mode counts as a win, given the thing it is fighting.
 *
 * Written as a total record keyed on `GameMode` rather than as a `switch` over
 * mode names, and that shape is required rather than preferred. AC-002 counts
 * quoted mode identifiers across `src/scenes/` and `src/systems/` and expects
 * none, comments included: a switch whose case labels spelled the modes out
 * would be this module keeping its own copy of the mode list, which is the
 * second place REQ-001 exists to prevent. A record keyed on the type carries no
 * list — the compiler refuses it if a mode is missing and refuses a key that is
 * not a mode, so it cannot drift from the union the way a written-out list can.
 *
 * Defeat is deliberately not among these. It is the one rule all three modes
 * share, so it is applied once, above, rather than repeated three times where
 * two could agree and the third quietly differ.
 */
const MODE_VICTORY_RULES: Readonly<
  Record<GameMode, (allyBase: Health, target: Health | null) => BattleOutcome>
> = {
  // REQ-005 — delegates to the two-base function rather than restating it.
  // This delegation is the entire reason the mode-aware resolver lives in this
  // module instead of a new one: a separate module could not call this function
  // without importing it, C-1 forbids that import, and giving up the delegation
  // would put the campaign's win rule in two places. Two copies of a rule do
  // not error when they disagree — they just decide different games.
  campaign: (allyBase, target) => (target === null ? 'ongoing' : resolveOutcome(allyBase, target)),
  // REQ-008 / REQ-024 — survival cannot be won, and this branch is why: there
  // is no expression here that produces 'victory'. The requirement is not
  // "implemented and no victory case written", it is unrepresentable. And while
  // the ally base stands the run is ongoing, which is REQ-024 — without it a
  // branch returning defeat outright would satisfy both "never victory" and
  // "defeat when the base falls", and be a game lost on entry.
  survival: () => 'ongoing',
  // REQ-017 — the boss, not a base, is what has to fall.
  boss: (_allyBase, target) => (target !== null && isDead(target) ? 'victory' : 'ongoing'),
};

// @MX:ANCHOR: [AUTO] Mode-aware battle adjudication — the single place deciding
// how a battle of any mode ends.
// @MX:REASON: BattleScene calls this every frame for all three modes, and it is
// the only path to an outcome. It inherits `resolveOutcome`'s ally-first
// tie-break by putting the defeat check above the per-mode rules; reordering
// that check is the same silent behaviour change the note on `resolveOutcome`
// warns about, one level up.
/**
 * Adjudicates a battle of any mode (REQ-005).
 *
 * `target` is what this mode has to destroy to win: the enemy base in campaign,
 * the boss in a boss battle, and nothing at all in survival.
 *
 * The ally-base check runs first and outside the per-mode rules, which carries
 * the tie-break `resolveOutcome` pins down (see the note above it) into all
 * three modes unchanged. Both sides can reach zero on one frame; with the
 * priority fixed here, that situation reads as a defeat in every mode rather
 * than differing between them or between runs. Moving this check below the
 * dispatch would change game behaviour without failing to compile.
 */
export function resolveModeOutcome(
  mode: GameMode,
  allyBase: Health,
  target: Health | null,
  hero?: Health,
): BattleOutcome {
  if (isDead(allyBase) || (hero !== undefined && isDead(hero))) {
    return 'defeat';
  }

  return MODE_VICTORY_RULES[mode](allyBase, target);
}

// --- SPEC-UNIT-ROSTER-001 ---
// @MX:NOTE: [AUTO] Appended rather than interleaved with the exports above:
// `applyDamage` and every other existing export keep their exact signatures
// and behaviour (REQ-012, C-10) — nothing above this line changes.

// @MX:NOTE: [AUTO] Clamped to [0, 100] rather than trusted, even though every
// caller in this SPEC passes a `damageReductionPercent` already declared in
// that range (types/unit.ts, types/stage.ts). A negative value would amplify
// damage instead of reducing it, and a value past 100 would invert into
// healing — both are a different rule than REQ-012 describes, so the clamp
// keeps this function correct even against a value this SPEC does not itself
// produce.
/**
 * Raw damage reduced by `reductionPercent` (REQ-012), rounded to a whole
 * number so the result composes with the integer health `applyDamage`
 * already expects. `applyDamage` itself is unchanged — this is one more pure
 * function placed in front of it, not a replacement.
 */
export function mitigatedDamage(rawDamage: number, reductionPercent: number): number {
  const clampedPercent = Math.min(100, Math.max(0, reductionPercent));

  return Math.round(rawDamage * (1 - clampedPercent / 100));
}

/** Passive recovery caps at max HP and never revives a fallen character. */
export function regenerateHealth(health: Health, deltaMs: number, perSecond: number): Health {
  if (isDead(health)) return health;
  return {
    ...health,
    current: Math.min(health.max, health.current + (Math.max(0, deltaMs) * perSecond) / 1000),
  };
}
