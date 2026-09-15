// @MX:ANCHOR: [AUTO] The battle-gold rule module — the whole lifetime of the
// in-battle pool, the summon gate, and the settlement paid at the end.
// @MX:REASON: Holds the boundary between the game's two currencies, which is a
// design decision rather than an implementation detail (design.md §3).
// BattleScene reads it every frame and on every kill, summon and battle end.
// Engine-independent by contract (REQ-023) so the gate and the settlement stay
// testable without a browser.
import type { BattleOutcome } from '../types/combat';
import type { AllyUnitType, UnitDefinition } from '../types/unit';
import { ALLY_UNIT_TYPES } from '../types/unit';

const SETTLEMENT_VICTORY_GOLD = 120;
const SETTLEMENT_DEFEAT_GOLD = 40;

/**
 * The in-battle economy: gold, per-type summon cooldowns, and the population
 * count. Lives exactly as long as one battle (REQ-011) and is never persisted.
 */
export interface BattleEconomy {
  readonly gold: number;
  readonly cooldownRemainingMs: Readonly<Record<AllyUnitType, number>>;
  readonly liveUnitCount: number;
  readonly populationLimit: number;
}

/**
 * Opens a battle on the configured amount (REQ-011, start boundary).
 *
 * Rebuilding rather than carrying over is what makes a retry a genuine restart
 * — if gold were the one thing that survived, retrying would make the player
 * steadily richer and quietly undo the reset.
 */
export function initialBattleEconomy(startingGold: number, populationLimit: number): BattleEconomy {
  const cooldownRemainingMs = {} as Record<AllyUnitType, number>;

  for (const type of ALLY_UNIT_TYPES) {
    cooldownRemainingMs[type] = 0;
  }

  return { gold: startingGold, cooldownRemainingMs, liveUnitCount: 0, populationLimit };
}

/**
 * The summon gate: unlocked, affordable, off cooldown, and room in the
 * population (REQ-001).
 *
 * A press that fails this check is discarded outright — the caller must not
 * hold it for replay when the gate reopens (REQ-002). Queuing looks like a
 * courtesy and makes both the cooldown and the population limit mean nothing,
 * the same trap `canAttack` documents in CombatSystem.
 */
export function canSummon(
  economy: BattleEconomy,
  definition: UnitDefinition,
  unlocked: readonly AllyUnitType[],
): boolean {
  return (
    unlocked.includes(definition.type) &&
    economy.gold >= definition.summonCost &&
    economy.cooldownRemainingMs[definition.type] <= 0 &&
    economy.liveUnitCount < economy.populationLimit
  );
}

/** Charges the cost, starts that type's cooldown, and takes a slot (REQ-001). */
export function applySummon(economy: BattleEconomy, definition: UnitDefinition): BattleEconomy {
  return {
    ...economy,
    gold: economy.gold - definition.summonCost,
    cooldownRemainingMs: {
      ...economy.cooldownRemainingMs,
      [definition.type]: definition.summonCooldownMs,
    },
    liveUnitCount: economy.liveUnitCount + 1,
  };
}

/** Counts every summon cooldown down by one elapsed step, never below zero. */
export function tickSummonCooldowns(economy: BattleEconomy, deltaMs: number): BattleEconomy {
  const cooldownRemainingMs = {} as Record<AllyUnitType, number>;

  for (const type of ALLY_UNIT_TYPES) {
    cooldownRemainingMs[type] = Math.max(0, economy.cooldownRemainingMs[type] - deltaMs);
  }

  return { ...economy, cooldownRemainingMs };
}

// @MX:NOTE: [AUTO] REQ-005 requires this to be called for every ally unit
// death, and the failure mode if it is not is slow and silent: the population
// limit stops meaning "units alive" and starts meaning "units ever summoned",
// so the game keeps running normally and simply refuses to summon anything a
// few minutes in, with no error to trace back here.
/** Returns one population slot after an ally unit dies (REQ-005). */
export function releasePopulationSlot(economy: BattleEconomy): BattleEconomy {
  return { ...economy, liveUnitCount: Math.max(0, economy.liveUnitCount - 1) };
}

/** Adds a killed enemy's bounty to the battle pool (REQ-012). */
export function awardBounty(economy: BattleEconomy, bounty: number): BattleEconomy {
  return { ...economy, gold: economy.gold + bounty };
}

// @MX:ANCHOR: [AUTO] The end boundary of the battle pool's lifetime: whatever
// gold is left when the battle ends is discarded, not settled (REQ-011).
// @MX:REASON: The economy argument is deliberately unread, and that is the
// entire point of the signature. Taking the pool and ignoring it is what lets
// AC-020 prove the discard by calling this with two different balances and
// getting one answer — an absence that cannot be observed directly otherwise.
// Reading `economy.gold` here, even partially, inverts the game's incentive:
// unspent gold would become permanent wealth, and the optimal play in a system
// built to encourage summoning would be to summon nothing (design.md §3). A
// 10% refund was tried and produced exactly that — a hoarder settled 620
// against a spender's 120.
/** The settlement paid for a finished battle, from its outcome alone (REQ-014). */
export function computeSettlement(_economy: BattleEconomy, outcome: BattleOutcome): number {
  if (outcome === 'victory') {
    return SETTLEMENT_VICTORY_GOLD;
  }

  if (outcome === 'defeat') {
    return SETTLEMENT_DEFEAT_GOLD;
  }

  return 0;
}

// Appended, and every declaration above is untouched (C-5, and the same
// append-only habit gameConfig.ts records). Pure arithmetic, put here rather
// than in the widget that draws it because src/systems/ is the only directory
// coverage counts and the only one a test can reach without a browser
// (plan.md D-6). A fraction computed inside SummonBar would have its four
// boundaries checkable only by eye, in a browser, one frame at a time.

/**
 * How full a slot's cooldown indicator is drawn (REQ-002).
 *
 * Fills toward READY: 0 the instant a unit is summoned, 1 when the slot can be
 * summoned again. That direction follows the bar this game already has —
 * HealthBar is full when things are well — and it answers the question a
 * player actually asks, which is "can I use it", not "how long has it been".
 *
 * Clamped to [0, 1] because neither end is guaranteed by the caller. A
 * remaining time above the whole cooldown, or below zero, or a cooldown length
 * of zero, would otherwise reach the drawing step as a number outside the unit
 * interval — or as Infinity or NaN — and a Graphics accepts all three in
 * silence, so the bar would simply look wrong with nothing raised anywhere.
 *
 * A non-positive length is answered with 1 rather than with the 0 the clamp
 * alone would give: a cooldown of zero length means the slot is *always* ready,
 * and drawing "always ready" as permanently empty would be the same kind of
 * screen that lies without erroring that this SPEC exists to fix. The shape
 * looks like HealthBar's `max > 0 ? ... : 0`, and the opposite answer is
 * deliberate — a health bar with no maximum really is empty, a cooldown with
 * no length really is finished.
 */
export function summonCooldownFillFraction(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
}
