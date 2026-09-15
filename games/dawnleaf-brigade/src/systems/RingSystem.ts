// @MX:ANCHOR: [AUTO] The single source of every ring number — what a ring
// costs to buy and to upgrade, and what attack numbers the worn ring produces.
// @MX:REASON: The save holds ring levels only; the attack numbers a battle
// fights with are recomputed here at every battle start (REQ-002), so this file
// is what keeps an old save valid after a balance change. BattleScene and
// UpgradeScene both read through it — the two ends of the loop this SPEC
// closes. It is engine-independent by contract (REQ-015) and contains no
// randomness of any kind (REQ-012, verified by AC-011): unlock and upgrade are
// 100% success, never a draw.
//
// Separate from UpgradeSystem on purpose (C-4). The two look alike, but a ring
// has a level ceiling a unit does not, and a unit has a summon cost and
// cooldown a ring does not. Merged, one function would carry the union of both
// rule sets and each branch would stay live on calls it does not apply to.
import type { AttackParams, RingDefinition, RingType } from '../types/ring';
import type { PersistedState } from '../types/save';

// Matches UpgradeSystem's cost curve so the two growth rates read alike on one
// screen. The rounding floor that note warns about applies here too, and it is
// what AC-002 measures: at a small enough step Math.round pulls level N+1 back
// onto level N and an upgrade charges gold while changing nothing.
const RING_COST_STEP_PER_LEVEL = 0.75;

/** Outcome of a ring unlock, upgrade, equip or unequip: whether it happened,
 * and the state after.
 *
 * Deliberately not `UpgradeSystem.UpgradeResult`, though the shape is the same.
 * Sharing the type would make each module import the other, re-joining exactly
 * what C-4 separated. */
export interface RingResult {
  readonly succeeded: boolean;
  readonly state: PersistedState;
}

/** The stored upgrade level for one ring. */
export function ringLevel(state: PersistedState, type: RingType): number {
  return state.ringLevels[type];
}

export function isRingUnlocked(state: PersistedState, type: RingType): boolean {
  return state.ringsUnlocked.includes(type);
}

/** What the next upgrade costs, from the current level alone (REQ-002). */
export function ringUpgradeCost(definition: RingDefinition, currentLevel: number): number {
  return Math.round(definition.upgradeBaseCost * (1 + RING_COST_STEP_PER_LEVEL * currentLevel));
}

/**
 * The multiplier a level implies (REQ-002).
 *
 * Signed, so one formula serves both directions: the mana ring steps down and
 * the rupture ring steps up, and neither needs a branch here.
 */
export function ringMultiplier(definition: RingDefinition, level: number): number {
  return definition.baseMultiplier + definition.multiplierStepPerLevel * level;
}

/**
 * The Paladog's attack numbers with the worn ring applied (REQ-006, REQ-007).
 *
 * `null` means no ring, and that branch is not an edge case — it is half of
 * REQ-007. Without it a removed ring keeps acting: no error is raised, the
 * screen looks correct, and only the numbers are quietly wrong.
 *
 * The two branches are written out rather than folded into one computed-key
 * expression so that the promise AC-005 measures — a ring moves its own axis
 * and leaves the other at its configured value — is visible in the shape of
 * the code rather than inferred from it.
 */
export function effectiveAttackParams(
  base: AttackParams,
  definition: RingDefinition | null,
  level: number,
): AttackParams {
  if (definition === null) {
    return { ...base };
  }

  const multiplier = ringMultiplier(definition, level);

  if (definition.axis === 'attackCost') {
    return {
      attackCost: Math.round(base.attackCost * multiplier),
      projectileDamage: base.projectileDamage,
    };
  }

  return {
    attackCost: base.attackCost,
    projectileDamage: Math.round(base.projectileDamage * multiplier),
  };
}

export function canUnlockRing(state: PersistedState, definition: RingDefinition): boolean {
  return !isRingUnlocked(state, definition.type) && state.settlementGold >= definition.unlockCost;
}

/** Buys the ring (REQ-010). Buying is not wearing — see the equip note below. */
export function applyRingUnlock(state: PersistedState, definition: RingDefinition): RingResult {
  if (!canUnlockRing(state, definition)) {
    return { succeeded: false, state };
  }

  return {
    succeeded: true,
    state: {
      ...state,
      settlementGold: state.settlementGold - definition.unlockCost,
      ringsUnlocked: [...state.ringsUnlocked, definition.type],
      // Deliberately not equipped here. Wearing it would change the next
      // battle's numbers without the player having chosen to (REQ-003), and
      // REQ-004 makes wearing nothing a legitimate state to be left in.
    },
  };
}

/**
 * The two conditions REQ-011 names, and only those two: enough gold, and a
 * level below the ceiling.
 *
 * Being unlocked is deliberately not a third condition here. REQ-011 states
 * exactly two, and the screen already refuses a locked entry before it reaches
 * this call — the same division `UpgradeSystem.canUpgrade` and `UpgradeScene`
 * use for units, so a reader of one screen path is not learning two rules.
 */
export function canUpgradeRing(state: PersistedState, definition: RingDefinition): boolean {
  const level = ringLevel(state, definition.type);

  return level < definition.maxLevel && state.settlementGold >= ringUpgradeCost(definition, level);
}

/**
 * Raises the ring by exactly one level (REQ-011).
 *
 * The ceiling reports failure rather than silently doing nothing, and that
 * distinction is the whole point. A falling number cannot be extended forever —
 * a mana cost of zero deletes the mana economy — so instead of clamping the
 * value and leaving upgrades that take gold and change nothing, the operation
 * refuses and says so.
 */
export function applyRingUpgrade(state: PersistedState, definition: RingDefinition): RingResult {
  if (!canUpgradeRing(state, definition)) {
    return { succeeded: false, state };
  }

  const level = ringLevel(state, definition.type);

  return {
    succeeded: true,
    state: {
      ...state,
      settlementGold: state.settlementGold - ringUpgradeCost(definition, level),
      ringLevels: { ...state.ringLevels, [definition.type]: level + 1 },
    },
  };
}

/**
 * Wears a ring, displacing whatever was worn before (REQ-003, REQ-005).
 *
 * No unequip step is needed first: the slot holds one value, so writing to it
 * IS the replacement. That is also why REQ-005 needs no runtime check — "more
 * than one worn ring" is not a state this field can hold.
 */
export function equipRing(state: PersistedState, definition: RingDefinition): RingResult {
  if (!isRingUnlocked(state, definition.type)) {
    return { succeeded: false, state };
  }

  return { succeeded: true, state: { ...state, equippedRing: definition.type } };
}

/**
 * Takes the worn ring off (REQ-004).
 *
 * Only the slot is cleared. Unlock state and level stay exactly as they were —
 * treating unequip as "undo the ring" would delete what the player bought, and
 * it is the one path by which saved progress could disappear without an error.
 */
export function unequipRing(state: PersistedState): RingResult {
  if (state.equippedRing === null) {
    return { succeeded: false, state };
  }

  return { succeeded: true, state: { ...state, equippedRing: null } };
}
