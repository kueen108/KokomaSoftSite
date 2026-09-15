// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-3); the
// rule this entity applies — which phase it is in — IS unit-tested in
// BossSystem, and advance and contact behaviour are verified by driving the
// real game in a browser (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending
// work.
// @MX:NOTE: [AUTO] This class holds no phase of its own. It asks BossSystem
// which phase it is in every frame and fights with what comes back. Do not add
// a `currentPhase` field: a remembered phase has to be updated by noticing each
// crossing, one large hit can cross two thresholds at once, and a missed
// crossing raises nothing — the boss simply keeps fighting with numbers from a
// phase it has left. Keeping the query here also keeps the rule inside the
// coverage denominator (design.md §6.2).
import Phaser from 'phaser';
import {
  ENEMY_AURA_ATTACK_MULTIPLIER,
  ENEMY_AURA_SPEED_MULTIPLIER,
  ENEMY_AURA_DAMAGE_TAKEN_MULTIPLIER,
} from '../config/balance';

import { bossPhaseAt } from '../systems/BossSystem';
import { applyDamage, isDead } from '../systems/CombatSystem';
import type { BossDefinition, BossPhase } from '../types/boss';
import type { DamageResult, Health } from '../types/combat';
import type { EngagedTarget } from '../types/unit';

/**
 * A boss. Advances toward the ally base, stops on contact, and attacks on the
 * interval its current phase specifies.
 *
 * Deliberately a separate class from `EnemyUnit` rather than a configuration of
 * it, and the duplication between them is real: advance, contact and attack
 * clock are nearly the same. The reason is that `EnemyUnit.stats` is fixed at
 * construction, a phase changes stats mid-battle, and making that field mutable
 * would alter the path every enemy in all three campaign stages travels — the
 * change SPEC-CAMPAIGN-STAGE-001 named as its own largest regression risk and
 * that C-11 now freezes. One boss is not worth disturbing it.
 *
 * The reversal condition is written down rather than left implicit: when a
 * second boss arrives there are two cases to generalise from, and extracting a
 * shared advance-and-attack base then has evidence behind it. With one, it
 * would be a guess (design.md §4.1).
 *
 * The Paladog and allies can intercept it before it reaches the ally base.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly definition: BossDefinition;

  private health: Health;
  private engaged = false;
  // null while engaged means the ally base, matching `EnemyUnit`'s arrangement:
  // the scene applies tick() damage to the base it already holds. A non-null
  // value is an ally unit, which takes its own damage instead.
  private unitTarget: EngagedTarget | null = null;
  private attackTimerMs = 0;
  private weakened = false;
  private auraAttack: number = ENEMY_AURA_ATTACK_MULTIPLIER;
  private auraSpeed: number = ENEMY_AURA_SPEED_MULTIPLIER;
  private auraIncoming: number = ENEMY_AURA_DAMAGE_TAKEN_MULTIPLIER;
  private slowRemainingMs = 0;
  slow(ms: number): void {
    this.slowRemainingMs = Math.max(this.slowRemainingMs, ms);
  }
  tickStatus(delta: number): void {
    this.slowRemainingMs = Math.max(0, this.slowRemainingMs - delta);
  }

  setAuraWeakened(
    inside: boolean,
    attack = ENEMY_AURA_ATTACK_MULTIPLIER,
    speed = ENEMY_AURA_SPEED_MULTIPLIER,
    incoming = ENEMY_AURA_DAMAGE_TAKEN_MULTIPLIER,
  ): void {
    this.auraAttack = attack;
    this.auraSpeed = speed;
    this.auraIncoming = incoming;
    this.weakened = inside;
  }
  outgoingDamage(amount: number): number {
    return Math.round(amount * (this.weakened ? this.auraAttack : 1));
  }
  receivedDamage(amount: number): number {
    return Math.round(amount * (this.weakened ? this.auraIncoming : 1));
  }
  private advanceSpeed(): number {
    return (
      this.activePhase().stats.speed *
      (this.weakened ? this.auraSpeed : 1) *
      (this.slowRemainingMs > 0 ? 0.6 : 1)
    );
  }

  constructor(scene: Phaser.Scene, x: number, y: number, definition: BossDefinition) {
    super(scene, x, y, definition.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1 - 30 / this.height);
    (this.body as Phaser.Physics.Arcade.Body).setSize(this.width * 0.6, this.height * 0.7);

    this.definition = definition;
    this.health = { current: definition.maxHp, max: definition.maxHp };
  }

  /** The phase this boss is in right now, asked fresh every time (REQ-014). */
  activePhase(): BossPhase {
    return bossPhaseAt(this.definition, this.health.current);
  }

  // @MX:WARN: [AUTO] Call this AFTER adding the boss to its physics group or
  // scene, never from the constructor.
  // @MX:REASON: The same hazard `EnemyUnit.startAdvance` records. Phaser's
  // Arcade Group applies its own defaults to every child passed to `add()`, and
  // those defaults include setVelocityX(0), so a velocity set during
  // construction is silently undone a line later: the boss stands at its spawn
  // point, no test fails, and the battle never resolves.
  /** Begins the advance toward the ally base at the current phase's speed. */
  startAdvance(): void {
    this.setVelocityX(-this.advanceSpeed());
  }

  /** Called on contact with the ally base. Halts the advance. */
  engage(): void {
    if (this.engaged) {
      return;
    }

    this.engaged = true;
    this.setVelocityX(0);
    this.attackTimerMs = 0;
  }

  /**
   * Called on contact with an ally unit, which takes priority over the ally
   * base (REQ-006).
   *
   * Already busy with a live ally unit means keep hitting it: the overlap
   * callback fires every frame for every overlapping pair, so switching on each
   * call would reset the attack clock before an interval could ever complete
   * and the boss would stand in contact dealing no damage at all.
   */
  engageUnit(target: EngagedTarget): void {
    if (this.unitTarget !== null && this.unitTarget.active) {
      return;
    }

    this.engaged = true;
    this.unitTarget = target;
    this.attackTimerMs = 0;
    this.setVelocityX(0);
  }

  // @MX:WARN: [AUTO] The caller MUST run this every frame while the boss is
  // alive. Skipping it raises no error and breaks no test.
  // @MX:REASON: Two separate things go quietly wrong. A boss whose ally-unit
  // target died stands where it stood for good, so the ally base stops taking
  // damage and the battle neither crashes nor ends — the same failure
  // `EnemyUnit.refreshTarget` documents. And because a phase changes movement
  // speed, the advance velocity is re-applied here rather than only at
  // `startAdvance()`; without it the boss keeps the speed of the phase it
  // started in while the HUD names a phase it is no longer moving like, and
  // AC-016 measures exactly that gap.
  /** Drops a dead ally-unit target, resumes the advance, and tracks the phase. */
  refreshTarget(): void {
    const target = this.unitTarget;
    const separated =
      target?.active &&
      target instanceof Phaser.Physics.Arcade.Sprite &&
      Math.abs(target.x - this.x) >
        (this.body as Phaser.Physics.Arcade.Body).halfWidth +
          (target.body as Phaser.Physics.Arcade.Body).halfWidth +
          12;
    if (target !== null && (!target.active || separated)) {
      this.unitTarget = null;
      this.engaged = false;
      this.attackTimerMs = 0;
    }

    if (!this.engaged) {
      this.setVelocityX(-this.advanceSpeed());
    }
  }

  /** The ally unit being attacked, or null when the target is the ally base. */
  currentUnitTarget(): EngagedTarget | null {
    return this.unitTarget;
  }

  /**
   * Advances the attack clock by one frame, using the current phase's numbers.
   *
   * Returns the damage to apply this frame — non-zero only on the frames where
   * a full interval has elapsed, so the target loses health once per interval
   * rather than once per frame.
   *
   * Both the interval and the damage are read from the phase on every call, so
   * a phase change takes effect on the next attack rather than the next battle.
   */
  tick(deltaMs: number): number {
    if (!this.engaged) {
      return 0;
    }

    const { attackDamage, attackIntervalMs } = this.activePhase().stats;

    this.attackTimerMs += deltaMs;

    if (this.attackTimerMs < attackIntervalMs) {
      return 0;
    }

    // Subtract rather than reset, so a long frame does not swallow the
    // overshoot and drift the rhythm slower than the phase specifies.
    this.attackTimerMs -= attackIntervalMs;

    return this.outgoingDamage(attackDamage);
  }

  takeDamage(amount: number): DamageResult {
    this.health = applyDamage(this.health, this.receivedDamage(amount));

    return { health: this.health, dead: isDead(this.health) };
  }

  getHealth(): Health {
    return this.health;
  }
}
