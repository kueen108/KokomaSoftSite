import { describe, expect, it } from 'vitest';

import {
  applyDamage,
  canAttack,
  consumeAttackCost,
  isDead,
  regenerateMana,
  resolveModeOutcome,
  resolveOutcome,
  tickCooldown,
} from '../../src/systems/CombatSystem';
import type { AttackState, Health } from '../../src/types/combat';

/**
 * Fixtures are written out literally rather than imported from `balance.ts`.
 * The acceptance criteria fix these numbers, so a later balance tuning pass
 * must not be able to silently move what these tests assert.
 */
function health(current: number, max = current): Health {
  return { current, max };
}

function attackState(overrides: Partial<AttackState> = {}): AttackState {
  return {
    cooldownRemainingMs: 0,
    cooldownMs: 500,
    mana: 100,
    manaMax: 100,
    manaRegenPerSec: 20,
    attackCost: 25,
    ...overrides,
  };
}

describe('applyDamage', () => {
  // AC-008c
  it('subtracts the damage from current health', () => {
    expect(applyDamage(health(30), 20).current).toBe(10);
  });

  // AC-008c — clamps at zero rather than going negative
  it('floors health at zero when damage exceeds what remains', () => {
    const afterFirstHit = applyDamage(health(30), 20);

    expect(applyDamage(afterFirstHit, 20).current).toBe(0);
  });

  it('leaves the maximum untouched', () => {
    expect(applyDamage(health(30, 30), 20).max).toBe(30);
  });

  // REQ-013 — pure function, argument is not mutated
  it('returns a new object without mutating the health it was given', () => {
    const before = health(30);

    applyDamage(before, 20);

    expect(before.current).toBe(30);
  });
});

describe('isDead', () => {
  it('reports alive while health remains', () => {
    expect(isDead(health(10, 30))).toBe(false);
  });

  // AC-008c
  it('reports dead once health reaches zero', () => {
    expect(isDead(health(0, 30))).toBe(true);
  });

  it('reports dead when health has gone negative', () => {
    expect(isDead({ current: -5, max: 30 })).toBe(true);
  });
});

describe('canAttack', () => {
  // AC-007a
  it('allows the attack when cooldown is clear and mana covers the cost', () => {
    expect(canAttack(attackState())).toBe(true);
  });

  // AC-007a — boundary: mana exactly equal to the cost still passes
  it('allows the attack when mana exactly equals the cost', () => {
    expect(canAttack(attackState({ mana: 25 }))).toBe(true);
  });

  // AC-009a
  it('blocks the attack while the cooldown is still running', () => {
    expect(canAttack(attackState({ cooldownRemainingMs: 1 }))).toBe(false);
  });

  // AC-009b
  it('blocks the attack when mana is one short of the cost', () => {
    expect(canAttack(attackState({ mana: 24 }))).toBe(false);
  });
});

describe('consumeAttackCost', () => {
  // AC-007b
  it('deducts the attack cost from the mana pool', () => {
    expect(consumeAttackCost(attackState()).mana).toBe(75);
  });

  // AC-007b
  it('starts the cooldown at its full configured length', () => {
    expect(consumeAttackCost(attackState()).cooldownRemainingMs).toBe(500);
  });

  // AC-007b / REQ-013 — pure function, argument is not mutated
  it('returns a new state without mutating the state it was given', () => {
    const before = attackState();

    consumeAttackCost(before);

    expect(before.mana).toBe(100);
    expect(before.cooldownRemainingMs).toBe(0);
  });
});

describe('regenerateMana', () => {
  // AC-010a
  it('adds one second of regeneration over a one second step', () => {
    expect(regenerateMana(attackState({ mana: 50 }), 1000).mana).toBe(70);
  });

  // AC-010b
  it('caps regeneration at the maximum instead of overflowing past it', () => {
    expect(regenerateMana(attackState({ mana: 95 }), 1000).mana).toBe(100);
  });

  it('scales regeneration by the elapsed time', () => {
    expect(regenerateMana(attackState({ mana: 50 }), 500).mana).toBe(60);
  });

  // REQ-013 — pure function, argument is not mutated
  it('returns a new state without mutating the state it was given', () => {
    const before = attackState({ mana: 50 });

    regenerateMana(before, 1000);

    expect(before.mana).toBe(50);
  });
});

describe('tickCooldown', () => {
  it('counts the cooldown down by the elapsed time', () => {
    expect(tickCooldown(attackState({ cooldownRemainingMs: 500 }), 200).cooldownRemainingMs).toBe(
      300,
    );
  });

  it('floors the cooldown at zero rather than going negative', () => {
    expect(tickCooldown(attackState({ cooldownRemainingMs: 100 }), 400).cooldownRemainingMs).toBe(
      0,
    );
  });

  // REQ-013 — pure function, argument is not mutated
  it('returns a new state without mutating the state it was given', () => {
    const before = attackState({ cooldownRemainingMs: 500 });

    tickCooldown(before, 200);

    expect(before.cooldownRemainingMs).toBe(500);
  });
});

describe('resolveOutcome', () => {
  // AC-014a
  it('reports victory when the enemy base has fallen and the ally base stands', () => {
    expect(resolveOutcome(health(100), health(0, 200))).toBe('victory');
  });

  // AC-014b
  it('reports defeat when the ally base has fallen', () => {
    expect(resolveOutcome(health(0, 100), health(100, 200))).toBe('defeat');
  });

  // AC-014c
  it('reports ongoing while both bases stand', () => {
    expect(resolveOutcome(health(100), health(100, 200))).toBe('ongoing');
  });

  // AC-014d — the tie-break the requirement pins down: ally collapse wins.
  // Reachable in one frame when an enemy attack tick and a player hit land together.
  it('reports defeat when both bases fall on the same frame', () => {
    expect(resolveOutcome(health(0, 100), health(0, 200))).toBe('defeat');
  });

  // AC-014d
  it('reports defeat when both bases are driven negative on the same frame', () => {
    expect(resolveOutcome({ current: -5, max: 100 }, { current: -20, max: 200 })).toBe('defeat');
  });
});

/**
 * The three equivalence classes `isDead` distinguishes: alive, exactly spent,
 * and driven past zero by overkill. Every combination below is built from these
 * so that nothing about the boundary at zero is left unexercised.
 */
const HEALTH_CASES = [
  { label: 'positive', value: 100 },
  { label: 'zero', value: 0 },
  { label: 'negative', value: -20 },
] as const;

describe('resolveModeOutcome — campaign equivalence', () => {
  // AC-006 — the nine combinations, each compared against the existing
  // two-base function rather than against a written-down expectation.
  //
  // Comparing to the old function is the whole point. REQ-005 does not ask for
  // a correct answer, it asks for the *same* answer: a literal expectation that
  // disagreed with the shipped behaviour would let this pass while the campaign
  // quietly changed under four SPECs' worth of tests that never call the new
  // path.
  //
  // The two paths are structurally identical — the new one delegates here, and
  // both check the ally base first — so this criterion re-confirms by execution
  // what was already established by reading. Reading and running are different
  // evidence, and this is the one function every prior SPEC depends on.
  it.each(HEALTH_CASES.flatMap((ally) => HEALTH_CASES.map((enemy) => ({ ally, enemy }))))(
    'answers as resolveOutcome does for $ally.label ally and $enemy.label enemy',
    ({ ally, enemy }) => {
      const allyBase = health(ally.value, 100);
      const enemyBase = health(enemy.value, 200);

      expect(resolveModeOutcome('campaign', allyBase, enemyBase)).toBe(
        resolveOutcome(allyBase, enemyBase),
      );
    },
  );

  // The tie-break the `@MX:NOTE` above `resolveOutcome` pins down, restated
  // against the mode-aware path because that path is what the battle now calls.
  // An enemy attack tick and a player hit can land on the same frame and empty
  // both bases together; the ally check comes first so the same situation
  // cannot report victory on one run and defeat on the next.
  it('keeps the ally-first tie-break when both bases fall together', () => {
    expect(resolveModeOutcome('campaign', health(0, 100), health(0, 200))).toBe('defeat');
  });

  // The signature admits a null target because survival has none. Campaign
  // always has an enemy base, so this is unreachable from the battle — it is
  // covered because an unreachable branch that returns the wrong thing is still
  // a branch, and "no target" cannot mean "won".
  it('reports ongoing for a campaign battle handed no target', () => {
    expect(resolveModeOutcome('campaign', health(100), null)).toBe('ongoing');
  });
});

describe('resolveModeOutcome — survival', () => {
  const TARGET_CASES = [...HEALTH_CASES, { label: 'absent', value: null }] as const;

  const combinations = HEALTH_CASES.flatMap((ally) =>
    TARGET_CASES.map((target) => ({ ally, target })),
  );

  // AC-009 — REQ-008. Twelve combinations and not one of them wins.
  //
  // A target is passed in at all — survival has no enemy base, so that argument
  // is empty in play — precisely to catch an implementation that fell through
  // to the campaign branch by accident. Testing only the empty case would let
  // that mistake past, because the empty case answers correctly either way.
  it.each(combinations)(
    'never reports victory for $ally.label ally and $target.label target',
    ({ ally, target }) => {
      const outcome = resolveModeOutcome(
        'survival',
        health(ally.value, 100),
        target.value === null ? null : health(target.value, 200),
      );

      expect(outcome).not.toBe('victory');
    },
  );

  // AC-009 — REQ-009. The ally base falling is the only way a survival run ends.
  it.each(combinations.filter(({ ally }) => ally.value <= 0))(
    'reports defeat once the ally base has fallen, with a $target.label target',
    ({ ally, target }) => {
      const outcome = resolveModeOutcome(
        'survival',
        health(ally.value, 100),
        target.value === null ? null : health(target.value, 200),
      );

      expect(outcome).toBe('defeat');
    },
  );

  // AC-009 — REQ-024, and the reason that requirement exists. "Never victory"
  // and "defeat when the base falls" are both satisfied by a branch that
  // returns defeat unconditionally — a game lost the instant it is entered.
  // Nothing else in the criteria would have caught it.
  it.each(combinations.filter(({ ally }) => ally.value > 0))(
    'reports ongoing while the ally base stands, with a $target.label target',
    ({ ally, target }) => {
      const outcome = resolveModeOutcome(
        'survival',
        health(ally.value, 100),
        target.value === null ? null : health(target.value, 200),
      );

      expect(outcome).toBe('ongoing');
    },
  );
});

describe('resolveModeOutcome — boss', () => {
  // AC-018 — REQ-017, all three clauses across four combinations.
  it('reports victory when the boss falls and the ally base stands', () => {
    expect(resolveModeOutcome('boss', health(100), health(0, 600))).toBe('victory');
  });

  it.each([
    { label: 'a live boss', boss: 600 },
    { label: 'a fallen boss', boss: 0 },
  ])('reports defeat when the ally base has fallen against $label', ({ boss }) => {
    expect(resolveModeOutcome('boss', health(0, 100), health(boss, 600))).toBe('defeat');
  });

  it('reports ongoing while both the ally base and the boss stand', () => {
    expect(resolveModeOutcome('boss', health(100), health(300, 600))).toBe('ongoing');
  });

  // The ally-first tie-break again, on the mode whose target is not a base. The
  // boss's death blow and its own attack tick can land on the same frame.
  it('keeps the ally-first tie-break when the boss and the base fall together', () => {
    expect(resolveModeOutcome('boss', health(0, 100), health(0, 600))).toBe('defeat');
  });

  // A boss battle with no boss cannot be won. Unreachable from the battle — the
  // launch payload cannot express it (design.md §1.3) — but "no target" must
  // not read as "target destroyed" in the function itself.
  it('reports ongoing for a boss battle handed no target', () => {
    expect(resolveModeOutcome('boss', health(100), null)).toBe('ongoing');
  });
});
