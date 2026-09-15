import { translate } from '../i18n/index';
import type { HeroProgress, WeaponId, ArmorId } from '../types/hero';
import type { PersistedState } from '../types/save';
export const WEAPONS = {
  sun: {
    name: translate('태양의 철퇴'),
    cost: 0,
    description: translate('빠른 빛의 탄환 · 균형 잡힌 단일 공격'),
    damage: 1,
    mana: 1,
    cooldown: 500,
    effect: 'plain',
    icon: '☀',
  },
  frost: {
    name: translate('서리 수정 지팡이'),
    cost: 120,
    description: translate('서리 탄환 · 적의 이동을 2초 동안 40% 둔화'),
    damage: 0.85,
    mana: 0.9,
    cooldown: 600,
    effect: 'frost',
    icon: '❄',
  },
  storm: {
    name: translate('천둥의 전쟁망치'),
    cost: 180,
    description: translate('천둥 구체 · 반경 110의 적에게 폭발 피해'),
    damage: 1.4,
    mana: 1.4,
    cooldown: 850,
    effect: 'storm',
    icon: 'ϟ',
  },
} as const;
export const ARMORS = {
  leather: {
    name: translate('순례자의 망토'),
    cost: 0,
    description: translate('기본 체력 200 · 이동과 회복의 균형'),
    hp: 200,
    incoming: 1,
    speed: 1,
    regen: 2,
    delay: 3000,
    icon: '◇',
  },
  bulwark: {
    name: translate('태양 문장 대방패'),
    cost: 140,
    description: translate('기본 체력 240 · 받는 피해 −25% · 이동 속도 −10%'),
    hp: 240,
    incoming: 0.75,
    speed: 0.9,
    regen: 2,
    delay: 3000,
    icon: '▣',
  },
  renewal: {
    name: translate('생명의 잎사귀 성의'),
    cost: 140,
    description: translate('기본 체력 180 · 피격 2초 후부터 초당 4 회복'),
    hp: 180,
    incoming: 1,
    speed: 1,
    regen: 4,
    delay: 2000,
    icon: '❧',
  },
} as const;
/** Permanent hero growth. The saved auraLevel field is retained for save compatibility. */
export const HERO_MAX_LEVEL = 5;
export const AURA_LEVELS = [
  {
    name: translate('길 위의 초심자'),
    radius: 0,
    attack: 1,
    speed: 1,
    incoming: 1,
    enemyAttack: 1,
    enemySpeed: 1,
    enemyIncoming: 1,
    heal: 0,
    mana: 0,
    color: 12035723,
    cost: 0,
    gate: 0,
  },
  {
    name: translate('새싹의 수호자'),
    radius: 145,
    attack: 1.1,
    speed: 1.04,
    incoming: 0.96,
    enemyAttack: 0.96,
    enemySpeed: 0.98,
    enemyIncoming: 1.04,
    heal: 0,
    mana: 1,
    color: 13162907,
    cost: 70,
    gate: 1,
  },
  {
    name: translate('숲의 기사'),
    radius: 190,
    attack: 1.18,
    speed: 1.08,
    incoming: 0.92,
    enemyAttack: 0.92,
    enemySpeed: 0.96,
    enemyIncoming: 1.08,
    heal: 0.3,
    mana: 1.5,
    color: 9103026,
    cost: 140,
    gate: 3,
  },
  {
    name: translate('별빛의 기사'),
    radius: 235,
    attack: 1.26,
    speed: 1.12,
    incoming: 0.88,
    enemyAttack: 0.88,
    enemySpeed: 0.94,
    enemyIncoming: 1.12,
    heal: 0.5,
    mana: 2,
    color: 9032959,
    cost: 210,
    gate: 5,
  },
  {
    name: translate('새벽의 수호자'),
    radius: 280,
    attack: 1.34,
    speed: 1.16,
    incoming: 0.84,
    enemyAttack: 0.84,
    enemySpeed: 0.92,
    enemyIncoming: 1.16,
    heal: 0.75,
    mana: 3,
    color: 12103935,
    cost: 300,
    gate: 8,
  },
  {
    name: translate('새벽의 영웅'),
    radius: 325,
    attack: 1.42,
    speed: 1.2,
    incoming: 0.8,
    enemyAttack: 0.8,
    enemySpeed: 0.9,
    enemyIncoming: 1.2,
    heal: 1,
    mana: 4,
    color: 16111470,
    cost: 420,
    gate: 10,
  },
] as const;
export function heroProgress(state: Pick<PersistedState, 'hero'>): HeroProgress {
  return normalizeHero(state.hero);
}
export function normalizeHero(raw: unknown): HeroProgress {
  const p = raw && typeof raw === 'object' ? (raw as Partial<HeroProgress>) : {};
  const ownedWeapons = (Object.keys(WEAPONS) as WeaponId[]).filter(
    (k) => k === 'sun' || (Array.isArray(p.ownedWeapons) && p.ownedWeapons.includes(k)),
  );
  const ownedArmors = (Object.keys(ARMORS) as ArmorId[]).filter(
    (k) => k === 'leather' || (Array.isArray(p.ownedArmors) && p.ownedArmors.includes(k)),
  );
  return {
    auraLevel: Number.isInteger(p.auraLevel)
      ? Math.max(0, Math.min(HERO_MAX_LEVEL, p.auraLevel!))
      : 0,
    weapon: ownedWeapons.find((k) => k === p.weapon) ?? 'sun',
    armor: ownedArmors.find((k) => k === p.armor) ?? 'leather',
    ownedWeapons,
    ownedArmors,
  };
}
export function auraAt(level: number) {
  return AURA_LEVELS[normalizeGrowthLevel(level)];
}
/** Invalid values cannot leak NaN or fractional ranks into stats or artwork. */
export function normalizeGrowthLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(0, Math.min(HERO_MAX_LEVEL, Math.floor(level))) : 0;
}
export function growthRank(level: number): 'novice' | 'trained' | 'elite' {
  return (['novice', 'trained', 'elite'] as const)[Math.floor(normalizeGrowthLevel(level) / 2)];
}
/** Equipment remains a side-grade; permanent growth increases every loadout. */
export function heroStats(level: number, armor: ArmorId = 'leather') {
  const growth = normalizeGrowthLevel(level);
  return {
    maxHp: Math.round(ARMORS[armor].hp * (1 + growth * 0.12)),
    attackMultiplier: 1 + growth * 0.22,
  };
}
export function upgradeAura(state: PersistedState): PersistedState {
  const hero = heroProgress(state),
    next = AURA_LEVELS[hero.auraLevel + 1];
  if (
    !next ||
    !Number.isFinite(state.settlementGold) ||
    state.settlementGold < next.cost ||
    !state.clearedStages.includes(`stage-${next.gate}` as PersistedState['clearedStages'][number])
  )
    return state;
  return {
    ...state,
    settlementGold: state.settlementGold - next.cost,
    hero: { ...hero, auraLevel: hero.auraLevel + 1 },
  };
}
export function chooseWeapon(state: PersistedState, id: WeaponId): PersistedState {
  const hero = heroProgress(state),
    owned = hero.ownedWeapons.includes(id),
    cost = owned ? 0 : WEAPONS[id].cost;
  if (state.settlementGold < cost) return state;
  return {
    ...state,
    settlementGold: state.settlementGold - cost,
    hero: {
      ...hero,
      weapon: id,
      ownedWeapons: owned ? hero.ownedWeapons : [...hero.ownedWeapons, id],
    },
  };
}
export function chooseArmor(state: PersistedState, id: ArmorId): PersistedState {
  const hero = heroProgress(state),
    owned = hero.ownedArmors.includes(id),
    cost = owned ? 0 : ARMORS[id].cost;
  if (state.settlementGold < cost) return state;
  return {
    ...state,
    settlementGold: state.settlementGold - cost,
    hero: { ...hero, armor: id, ownedArmors: owned ? hero.ownedArmors : [...hero.ownedArmors, id] },
  };
}
