/**
 * Combat contracts shared by `systems/`, `entities/` and `scenes/`.
 *
 * Every field is `readonly`: `src/systems/` derives new state from its
 * arguments instead of mutating them (REQ-013), and the compiler is what makes
 * that hold rather than reviewer attention.
 */

/** Hit points of anything that can be damaged — a unit or a base. */
export interface Health {
  readonly current: number;
  readonly max: number;
}

/**
 * Everything the mace attack gate reads. Cost and cooldown length live here
 * alongside the live values so `canAttack` / `consumeAttackCost` stay pure —
 * they never reach into balance constants.
 */
export interface AttackState {
  readonly cooldownRemainingMs: number;
  readonly cooldownMs: number;
  readonly mana: number;
  readonly manaMax: number;
  readonly manaRegenPerSec: number;
  readonly attackCost: number;
}

/** Outcome of applying damage: the new health plus whether it reached zero. */
export interface DamageResult {
  readonly health: Health;
  readonly dead: boolean;
}

/**
 * Tuning values a spawned projectile carries with it.
 *
 * `direction` must be exactly `1` (rightward, toward the enemy side) or `-1`
 * (leftward, toward the ally side) — SPEC-UNIT-ROSTER-001 REQ-008. The
 * Paladog's mace projectile passes `1` explicitly, which reproduces its
 * pre-existing rightward-only behaviour rather than changing it; passing any
 * other value here would be a silent regression, not a new feature.
 *
 * `textureKey` makes the sprite this projectile renders as an explicit part
 * of its spec rather than a constant baked into `Projectile` — the same
 * "state the assumption" pattern `direction` follows. Every projectile in
 * this SPEC still resolves to the same texture (`TEXTURE.projectile`,
 * distinguished only by tint); design.md §5 explains why no new art was
 * commissioned for it.
 */
export type ShotEffect = 'plain' | 'arrow' | 'fire' | 'frost' | 'storm' | 'spear' | 'bomb' | 'heal';

export interface ProjectileSpec {
  readonly effect?: ShotEffect;
  readonly speed: number;
  readonly damage: number;
  readonly direction: 1 | -1;
  readonly textureKey: string;
}

/** Battle result. `ongoing` means neither base has fallen yet. */
export type BattleOutcome = 'victory' | 'defeat' | 'ongoing';
