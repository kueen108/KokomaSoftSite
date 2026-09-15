import { Base } from './Base';
// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-8); the
// rules this delegates to — aura membership, effective stats, damage — ARE
// unit-tested in AuraSystem and CombatSystem, and the on-screen behaviour is
// verified by playing the game in a browser (tech.md @NAV:DEC-VERIFY-DUAL).
// This is not pending work.
import Phaser from 'phaser';

import { applyDamage, isDead, mitigatedDamage } from '../systems/CombatSystem';
import type { DamageResult, Health } from '../types/combat';
import type { AllyUnitType, EngagedTarget, UnitStats } from '../types/unit';

/**
 * Tint applied while a unit stands inside the aura (SPEC-UNIT-AURA-001
 * REQ-010, preserved by SPEC-CAMPAIGN-ART-001 REQ-005).
 *
 * The original 0xfff2a8 multiplied R/G/B by 1.00/0.95/0.66 and so only
 * removed blue. On the gold-dominant dealer sprite (#d8a13f) that moved each
 * visible pixel by 38 on average and was judged not visible in a browser
 * (plan.md D-3 predicted the dealer as the limit case). 0xffd24a moves the
 * dealer by 90 and the tanker by 126 per pixel, measured on the shipped PNGs.
 */
const AURA_TINT = 0xfff7df;

/** Glow colour: the same gold as the aura ring BattleScene draws. */
const AURA_GLOW_COLOR = 0xf5d76e;
const AURA_GLOW_OUTER_STRENGTH = 1.4;

/** Extra render padding so the glow is not clipped at the sprite's edge. */
const AURA_GLOW_PADDING = 8;

/**
 * A summoned ally. Advances toward the enemy base, stops on contact, and
 * attacks on its own interval (REQ-003, REQ-004).
 *
 * The mirror image of `EnemyUnit` — opposite direction, opposite targets — and
 * deliberately not refactored into a shared base class. Extracting the common
 * shape would turn direction, target side and stat source into three
 * parameters, so a reader would have to trace which way any given unit walks
 * instead of reading it (design.md §5). Two similar classes are cheaper than
 * that; if a third arrives, the judgement is worth revisiting.
 *
 * Unlike an enemy, its stats move: the aura re-evaluates every frame, so
 * `applyStats` is what a battle actually fights with, not `baseStats`.
 */
export class AllyUnit extends Phaser.Physics.Arcade.Sprite {
  /** Which type this is, so the scene can look up its per-frame stats. */
  readonly unitType: AllyUnitType;
  /**
   * How far this unit can attack without contact (SPEC-UNIT-ROSTER-001
   * REQ-003, REQ-005). Zero means melee — today's behaviour, unchanged.
   */
  readonly attackRange: number;

  private health: Health;
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
  private target: EngagedTarget | null = null;
  private advancing = false;
  private attackTimerMs = 0;
  private auraGlow: Phaser.FX.Glow | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    unitType: AllyUnitType,
    stats: UnitStats,
    textureKey: string,
    attackRange: number,
    damageReductionPercent: number,
  ) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1 - 30 / this.height);
    (this.body as Phaser.Physics.Arcade.Body).setSize(this.width * 0.6, this.height * 0.7);

    this.unitType = unitType;
    this.stats = stats;
    this.attackRange = attackRange;
    this.damageReductionPercent = damageReductionPercent;
    this.health = { current: stats.maxHp, max: stats.maxHp };
  }

  // @MX:WARN: [AUTO] Call this AFTER adding the unit to its physics group,
  // never from the constructor.
  // @MX:REASON: Phaser's Arcade Group applies its own defaults to every child
  // passed to `add()`, and those defaults include setVelocityX(0). A velocity
  // set during construction is silently wiped a line later: the unit stands on
  // its spawn point, the gold is spent, the population slot is taken, the HUD
  // is correct and no test fails — it simply never walks. Observed exactly that
  // way in a browser on both EnemyUnit and Projectile before each was split out
  // of its constructor (research.md §C-4).
  /** Begins the advance toward the enemy base (REQ-003). */
  startAdvance(): void {
    this.advancing = true;
    this.target = null;
    this.setVelocityX(this.stats.speed);
  }

  // @MX:WARN: [AUTO] This must ignore a new target while the current one is
  // still alive. Do not "improve" it into always taking the newest contact.
  // @MX:REASON: The overlap callback fires every frame for every overlapping
  // pair, so a unit touching two enemies at once would be re-engaged twice per
  // frame. Re-engaging resets the attack timer, so the interval would never
  // complete and the unit would stand in contact dealing no damage at all —
  // while looking entirely correct on screen.
  /** Stops and begins attacking `target` on contact (REQ-004). */
  engage(target: EngagedTarget): void {
    if (
      this.target === target ||
      (this.target !== null && this.target.active && !(this.target instanceof Base))
    ) {
      return;
    }

    this.advancing = false;
    this.target = target;
    this.attackTimerMs = 0;
    this.setVelocityX(0);
  }

  // @MX:WARN: [AUTO] The caller MUST run this every frame for every live ally
  // unit. Skipping it raises no error and breaks no test.
  // @MX:REASON: Without it a unit whose target has died stands still forever,
  // holding a population slot and never reaching the enemy base. The battle
  // does not crash and does not end — it simply stops progressing, which is
  // the hardest failure shape to trace (design.md §5.1).
  /** Drops a dead target and resumes the advance. */
  refreshTarget(): void {
    const target = this.target;
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
    this.startAdvance();
  }

  /**
   * Applies this frame's effective stats (REQ-008).
   *
   * Re-applies velocity while advancing so an aura speed buff is felt the
   * moment the Paladog comes into range, rather than at the next engagement.
   */
  applyStats(stats: UnitStats, damageTakenMultiplier = 1): void {
    this.stats = { ...stats, speed: stats.speed * (this.slowRemainingMs > 0 ? 0.6 : 1) };
    this.damageTakenMultiplier = damageTakenMultiplier;

    if (this.advancing) {
      this.setVelocityX(this.stats.speed);
    }
  }

  // @MX:WARN: [AUTO] Called every frame for every live ally unit
  // (BattleScene.refreshAura). The glow MUST be attached at most once.
  // @MX:REASON: preFX.addGlow appends a new controller on every call. Attached
  // per frame, controllers pile up until the frame rate collapses — with no
  // error and no failing test, since entities are not unit-tested (C-6).
  /** Marks the unit as inside or outside the aura on screen (REQ-010). */
  setAuraHighlight(inside: boolean): void {
    if (inside) {
      this.setTint(AURA_TINT);

      // preFX is null under the Canvas renderer; the tint alone carries the
      // highlight there. The glow does not touch the physics body, so contact
      // and hit points are unchanged (SPEC-CAMPAIGN-ART-001 AC-008).
      if (this.auraGlow === null && this.preFX !== null) {
        this.preFX.setPadding(AURA_GLOW_PADDING);
        this.auraGlow = this.preFX.addGlow(AURA_GLOW_COLOR, AURA_GLOW_OUTER_STRENGTH, 0);
      }

      return;
    }

    this.clearTint();

    if (this.auraGlow !== null) {
      // The glow is the only FX on an ally unit, so clearing removes exactly it.
      this.preFX?.clear();
      this.auraGlow = null;
    }
  }

  /**
   * Advances the attack clock by one frame.
   *
   * Returns the damage to apply to the current target this frame — non-zero
   * only on the frames where a full attack interval has elapsed, so a target
   * loses health once per interval rather than once per frame (REQ-004).
   */
  tick(deltaMs: number): number {
    if (this.target === null) {
      return 0;
    }

    this.attackTimerMs += deltaMs;

    if (this.attackTimerMs < this.stats.attackIntervalMs) {
      return 0;
    }

    // Subtract rather than reset, so a long frame does not silently swallow
    // the overshoot and drift the attack rhythm slower than configured — the
    // same reasoning as EnemyUnit.tick (research.md §C-5).
    this.attackTimerMs -= this.stats.attackIntervalMs;

    return this.stats.attackDamage;
  }

  /** What this unit is currently hitting, if anything. */
  currentTarget(): EngagedTarget | null {
    return this.target;
  }

  // @MX:NOTE: [AUTO] `mitigatedDamage` sits in front of `applyDamage` rather
  // than replacing it (SPEC-UNIT-ROSTER-001 REQ-012, C-10) — `applyDamage`'s
  // signature and behaviour are unchanged; this is one more pure function call
  // ahead of it. A `damageReductionPercent` of zero (every unit before this
  // SPEC) makes `mitigatedDamage` the identity, so today's units take exactly
  // the damage they always did.
  heal(amount: number): void {
    if (this.health.current > 0)
      this.health = {
        ...this.health,
        current: Math.min(this.health.max, this.health.current + amount),
      };
  }

  receivedDamage(amount: number): number {
    return mitigatedDamage(amount * this.damageTakenMultiplier, this.damageReductionPercent);
  }

  takeDamage(amount: number): DamageResult {
    this.health = applyDamage(this.health, this.receivedDamage(amount));

    return { health: this.health, dead: isDead(this.health) };
  }

  getHealth(): Health {
    return this.health;
  }
}
