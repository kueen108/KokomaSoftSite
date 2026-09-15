// @MX:DEBT: [AUTO] Every number in this file is a placeholder chosen to make
// the Phase 1 loop run end to end, not a tuned difficulty curve. They exist to
// prove the loop closes (victory and defeat both reachable), and are expected
// to move once the game is actually played.
// @MX:CEILING: [AUTO] Sustained damage output is bounded by MANA, not by the
// attack cooldown. The cooldown permits 1000/ATTACK_COOLDOWN_MS shots per
// second, but mana only refills MANA_REGEN_PER_SEC/ATTACK_COST shots per
// second, and the smaller of the two is what the player actually gets. With
// the values below that is 30/20 = 1.5 shots/s against a cooldown ceiling of
// 2.0 shots/s, so mana is the binding constraint and the cooldown is slack.
// @MX:UPGRADE: [AUTO] To change the *player's* felt firepower, turn the MANA
// knobs — MANA_REGEN_PER_SEC up or ATTACK_COST down. Lowering
// ATTACK_COOLDOWN_MS is wasted effort while mana binds: the player simply
// waits on mana instead of on the cooldown and notices no difference. If mana
// adjustment is not enough, change WAVE_ENEMY_COUNT or ENEMY_BASE_HP instead.
//
// Since SPEC-UNIT-AURA-001 there are TWO routes to the enemy base, not one.
// The Phase 1 note here said projectiles were the only way to damage it; that
// stopped being true when summoned ally units began advancing on it and
// attacking it directly. Anyone tuning the numbers above should know that
// mana no longer bounds total damage output — ally unit count, their upgrade
// levels and the aura multipliers all feed the same enemy base, and moving a
// mana knob now shifts only the share of the work the player does personally.
// Killing enemies still never damages either base, and that part remains a
// requirement rather than a knob.
//
// New constants are appended at the end of this file and existing lines are not
// reordered (structure.md @NAV:DEC-SHARED-FILE-APPEND-ONLY).

/** Paladog lane movement speed, pixels per second. */
export const PALADOG_SPEED = 260;

/** Mana ceiling. Also the amount the player starts a battle with. */
export const MANA_MAX = 100;

/** Mana restored per second. Raised from the initial 20 — see the UPGRADE note above. */
export const MANA_REGEN_PER_SEC = 30;

/** Mana charged per mace attack. Lowered from the initial 25 — see the UPGRADE note above. */
export const ATTACK_COST = 20;

/** Minimum gap between two mace attacks, milliseconds. */
export const ATTACK_COOLDOWN_MS = 500;

/** Damage one mace projectile applies to its single target. */
export const PROJECTILE_DAMAGE = 20;

/** Projectile travel speed, pixels per second, always toward the enemy side. */
export const PROJECTILE_SPEED = 500;

/** Enemy unit hit points. Two projectile hits at PROJECTILE_DAMAGE. */
export const ENEMY_HP = 30;

/** Enemy advance speed toward the ally base, pixels per second. */
export const ENEMY_SPEED = 60;

/** Damage one enemy deals to the ally base per attack tick. */
export const ENEMY_ATTACK_DAMAGE = 5;

/** Gap between two enemy attack ticks, milliseconds. */
export const ENEMY_ATTACK_INTERVAL_MS = 1000;

/** Ally base hit points. Reaching zero is a defeat. */
export const ALLY_BASE_HP = 100;

/** Enemy base hit points. Reaching zero is a victory. */
export const ENEMY_BASE_HP = 200;

/** Enemies in the stage-1 wave schedule. */
export const WAVE_ENEMY_COUNT = 8;

/** Gap between two stage-1 spawns, milliseconds. */
export const WAVE_INTERVAL_MS = 2000;

// --- Phase 2 (SPEC-UNIT-AURA-001) ---
// @MX:DEBT: [AUTO] Same standing as everything above — placeholders chosen to
// make the summon, aura and upgrade loop run end to end, not a tuned curve.
// @MX:CEILING: These are project-wide defaults, not stage settings. Since
// SPEC-CAMPAIGN-STAGE-001 a number that differs between stages lives in that
// stage's own file under src/data/stages/, and an enemy's four combat numbers
// live in src/data/enemies/. The enemy and wave constants above are still real
// values, but only because src/data/stages/stage-1.ts imports them: they
// describe stage 1, and nothing else reads them as a global any more.
// @MX:UPGRADE: The "second stage arrives" half of this tag's previous trigger
// has fired and is discharged — that arrival is what moved stage-varying
// numbers out to data. What remains is the other half: stage 1's own numbers
// were deliberately NOT retuned while being moved (plan.md §B D-3), because
// moving the only baseline and changing it at once leaves nothing to judge
// stages 2 and 3 against. So revisit these when play shows stage 1 is winnable
// with no input at all, when a third ally type arrives, or when the aura radius
// proves never worth stepping into or never worth leaving. Retuning stage 1
// means editing src/data/stages/stage-1.ts, not the constants above — changing
// a constant here moves every default that reads it.

/** Battle gold the player opens every battle with (REQ-011, start boundary). */
export const BATTLE_START_GOLD = 100;

/** Ally units that may be alive at once. A death frees a slot (REQ-005). */
export const POPULATION_LIMIT = 12;

/** Battle gold paid for killing one enemy grunt (REQ-012). */
export const ENEMY_BOUNTY = 12;

/** Aura reach measured along the lane from the Paladog, in pixels (REQ-007). */
export const AURA_RADIUS = 220;

/** Attack damage multiplier applied inside the aura (REQ-008). */
export const AURA_ATTACK_MULTIPLIER = 1.5;

/** Movement speed multiplier applied inside the aura (REQ-008). */
export const AURA_SPEED_MULTIPLIER = 1.25;

// --- SPEC-UNIT-ROSTER-001 ---
// @MX:DEBT: [AUTO] Same standing as every other roster number in this file —
// a value the aura/support loop runs on, not one measured by play.
// @MX:CEILING: Both new sources' multipliers are set below the Paladog's
// (1.5/1.25) on purpose (design.md §4) — a bannerman or overseer standing
// wherever the Paladog also reaches never outbids the Paladog's own aura, so
// no multiplier-composition rule is needed for the overlap case.
// @MX:UPGRADE: Revisit if a Paladog multiplier is ever lowered below either of
// these — the ordering these values depend on would then need restating, not
// merely rechecking.

/** Bannerman aura reach along the lane, in pixels (REQ-015). Smaller than the
 * Paladog's `AURA_RADIUS` (220) — a secondary source, not a bigger one. */
export const BANNERMAN_AURA_RADIUS = 160;

/** Attack damage multiplier the bannerman's aura applies (REQ-015). */
export const BANNERMAN_AURA_ATTACK_MULTIPLIER = 1.3;

/** Movement speed multiplier the bannerman's aura applies (REQ-015). */
export const BANNERMAN_AURA_SPEED_MULTIPLIER = 1.15;

/** Overseer aura reach along the lane, in pixels (REQ-017). */
export const OVERSEER_AURA_RADIUS = 150;

/** Attack damage multiplier the overseer's aura applies (REQ-017). */
export const OVERSEER_AURA_ATTACK_MULTIPLIER = 1.25;

/** Movement speed multiplier the overseer's aura applies (REQ-017). */
export const OVERSEER_AURA_SPEED_MULTIPLIER = 1.1;

// Paladog vitality and the hostile side of the golden aura.
export const PALADOG_MAX_HP = 200;
export const PALADOG_HP_REGEN_PER_SEC = 2;
export const PALADOG_REGEN_DELAY_MS = 3000;
export const AURA_DAMAGE_TAKEN_MULTIPLIER = 0.75;
export const ENEMY_AURA_ATTACK_MULTIPLIER = 0.5;
export const ENEMY_AURA_SPEED_MULTIPLIER = 0.75;
export const ENEMY_AURA_DAMAGE_TAKEN_MULTIPLIER = 1.25;
