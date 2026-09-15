import { validLevel } from './PolishSystem';
// @MX:ANCHOR: [AUTO] The single source of every upgrade and unlock number —
// what a level costs, and what stats that level produces.
// @MX:REASON: The save holds levels only; every stat the game fights with is
// recomputed here on each battle start (REQ-019), so this file is what makes an
// old save survive a balance change. BattleScene, UpgradeScene and the HUD all
// read through it. It is engine-independent by contract (REQ-023) and contains
// no randomness of any kind (REQ-018, verified by AC-022) — unlock and upgrade
// are 100% success, never a draw.
import type { PersistedState } from '../types/save';
import type { AllyUnitType, UnitDefinition, UnitStats } from '../types/unit';

// @MX:NOTE: [AUTO] These steps have a floor set by rounding, not by taste. At
// a small enough step, Math.round pulls level N+1 back onto level N's value
// and an upgrade charges gold while changing nothing — a failure that shows up
// as "upgrades feel fake" rather than as an error. 0.02 was tried and produced
// exactly that on the dealer's attack damage (14 -> 14). Any change here must
// keep every single level step strictly increasing for every unit definition.
export const UNIT_MAX_LEVEL = 5;
const HP_STEP_PER_LEVEL = 0.2;
const ATTACK_STEP_PER_LEVEL = 0.25;
const COST_STEP_PER_LEVEL = 0.75;

/** Outcome of an unlock or upgrade: whether it happened, and the state after. */
export interface UpgradeResult {
  readonly succeeded: boolean;
  readonly state: PersistedState;
}

/** The stored upgrade level for one ally type. */
export function upgradeLevel(state: PersistedState, type: AllyUnitType): number {
  return validLevel(state.upgradeLevels[type], UNIT_MAX_LEVEL);
}

/** What the next upgrade costs, from the current level alone (REQ-019). */
export function upgradeCost(definition: UnitDefinition, currentLevel: number): number {
  return Math.round(definition.upgradeBaseCost * (1 + COST_STEP_PER_LEVEL * currentLevel));
}

/**
 * The stats a level implies (REQ-019).
 *
 * Speed and attack interval are deliberately left at their base values:
 * upgrades are the power axis and the aura is the positioning axis, and an
 * upgrade that also moved speed would blur which of the two the player is
 * being shown.
 */
export function statsAtLevel(definition: UnitDefinition, level: number): UnitStats {
  level = validLevel(level, UNIT_MAX_LEVEL);
  const base = definition.baseStats;

  return {
    ...base,
    maxHp: Math.round(base.maxHp * (1 + HP_STEP_PER_LEVEL * level)),
    attackDamage: Math.round(base.attackDamage * (1 + ATTACK_STEP_PER_LEVEL * level)),
  };
}

export function isUnlocked(state: PersistedState, type: AllyUnitType): boolean {
  return state.unlocked.includes(type);
}

export function canUpgrade(state: PersistedState, definition: UnitDefinition): boolean {
  return (
    isUnlocked(state, definition.type) &&
    upgradeLevel(state, definition.type) < UNIT_MAX_LEVEL &&
    state.settlementGold >= upgradeCost(definition, upgradeLevel(state, definition.type))
  );
}

export function applyUpgrade(state: PersistedState, definition: UnitDefinition): UpgradeResult {
  if (!canUpgrade(state, definition)) {
    return { succeeded: false, state };
  }

  const level = upgradeLevel(state, definition.type);

  return {
    succeeded: true,
    state: {
      ...state,
      settlementGold: state.settlementGold - upgradeCost(definition, level),
      upgradeLevels: { ...state.upgradeLevels, [definition.type]: level + 1 },
    },
  };
}

export function canUnlock(state: PersistedState, definition: UnitDefinition): boolean {
  return !isUnlocked(state, definition.type) && state.settlementGold >= definition.unlockCost;
}

export function applyUnlock(state: PersistedState, definition: UnitDefinition): UpgradeResult {
  if (!canUnlock(state, definition)) {
    return { succeeded: false, state };
  }

  return {
    succeeded: true,
    state: {
      ...state,
      settlementGold: state.settlementGold - definition.unlockCost,
      unlocked: [...state.unlocked, definition.type],
    },
  };
}
