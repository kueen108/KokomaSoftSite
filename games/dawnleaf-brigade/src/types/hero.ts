export type WeaponId = 'sun' | 'frost' | 'storm';
export type ArmorId = 'leather' | 'bulwark' | 'renewal';
export interface HeroProgress {
  readonly auraLevel: number;
  readonly weapon: WeaponId;
  readonly armor: ArmorId;
  readonly ownedWeapons: readonly WeaponId[];
  readonly ownedArmors: readonly ArmorId[];
}
