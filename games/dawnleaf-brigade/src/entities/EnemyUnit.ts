// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-7);
// advance and contact behaviour are verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
// @MX:NOTE: [AUTO] Since SPEC-CAMPAIGN-STAGE-001 this class holds NO combat
// numbers of its own and imports none from src/config/balance. All four arrive
// per instance in the `EnemyDefinition` the constructor is given, which is what
// lets two kinds coexist and a later stage field a sturdier enemy than an
// earlier one. Do not reintroduce a module-level constant here: it would apply
// to every enemy in every stage at once, which is the exact structure this
// change removed (REQ-003, REQ-017, AC-018).
import Phaser from 'phaser';

import { applyDamage, isDead, mitigatedDamage } from '../systems/CombatSystem';
import type { DamageResult, Health } from '../types/combat';
import type { EnemyDefinition, EnemyKind } from '../types/stage';
import type { EngagedTarget, UnitStats } from '../types/unit';

/**
 * An enemy. Advances toward the ally base, stops on contact, and then attacks
 * on its own interval.
 *
 * It walks straight past the Paladog without stopping — the Paladog is still
 * not a target (spec.md §5). Since Phase 2 an ally unit is, and it outranks the
 * ally base when both are in reach (REQ-006).
 *
 * Its four combat numbers arrive as a definition rather than being read from
 * the shared constants (REQ-003). Module-level constants meant every enemy in
 * the game shared one set of numbers, so there was no way to make a later
 * stage's enemies sturdier without making the first stage's sturdier too — the
 * difficulty curve was unreachable from here, not merely unimplemented.
 * `AllyUnit` was already built this way; this is alignment with an existing
 * pattern rather than a new one (research.md §D).
 */
export class EnemyUnit extends Phaser.Physics.Arcade.Sprite {
  /** Which kind this is, so the scene can tell them apart without a cast. */
  readonly enemyKind: EnemyKind;
  /**
   * How far this enemy can attack without contact (SPEC-UNIT-ROSTER-001
   * REQ-003, REQ-006). Zero means melee — today's behaviour, unchanged.
   */
  readonly attackRange: number;

  private stats: UnitStats;
  private damageTakenMultiplier = 1;
  private slowRemainingMs = 0;
  slow(ms: number): void {
    this.slowRemainingMs = Math.max(this.slowRemainingMs, ms);
  }
  tickStatus(delta: number): void {
    this.slowRemainingMs = Math.max(0, this.slowRemainingMs - delta);
  }

  private readonly damageReductionPercent: number;
  private health: Health;
  readonly baseStats: UnitStats;
  private engaged = false;
  // null while engaged means the ally base — the Phase 1 arrangement, where
  // the scene applies tick() damage to the base it already holds. A non-null
  // value is an ally unit, which takes its own damage instead.
  private unitTarget: EngagedTarget | null = null;
  private attackTimerMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: EnemyDefinition) {
    super(scene, x, y, definition.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1 - 30 / this.height);
    (this.body as Phaser.Physics.Arcade.Body).setSize(this.width * 0.6, this.height * 0.7);

    this.enemyKind = definition.kind;
    this.stats = definition.baseStats;
    this.baseStats = definition.baseStats;
    this.attackRange = definition.attackRange;
    this.damageReductionPercent = definition.damageReductionPercent;
    this.health = { current: this.stats.maxHp, max: this.stats.maxHp };
  }

  // @MX:WARN: [AUTO] Call this AFTER adding the enemy to its physics group,
  // never from the constructor.
  // @MX:REASON: Phaser's Arcade Group applies its own defaults to every child
  // passed to `add()`, and those defaults include setVelocityX(0). Setting the
  // velocity during construction therefore looks correct and is silently
  // undone a line later: enemies stand still at their spawn point, no test
  // fails, and the battle simply never resolves. Observed exactly that way in
  // a browser before this was split out of the constructor.
  /** Begins the advance toward the ally base (REQ-011). */
  startAdvance(): void {
    this.engaged = false;
    this.unitTarget = null;
    this.attackTimerMs = 0;
    this.setVelocityX(-this.stats.speed);
  }

  /**
   * Called on contact with the ally base. Halts the advance.
   *
   * Signature and behaviour unchanged from Phase 1 (C-9): the ally base is
   * still the implicit target, so the existing overlap handler needs no edit.
   */
  engage(): void {
    if (this.engaged) {
      return;
    }

    this.engaged = true;
    this.setVelocityX(0); // AC-013a: stops here and advances no further
    this.attackTimerMs = 0;
  }

  /**
   * Called on contact with an ally unit. Takes priority over the ally base
   * (REQ-006).
   *
   * The priority is stated rather than left to whichever overlap Phaser
   * happens to report first — with two candidates and no pinned order, the
   * same situation resolves differently between runs. Preferring the base
   * would be worse than arbitrary: an ally unit standing in front of the base
   * would not protect it, and there would be no reason to summon one.
   */
  engageUnit(target: EngagedTarget): void {
    // Already busy with a live ally unit: keep hitting it. The overlap
    // callback fires every frame for every overlapping pair, so switching on
    // each call would reset the attack timer before the interval could ever
    // complete — the enemy would stand in contact dealing no damage, looking
    // perfectly normal. An enemy stopped at the ally base does pass this
    // check, which is what gives the ally unit priority (REQ-006).
    if (this.unitTarget !== null && this.unitTarget.active) {
      return;
    }

    this.engaged = true;
    this.unitTarget = target;
    this.attackTimerMs = 0;
    this.setVelocityX(0);
  }

  // @MX:WARN: [AUTO] The caller MUST run this every frame for every live
  // enemy. Skipping it raises no error and breaks no test.
  // @MX:REASON: Phase 1's engage() was a one-way transition because the ally
  // base never dies before the battle does. An ally unit does. Without this,
  // an enemy whose target died stands where it stood forever: the ally base
  // stops taking damage, no enemy ever reaches it, and the battle neither
  // crashes nor ends — it just never resolves, with nothing on screen looking
  // wrong (design.md §5.1, AC-008).
  /** Drops a dead ally-unit target and resumes the advance toward the base. */
  refreshTarget(): void {
    const target = this.unitTarget;
    if (target === null) return;
    const range =
      target.active && target instanceof Phaser.Physics.Arcade.Sprite
        ? this.attackRange ||
          (this.body as Phaser.Physics.Arcade.Body).halfWidth +
            (target.body as Phaser.Physics.Arcade.Body).halfWidth +
            12
        : Infinity;
    if (
      target.active &&
      (!(target instanceof Phaser.Physics.Arcade.Sprite) || Math.abs(target.x - this.x) <= range)
    )
      return;
    this.unitTarget = null;
    this.engaged = false;
    this.attackTimerMs = 0;
    this.setVelocityX(-this.stats.speed);
  }

  /** The ally unit being attacked, or null when the target is the ally base. */
  currentUnitTarget(): EngagedTarget | null {
    return this.unitTarget;
  }

  /** True while stopped and attacking something — an ally unit or the ally
   * base — regardless of which (SPEC-UNIT-ROSTER-001 REQ-006, REQ-011). */
  isEngaged(): boolean {
    return this.engaged;
  }

  /**
   * Applies this frame's effective stats (SPEC-UNIT-ROSTER-001 REQ-017) —
   * the enemy-side mirror of `AllyUnit.applyStats`. No enemy had a stat
   * source to re-apply before an overseer's aura existed, which is why
   * `stats` was `readonly` until this SPEC.
   *
   * Re-applies velocity while advancing, for the same reason
   * `AllyUnit.applyStats` does: a speed buff should be felt the moment the
   * overseer's aura reaches this enemy, not at the next engagement.
   */
  applyStats(stats: UnitStats, damageTakenMultiplier = 1): void {
    this.stats = { ...stats, speed: stats.speed * (this.slowRemainingMs > 0 ? 0.6 : 1) };
    this.damageTakenMultiplier = damageTakenMultiplier;

    if (!this.engaged) {
      this.setVelocityX(-this.stats.speed);
    }
  }

  /**
   * Advances the attack clock by one frame.
   *
   * Returns the damage to apply to the ally base this frame — non-zero only on
   * the frames where a full attack interval has elapsed, so the base loses
   * health once per interval rather than once per frame (AC-013b).
   */
  tick(deltaMs: number): number {
    if (!this.engaged) {
      return 0;
    }

    this.attackTimerMs += deltaMs;

    if (this.attackTimerMs < this.stats.attackIntervalMs) {
      return 0;
    }

    // Subtract rather than reset, so a long frame does not silently swallow
    // the overshoot and drift the attack rhythm slower than configured.
    this.attackTimerMs -= this.stats.attackIntervalMs;

    return this.stats.attackDamage;
  }

  // @MX:NOTE: [AUTO] Same routing as AllyUnit.takeDamage — mitigatedDamage
  // ahead of applyDamage, not a replacement for it (SPEC-UNIT-ROSTER-001
  // REQ-012, C-10).
  getHealth(): Health {
    return this.health;
  }

  receivedDamage(amount: number): number {
    return mitigatedDamage(amount * this.damageTakenMultiplier, this.damageReductionPercent);
  }

  takeDamage(amount: number): DamageResult {
    this.health = applyDamage(this.health, this.receivedDamage(amount));

    return { health: this.health, dead: isDead(this.health) };
  }
}
