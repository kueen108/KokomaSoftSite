import { translate } from '../i18n/index';
import {
  AURA_LEVELS,
  WEAPONS,
  ARMORS,
  heroProgress,
  heroStats,
  upgradeAura,
  chooseWeapon,
  chooseArmor,
} from '../systems/HeroProgressSystem';
import type { WeaponId, ArmorId } from '../types/hero';
import Phaser from 'phaser';
import { icon, infoButton } from '../ui/Icons';
import { gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import { ATTACK_COST, PROJECTILE_DAMAGE } from '../config/balance';
import { SCENE } from '../config/gameConfig';
import { ringDefinition } from '../data/rings';
import { unitDefinition } from '../data/units';
import { browserStorage } from '../storage/browserStorage';
import {
  applyRingUnlock,
  applyRingUpgrade,
  effectiveAttackParams,
  equipRing,
  isRingUnlocked,
  ringLevel,
  ringUpgradeCost,
  unequipRing,
} from '../systems/RingSystem';
import { loadState, saveState } from '../systems/SaveSystem';
import {
  UNIT_MAX_LEVEL,
  applyUnlock,
  applyUpgrade,
  isUnlocked,
  statsAtLevel,
  upgradeCost,
  upgradeLevel,
} from '../systems/UpgradeSystem';
import { RING_TYPES } from '../types/ring';
import type { RingType } from '../types/ring';
import type { PersistedState } from '../types/save';
import { ALLY_UNIT_TYPES } from '../types/unit';
import type { AllyUnitType } from '../types/unit';
import { Backdrop } from '../ui/Backdrop';
import {
  Interface,
  top,
  back,
  portrait,
  UNIT_NAMES,
  UNIT_SHORT_NAMES,
  UNIT_ROLES,
} from '../ui/Interface';
type Row =
  | { readonly kind: 'unit'; readonly type: AllyUnitType }
  | { readonly kind: 'ring'; readonly type: RingType };
const ROWS: readonly Row[] = [
  ...ALLY_UNIT_TYPES.map((type): Row => ({ kind: 'unit', type })),
  ...RING_TYPES.map((type): Row => ({ kind: 'ring', type })),
];
const BASE_ATTACK_PARAMS = {
  attackCost: ATTACK_COST,
  projectileDamage: PROJECTILE_DAMAGE,
};
export class UpgradeScene extends Phaser.Scene {
  private state!: PersistedState;
  private selection = 0;
  private heroSelected = false;
  private ui!: Interface;
  constructor() {
    super(SCENE.upgrade);
  }
  create(): void {
    new Backdrop(this, 'menu');
    const audio = gameAudio(this.game);
    audio.playBgm(SOUND.bgmMenu);
    audio.attach(this);
    this.state = loadState(browserStorage());
    this.selection = 0;
    this.heroSelected = false;
    this.ui = new Interface(
      this,
      `${top('THE GUARDIAN GUILD', translate('기사단 정비'), translate('전투에서 얻은 골드로 동료를 성장시키고 새로운 힘을 발견하세요.'))}${back}<div class="wallet" id="wallet"></div><div class="upgrade-layout"><div class="roster"><button id="hero-upgrades" class="roster-row hero-row">${portrait(0, false, heroProgress(this.state).auraLevel)}<strong>${translate('루미')}</strong></button><div id="roster"></div></div><div id="detail" class="unit-detail"></div></div><div class="screen-foot"><span id="notice" class="notice"></span></div>`,
    );
    this.ui.on('hero-upgrades', () => {
      this.heroSelected = true;
      this.refresh();
    });
    this.ui.on('back', () => this.scene.start(SCENE.mainMenu));
    this.bindKeys();
    this.refresh();
  }
  private bindKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable; this game is keyboard-only (C-4).');
    }
    keyboard.on('keydown-DOWN', () => {
      this.heroSelected = false;
      this.selection = (this.selection + 1) % ROWS.length;
      this.refresh();
    });
    keyboard.on('keydown-UP', () => {
      this.heroSelected = false;
      this.selection = (this.selection - 1 + ROWS.length) % ROWS.length;
      this.refresh();
    });
    keyboard.on('keydown-ENTER', () => {
      this.confirmUpgrade();
    });
    keyboard.on('keydown-U', () => {
      this.confirmUnlock();
    });
    keyboard.on('keydown-E', () => {
      this.confirmEquip();
    });
    keyboard.on('keydown-R', () => {
      this.confirmUnequip();
    });
    keyboard.on('keydown-ESC', () => {
      this.scene.start(SCENE.mainMenu);
    });
  }
  private selectedRow(): Row {
    return ROWS[this.selection];
  }
  private confirmUpgrade(): void {
    if (this.heroSelected) {
      this.commit(upgradeAura(this.state), translate('아우라 성장 조건과 골드를 확인하세요.'));
      return;
    }
    const row = this.selectedRow();
    if (row.kind === 'ring') {
      this.confirmRingUpgrade(row.type);
      return;
    }
    const definition = unitDefinition(row.type);
    if (!isUnlocked(this.state, definition.type)) {
      this.ui.text('notice', translate('{0}: 먼저 해금해 주세요.', [definition.displayName]));
      return;
    }
    if (upgradeLevel(this.state, definition.type) >= UNIT_MAX_LEVEL) {
      this.ui.text('notice', translate('동료 최대 강화 단계입니다.'));
      return;
    }
    const result = applyUpgrade(this.state, definition);
    if (!result.succeeded) {
      this.ui.text('notice', translate('정산 골드가 부족합니다.'));
      return;
    }
    this.commit(result.state, translate('{0} 강화 완료!', [definition.displayName]));
  }
  private confirmRingUpgrade(type: RingType): void {
    const definition = ringDefinition(type);
    if (!isRingUnlocked(this.state, type)) {
      this.ui.text('notice', translate('{0}: 먼저 해금해 주세요.', [definition.displayName]));
      return;
    }
    if (ringLevel(this.state, type) >= definition.maxLevel) {
      this.ui.text('notice', translate('이미 최대 레벨입니다.'));
      return;
    }
    const result = applyRingUpgrade(this.state, definition);
    if (!result.succeeded) {
      this.ui.text('notice', translate('정산 골드가 부족합니다.'));
      return;
    }
    this.commit(result.state, translate('{0} 강화 완료!', [definition.displayName]));
  }
  private confirmUnlock(): void {
    if (this.heroSelected) return;
    const row = this.selectedRow();
    if (row.kind === 'ring') {
      this.confirmRingUnlock(row.type);
      return;
    }
    const definition = unitDefinition(row.type);
    if (isUnlocked(this.state, definition.type)) {
      this.ui.text('notice', translate('이미 해금되어 있습니다.'));
      return;
    }
    const result = applyUnlock(this.state, definition);
    if (!result.succeeded) {
      this.ui.text('notice', translate('정산 골드가 부족합니다.'));
      return;
    }
    this.commit(result.state, translate('{0} 해금 완료!', [definition.displayName]));
  }
  private confirmRingUnlock(type: RingType): void {
    const definition = ringDefinition(type);
    if (isRingUnlocked(this.state, type)) {
      this.ui.text('notice', translate('이미 해금되어 있습니다.'));
      return;
    }
    const result = applyRingUnlock(this.state, definition);
    if (!result.succeeded) {
      this.ui.text('notice', translate('정산 골드가 부족합니다.'));
      return;
    }
    this.commit(
      result.state,
      translate('{0} 해금 완료! 반지 장착을 눌러 주세요.', [definition.displayName]),
    );
  }
  private confirmEquip(): void {
    if (this.heroSelected) return;
    const row = this.selectedRow();
    if (row.kind !== 'ring') {
      return;
    }
    const definition = ringDefinition(row.type);
    const result = equipRing(this.state, definition);
    if (!result.succeeded) {
      this.ui.text('notice', translate('{0}: 먼저 해금해 주세요.', [definition.displayName]));
      return;
    }
    this.commit(result.state, translate('{0} 장착 완료!', [definition.displayName]));
  }
  private confirmUnequip(): void {
    if (this.heroSelected) return;
    if (this.selectedRow().kind !== 'ring') {
      return;
    }
    const result = unequipRing(this.state);
    if (!result.succeeded) {
      this.ui.text('notice', translate('장착된 반지가 없습니다.'));
      return;
    }
    this.commit(result.state, translate('반지를 해제했습니다.'));
  }
  private commit(state: PersistedState, message: string): void {
    this.ui.get('notice').setAttribute('aria-label', message);
    this.ui.get('notice').setAttribute('role', 'status');
    this.state = state;
    const saved = saveState(browserStorage(), this.state);
    this.ui.text(
      'notice',
      saved ? '✓' : translate('저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'),
    );
    this.refresh();
  }
  private refresh(): void {
    this.ui.text('wallet', `◈ ${this.state.settlementGold}`);
    this.ui.get('hero-upgrades').innerHTML =
      `${portrait(0, false, heroProgress(this.state).auraLevel)}<strong>${translate('루미')}</strong><small>Lv.${heroProgress(this.state).auraLevel + 1}</small>`;
    this.ui.get('roster').innerHTML = ROWS.map((row, i) => {
      const name =
        row.kind === 'unit' ? UNIT_SHORT_NAMES[row.type] : ringDefinition(row.type).displayName;
      const unlocked =
        row.kind === 'unit'
          ? isUnlocked(this.state, row.type)
          : isRingUnlocked(this.state, row.type);
      const level =
        row.kind === 'unit' ? upgradeLevel(this.state, row.type) : ringLevel(this.state, row.type);
      return `<button id="row-${i}" class="roster-row ${!this.heroSelected && i === this.selection ? 'selected' : ''}">${row.kind === 'unit' ? portrait(i + 1, false, level) : '<span class="ring-icon">◉</span>'}<strong>${name}</strong><small>${unlocked ? '●'.repeat(level) + '○'.repeat(5 - level) : icon('lock')}</small></button>`;
    }).join('');
    ROWS.forEach((_, i) =>
      this.ui.on(`row-${i}`, () => {
        this.heroSelected = false;
        this.selection = i;
        this.refresh();
      }),
    );
    if (this.heroSelected) {
      this.renderHero();
      return;
    }
    const row = this.selectedRow();
    const unit = row.kind === 'unit';
    const def = unit ? unitDefinition(row.type) : ringDefinition(row.type);
    const level = unit ? upgradeLevel(this.state, row.type) : ringLevel(this.state, row.type);
    const unlocked = unit ? isUnlocked(this.state, row.type) : isRingUnlocked(this.state, row.type);
    const cost = unlocked
      ? unit
        ? upgradeCost(unitDefinition(row.type), level)
        : ringUpgradeCost(ringDefinition(row.type), level)
      : def.unlockCost;
    const stats = unit ? statsAtLevel(unitDefinition(row.type), level) : null;
    const nextUnitStats = unit ? statsAtLevel(unitDefinition(row.type), level + 1) : null;
    const ring = unit ? null : ringDefinition(row.type);
    const max = unit ? level >= UNIT_MAX_LEVEL : ring !== null && level >= ring.maxLevel;
    const worn = !unit && this.state.equippedRing === row.type;
    const detail = this.ui.get('detail');
    const description = `${unit ? UNIT_ROLES[row.type] : ring?.axis === 'attackCost' ? translate('빛의 탄환에 필요한 마나를 줄입니다.') : translate('빛의 탄환의 공격력을 높입니다.')}\n${unlocked ? translate('강화 {0}/5{1}', [level, worn ? translate(' · 장착 중') : '']) : translate('먼저 해금해야 합니다.')}\n${max ? translate('최대 강화 단계입니다.') : translate('{0} 비용 {1} 골드', [unlocked ? translate('강화') : translate('해금'), cost])}\n${unit ? translate('강화 효과는 다음 전투부터 적용됩니다.') : translate('반지는 한 번에 하나만 장착할 수 있습니다.')}`;
    detail.innerHTML = `<div class="detail-art ${unit ? 'unit-growth-art' : ''}">${unit ? `<div class="growth-preview"><div>${portrait(this.selection + 1, false, level)}<b>Lv.${level + 1}</b></div>${unlocked && !max ? `<span>→</span><div>${portrait(this.selection + 1, false, level + 1)}<b>Lv.${level + 2}</b></div>` : ''}</div>` : icon('ring')}</div><h2>${unit ? UNIT_NAMES[row.type] : def.displayName}</h2>${infoButton('detail-info', unit ? UNIT_NAMES[row.type] : def.displayName, description)}<div class="level-pips" aria-label="${translate('강화 {0}/5', [level])}">${Array.from({ length: 5 }, (_, i) => `<i class="${i < level ? 'filled' : ''}"></i>`).join('')}</div><div class="stats graphic-stats">${stats ? `<span>${icon('heart')}<b>${stats.maxHp}${unlocked && !max ? ` → ${nextUnitStats?.maxHp}` : ''}</b></span><span>${icon('sword')}<b>${stats.attackDamage}${unlocked && !max ? ` → ${nextUnitStats?.attackDamage}` : ''}</b></span><span>${icon('arrow')}<b>${stats.speed}</b></span>` : `<span>${icon(ring?.axis === 'attackCost' ? 'mana' : 'star')}<b>${ring ? effectiveAttackParams(BASE_ATTACK_PARAMS, ring, level)[ring.axis] : ''}</b></span>`}${infoButton('stats-info', translate('능력치'), stats ? translate('하트: 체력 {0}\n검: 공격력 {1}\n화살표: 이동 속도 {2}', [stats.maxHp, stats.attackDamage, stats.speed]) : translate('보석은 마나 비용, 별은 탄환 피해입니다.'))}</div><div class="actions"><button id="purchase" class="primary" ${max || this.state.settlementGold < cost ? 'disabled' : ''}>${icon(max ? 'check' : unlocked ? 'up' : 'lock')} ${max ? 'MAX' : `${unlocked ? translate('강화') : translate('해금')} · ${cost}`}</button>${!unit && unlocked ? `<button id="equip" class="secondary">${icon(worn ? 'check' : 'ring')} ${worn ? translate('해제') : translate('장착')}</button>` : ''}</div>`;
    this.ui.on('purchase', () => (unlocked ? this.confirmUpgrade() : this.confirmUnlock()));
    if (!unit && unlocked)
      this.ui.on('equip', () => (worn ? this.confirmUnequip() : this.confirmEquip()));
  }
  private renderHero(): void {
    const hero = heroProgress(this.state),
      aura = AURA_LEVELS[hero.auraLevel],
      next = AURA_LEVELS[hero.auraLevel + 1];
    const ready =
      next &&
      this.state.clearedStages.includes(
        `stage-${next.gate}` as PersistedState['clearedStages'][number],
      );
    const currentStats = heroStats(hero.auraLevel, hero.armor);
    const nextStats = heroStats(hero.auraLevel + 1, hero.armor);
    const ring = this.state.equippedRing ? ringDefinition(this.state.equippedRing) : null;
    const baseDamage = effectiveAttackParams(
      BASE_ATTACK_PARAMS,
      ring,
      ring ? ringLevel(this.state, ring.type) : 0,
    ).projectileDamage;
    const growthDescription = translate('체력 {0} → {1} · 공격력 {2} → {3}', [
      currentStats.maxHp,
      nextStats.maxHp,
      Math.round(baseDamage * WEAPONS[hero.weapon].damage * currentStats.attackMultiplier),
      Math.round(baseDamage * WEAPONS[hero.weapon].damage * nextStats.attackMultiplier),
    ]);
    const auraDescription = translate(
      '{0}\n범위 {1} · 아군 공격 +{2}% · 속도 +{3}%\n받는 피해 −{4}% · 동료 회복 {5}/s · 마나 +{6}/s\n{7}\n다음 전투부터 적용합니다.',
      [
        aura.name,
        aura.radius,
        Math.round((aura.attack - 1) * 100),
        Math.round((aura.speed - 1) * 100),
        Math.round((1 - aura.incoming) * 100),
        aura.heal,
        aura.mana,
        next
          ? translate(
              '다음 단계: {0}\n{1}번 전장 클리어 + {2} 골드 필요\n다음 범위 {3} · 회복 {4}/s',
              [next.name, next.gate, next.cost, next.radius, next.heal],
            )
          : translate('최고 단계입니다.'),
      ],
    );
    this.ui.get('detail').innerHTML =
      `<div class="hero-workshop graphic-workshop"><section class="aura-upgrade"><div class="growth-preview"><div>${portrait(0, false, hero.auraLevel)}<b>Lv.${hero.auraLevel + 1}</b></div>${next ? `<span>→</span><div>${portrait(0, false, hero.auraLevel + 1)}<b>Lv.${hero.auraLevel + 2}</b></div>` : ''}</div><div class="aura-growth"><div class="level-pips">${Array.from({ length: AURA_LEVELS.length }, (_, i) => `<i class="${i <= hero.auraLevel ? 'filled' : ''}"></i>`).join('')}</div><button id="aura-upgrade" class="primary" ${!ready || this.state.settlementGold < (next?.cost ?? Infinity) ? 'disabled' : ''}>${icon(next ? 'up' : 'check')} ${next ? `${next.cost}` : 'MAX'}</button></div>${infoButton('aura-upgrade-info', translate('루미 성장'), growthDescription + '\n' + auraDescription)}</section><div class="growth-stat-preview">${icon('heart')}${currentStats.maxHp}${next ? ` → ${nextStats.maxHp}` : ''} ${icon('sword')}${Math.round(baseDamage * WEAPONS[hero.weapon].damage * currentStats.attackMultiplier)}${next ? ` → ${Math.round(baseDamage * WEAPONS[hero.weapon].damage * nextStats.attackMultiplier)}` : ''} ${next ? `${icon(ready ? 'check' : 'lock')}${next.gate}` : 'MAX'}</div><div class="equipment-heading">${icon('sword')}${infoButton('weapon-group-info', translate('공격 무기'), translate('무기는 하나씩 장착합니다. 구입하면 바로 장착되며, 이미 소유한 무기는 무료로 바꿀 수 있습니다. 다음 전투부터 적용합니다.'))}</div><div class="equipment-grid">${(
        Object.keys(WEAPONS) as WeaponId[]
      )
        .map((id) => {
          const w = WEAPONS[id],
            owned = hero.ownedWeapons.includes(id),
            selected = hero.weapon === id;
          return `<div class="equipment-slot"><button id="weapon-${id}" class="equipment ${selected ? 'selected' : ''}" aria-label="${w.name} ${selected ? translate('장착 중') : owned ? translate('장착') : translate('구입 및 장착')}" ${!owned && this.state.settlementGold < w.cost ? 'disabled' : ''}>${icon(id === 'sun' ? 'star' : id === 'frost' ? 'snow' : 'sword')}<b>${{ sun: translate('태양'), frost: translate('서리'), storm: translate('천둥') }[id]}</b><span>${icon(selected ? 'check' : owned ? 'play' : 'coin')}${owned ? '' : w.cost}</span></button>${infoButton(`weapon-info-${id}`, w.name, w.description + '\n' + (owned ? translate('소유 중 · 무료 장착') : translate('{0} 골드 · 구입 시 장착', [w.cost])))}</div>`;
        })
        .join(
          '',
        )}</div><div class="equipment-heading">${icon('shield')}${infoButton('armor-group-info', translate('방어 장비'), translate('방어구는 하나씩 장착합니다. 체력, 받는 피해, 이동과 회복 방식이 바뀝니다. 다음 전투부터 적용합니다.'))}</div><div class="equipment-grid">${(
        Object.keys(ARMORS) as ArmorId[]
      )
        .map((id) => {
          const a = ARMORS[id],
            owned = hero.ownedArmors.includes(id),
            selected = hero.armor === id;
          return `<div class="equipment-slot"><button id="armor-${id}" class="equipment ${selected ? 'selected' : ''}" aria-label="${a.name} ${selected ? translate('장착 중') : owned ? translate('장착') : translate('구입 및 장착')}" ${!owned && this.state.settlementGold < a.cost ? 'disabled' : ''}>${icon(id === 'leather' ? 'shield' : id === 'bulwark' ? 'castle' : 'heart')}<b>${{ leather: translate('순례'), bulwark: translate('대방패'), renewal: translate('생명') }[id]}</b><span>${icon(selected ? 'check' : owned ? 'play' : 'coin')}${owned ? '' : a.cost}</span></button>${infoButton(`armor-info-${id}`, a.name, a.description + '\n' + (owned ? translate('소유 중 · 무료 장착') : translate('{0} 골드 · 구입 시 장착', [a.cost])))}</div>`;
        })
        .join('')}</div></div>`;
    this.ui.on('aura-upgrade', () => {
      const nextState = upgradeAura(this.state);
      this.commit(
        nextState,
        nextState === this.state
          ? translate('성장 조건을 확인하세요.')
          : translate('루미가 더 강해졌습니다!'),
      );
    });
    (Object.keys(WEAPONS) as WeaponId[]).forEach((id) =>
      this.ui.on(`weapon-${id}`, () =>
        this.commit(chooseWeapon(this.state, id), translate('{0} 장착', [WEAPONS[id].name])),
      ),
    );
    (Object.keys(ARMORS) as ArmorId[]).forEach((id) =>
      this.ui.on(`armor-${id}`, () =>
        this.commit(chooseArmor(this.state, id), translate('{0} 장착', [ARMORS[id].name])),
      ),
    );
  }
}
