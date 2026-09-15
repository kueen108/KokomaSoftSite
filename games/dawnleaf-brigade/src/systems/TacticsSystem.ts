/** Combat pacing: recovery income and an emergency area spell. Pure rules. */
export const PASSIVE_GOLD_PER_SECOND = 3;
export const NOVA_COST = 40;
export const NOVA_COOLDOWN_MS = 12000;
export const NOVA_RADIUS = 300;
export const NOVA_DAMAGE = 55;
export function incomeAfter(gold: number, deltaMs: number): number {
  return Math.min(999, gold + (PASSIVE_GOLD_PER_SECOND * Math.max(0, deltaMs)) / 1000);
}
export function canCastNova(mana: number, cooldown: number): boolean {
  return mana >= NOVA_COST && cooldown <= 0;
}
export function novaHits(heroX: number, targetX: number): boolean {
  return Math.abs(heroX - targetX) <= NOVA_RADIUS;
}
