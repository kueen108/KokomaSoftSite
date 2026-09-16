import { translate } from '../i18n/index';
import { mobileViewport } from './MobileViewport';
import Phaser from 'phaser';
import { Interface, portrait, UNIT_NAMES, UNIT_ROLES } from './Interface';
import { icon, infoButton } from './Icons';
import type { IconName } from './Icons';
import type { WeaponId } from '../types/hero';
import type { SummonSlot } from './SummonBar';
import { ALLY_UNIT_TYPES } from '../types/unit';
import type { AllyUnitType } from '../types/unit';
import type { Health } from '../types/combat';

export interface BattleControls {
  left: boolean;
  right: boolean;
  fire: boolean;
  summon: (type: AllyUnitType) => void;
  nova: () => void;
  pause: () => void;
  resume: () => void;
  retreat: () => void;
  mute: () => void;
}
export interface BattleView {
  ally: Health;
  hero: Health;
  target: Health | null;
  title: string;
  auraDescription: string;
  auraLabel: string;
  weaponCost: number;
  weaponName: string;
  weaponId: WeaponId;
  armorDescription: string;
  missionLabel: string;
  objective: {
    kind: 'siege' | 'hold' | 'hunt' | 'boss' | 'survival';
    value: number;
    max: number;
    secondary: number;
  };
  phase: string;
  gold: number;
  mana: number;
  manaMax: number;
  population: number;
  limit: number;
  elapsed: number;
  slots: SummonSlot[];
  novaCooldown: number;
  muted: boolean;
  world: {
    width: number;
    cameraX: number;
    viewport: number;
    heroX: number;
    allyBaseX: number;
    enemyBaseX: number;
    allies: number[];
    enemies: number[];
  };
}
export class BattleInterface extends Interface {
  private latest: BattleView | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    scene: Phaser.Scene,
    private controls: BattleControls,
    growth: { hero: number; units: Partial<Record<AllyUnitType, number>> } = { hero: 0, units: {} },
  ) {
    super(
      scene,
      `<div class="battle-top"><div class="fortress-health">${icon('castle')}<div class="meter"><i id="ally-fill"></i></div><span id="ally-hp"></span>${infoButton('base-info', translate('성역'), 'base')}</div><div class="battle-title"><span id="battle-title"></span><div class="objective-line"><span id="objective-icon"></span><span id="objective-value"></span><span class="time-chip">${icon('clock')}<span id="phase"></span></span>${infoButton('mission-info', translate('임무'), 'mission')}</div></div><div class="enemy-health">${icon('skull')}<div class="meter"><i id="target-fill"></i></div><span id="target-hp"></span></div></div>
      <div class="hero-health">${portrait(0, false, growth.hero)}<div class="hero-vitals"><div class="vital-value">${icon('heart')}<span id="hero-hp"></span></div><div class="meter"><i id="hero-fill"></i></div><div class="mana-track"><i id="mana-fill"></i></div></div>${infoButton('hero-info', translate('루미'), 'hero')}</div>
      <div class="battle-info"><span class="gold-chip">${icon('coin')}<b id="gold"></b></span><span class="mana-chip">${icon('mana')}<b id="mana"></b></span><span class="party-chip">${icon('party')}<b id="population"></b></span>${infoButton('resource-info', translate('자원과 병력'), 'resources')}</div>
      <div class="battle-map"><canvas id="minimap" width="360" height="30" aria-label="${translate('전장 전체와 현재 화면 위치')}"></canvas>${infoButton('map-info', translate('전황 지도'), 'map')}</div>
      <div class="aura-badge">${icon('aura')}<span id="hint"></span>${infoButton('aura-info', translate('아우라'), 'aura')}</div>
      <div class="battle-tools"><button id="mute" class="tool" aria-label="${translate('음소거')}"></button><button id="pause" class="tool" aria-label="${translate('일시정지')}">${icon('pause')}</button>${infoButton('help', translate('조작 안내'), 'controls')}</div><div id="toast" class="toast" role="status"></div>
      <div class="battle-bottom"><div class="move-pad"><div class="move-buttons"><button id="left" aria-label="${translate('왼쪽 이동')}">${icon('arrow')}</button><button id="right" aria-label="${translate('오른쪽 이동')}">${icon('arrow')}</button></div></div><div class="summon-deck">${ALLY_UNIT_TYPES.map((t, i) => `<div class="summon-slot"><button id="summon-${t}" class="summon-card" aria-label="${translate('{0} 소환', [UNIT_NAMES[t]])}">${portrait(i + 1, false, growth.units[t] ?? 0)}<span class="keycap">${i + 1}</span><span class="cost">${icon('coin')}<span id="cost-${t}"></span></span><span class="unit-state" id="state-${t}"></span><i class="cooldown" id="cooldown-${t}"></i></button>${infoButton(`unit-info-${t}`, UNIT_NAMES[t], `unit:${t}`)}</div>`).join('')}</div><div class="spell-deck"><div class="spell-slot"><button id="fire" class="spell" aria-label="${translate('장착 무기 공격')}"><span id="weapon-icon">${icon('star')}</span><span class="spell-cost">${icon('mana')}<span id="weapon-state"></span></span></button>${infoButton('weapon-info', translate('장착 무기'), 'weapon')}</div><div class="spell-slot"><button id="nova" class="spell nova" aria-label="${translate('신성한 파동')}">${icon('nova')}<span class="spell-cost">${icon('mana')}<span id="nova-state"></span></span><i class="spell-cooldown" id="nova-progress"></i></button>${infoButton('nova-info', translate('신성한 파동'), 'nova')}</div></div></div>
      <div id="paused" class="pause-scrim" hidden><div class="pause-box"><div class="pause-art" id="pause-art">${icon('pause')}</div><h2>${translate('일시정지')}</h2><p></p>${infoButton('story-info', translate('전장 이야기'), 'controls')}<button id="resume" class="primary">${translate('{0} 계속', [icon('play')])}</button><button id="retreat" class="secondary">${translate('{0} 나가기', [icon('arrow')])}</button></div></div>`,
      'battle-interface visual-battle',
    );
    const held = (id: 'left' | 'right' | 'fire') => {
      const button = this.get(id);
      let owner: number | null = null;
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        owner = e.pointerId;
        button.setPointerCapture(e.pointerId);
        controls[id] = true;
      });
      const clear = (e: PointerEvent) => {
        if (owner === e.pointerId) {
          controls[id] = false;
          owner = null;
        }
      };
      button.addEventListener('pointerup', clear);
      button.addEventListener('pointercancel', clear);
      button.addEventListener('lostpointercapture', clear);
    };
    held('left');
    held('right');
    held('fire');
    for (const t of ALLY_UNIT_TYPES)
      this.on(`summon-${t}`, () => {
        const slot = this.latest?.slots.find((slot) => slot.definition.type === t);
        if (slot && !slot.summonable)
          this.toast(
            `${UNIT_NAMES[t]} · ${this.slotState(t)}`,
            !slot.unlocked
              ? 'lock'
              : slot.cooldownRemainingMs > 0
                ? 'clock'
                : this.latest && this.latest.population >= this.latest.limit
                  ? 'party'
                  : 'coin',
          );
        else controls.summon(t);
      });
    this.infoHandler = (title, key) => {
      const v = this.latest;
      const descriptions: Record<string, string> = {
        base: translate('성역 체력 {0} / {1}\n성역 또는 루미의 체력이 0이면 패배합니다.', [
          v?.ally.current ?? 0,
          v?.ally.max ?? 0,
        ]),
        hero: translate(
          '{0}\n체력 {1} / {2}\n붉은 테두리는 체력 30% 이하의 위험 상태입니다. 동료 뒤로 후퇴해 회복하세요.',
          [v?.armorDescription ?? '', Math.ceil(v?.hero.current ?? 0), v?.hero.max ?? 0],
        ),
        resources: translate(
          '골드는 초당 3씩 회복하고 적 처치로 획득합니다. 동료 소환에 사용합니다.\n푸른 보석은 마나, 세 사람 모양은 병력입니다. 병력 한도 {0}명.\n흐려진 카드는 골드 부족·재사용 대기·인원 제한, 자물쇠는 미해금 상태입니다.',
          [v?.limit ?? 12],
        ),
        map: translate(
          '금빛 점은 루미, 녹색은 동료, 분홍색은 적입니다. 네모 테두리는 현재 화면 범위입니다. 양 끝의 성을 확인하며 전진하세요.',
        ),
        aura: v?.auraDescription ?? '',
        mission: translate(
          '{0} · {1}\n{2}\n요새 공략: 모든 증원을 처치하고 보호막이 해제된 요새를 파괴합니다.\n성역 수호: 시간과 격퇴 목표를 모두 달성합니다.\n군단 섬멸: 마지막 증원까지 모두 처치합니다.',
          [v?.missionLabel ?? '', v?.title ?? '', v?.phase ?? ''],
        ),
        weapon: translate('{0}\n마나 {1} · 버튼 또는 SPACE를 누르는 동안 연속 시전합니다.', [
          v?.weaponName ?? '',
          v?.weaponCost ?? 20,
        ]),
        nova: translate(
          '신성한 파동 · 마나 40 · 재사용 12초\n반경 300의 적에게 피해를 주고 밀어냅니다. 보스의 강타 예고를 차단할 수 있습니다. Q 또는 태양 모양 버튼을 누르세요.',
        ),
        controls: translate(
          '← → / A D · 이동\n1–8 · 동료 소환\nSPACE 누르기 · 무기 공격\nQ · 신성한 파동\nESC · 일시정지\n화면의 버튼을 눌러 조작할 수 있습니다. 이동과 공격을 동시에 누를 수도 있습니다.\n각 ⓘ 버튼에서 효과와 현재 상태를 확인하세요.',
        ),
      };
      let body = descriptions[key] ?? key;
      if (key === 'controls' && mobileViewport()) {
        body = translate(
          '왼쪽 화살표를 길게 눌러 이동하고 오른쪽 무기 버튼을 길게 눌러 공격하세요. 이동과 공격은 동시에 누를 수 있습니다.\n동료 카드를 좌우로 넘기고 원하는 카드를 눌러 소환하세요. 태양 버튼은 신성한 파동입니다.\nⓘ에서 설명을 확인하고, 일시정지 메뉴에서 장비·아우라·소리 설정을 확인하세요. ⛶ 버튼으로 전체화면을 열 수 있습니다.',
        );
      }
      if (key.startsWith('unit:')) {
        const type = key.slice(5) as AllyUnitType,
          slot = v?.slots.find((s) => s.definition.type === type);
        body = translate(
          '{0}\n소환 {1} 골드 · 재사용 {2}초\n{3}\n숫자 {4} 또는 초상 카드를 눌러 소환하세요.',
          [
            UNIT_ROLES[type],
            slot?.definition.summonCost ?? 0,
            (slot?.definition.summonCooldownMs ?? 0) / 1000,
            this.slotState(type),
            ALLY_UNIT_TYPES.indexOf(type) + 1,
          ],
        );
      }
      const wasPaused = !this.get('paused').hidden;
      controls.pause();
      this.showInfo(title, body, () => {
        if (!wasPaused && !document.hidden) controls.resume();
      });
    };
    this.on('nova', controls.nova);
    this.on('pause', controls.pause);
    this.on('resume', controls.resume);
    this.on('retreat', controls.retreat);
    this.on('mute', controls.mute);
    const more = document.createElement('div');
    more.className = 'mobile-pause-details';
    more.innerHTML =
      [
        [translate('성역'), 'base'],
        [translate('전황 지도'), 'map'],
        [translate('아우라'), 'aura'],
        [translate('장착 무기'), 'weapon'],
        [translate('신성한 파동'), 'nova'],
        [translate('조작 안내'), 'controls'],
      ]
        .map(
          ([title, key]) =>
            `<button class="secondary" data-info="${key}" data-info-title="${title}">${title}</button>`,
        )
        .join('') + `<button class="secondary" id="mobile-mute">${translate('음소거')}</button>`;
    this.get('paused').querySelector('.pause-box')!.append(more);
    this.on('mobile-mute', controls.mute);
    const releaseHeld = () => {
      controls.left = controls.right = controls.fire = false;
    };
    window.addEventListener('blur', releaseHeld);
    window.addEventListener('resize', releaseHeld);
    window.visualViewport?.addEventListener('resize', releaseHeld);
    scene.events.once('shutdown', () => {
      window.removeEventListener('blur', releaseHeld);
      window.removeEventListener('resize', releaseHeld);
      window.visualViewport?.removeEventListener('resize', releaseHeld);
      clearTimeout(this.toastTimer);
      controls.left = controls.right = controls.fire = false;
    });
  }
  render(v: BattleView): void {
    this.latest = v;
    this.text('mobile-mute', v.muted ? translate('소리 켜기') : translate('음소거'));
    for (const [id, label, health] of [
      ['hero-fill', translate('루미 체력'), v.hero],
      ['ally-fill', translate('성역 체력'), v.ally],
      ['target-fill', v.missionLabel, v.target],
    ] as const) {
      const meter = this.get(id).parentElement!;
      meter.setAttribute('role', 'progressbar');
      meter.setAttribute('aria-label', label);
      meter.setAttribute('aria-valuemin', '0');
      meter.setAttribute('aria-valuemax', String(health?.max ?? 100));
      meter.setAttribute('aria-valuenow', String(Math.max(0, Math.ceil(health?.current ?? 100))));
    }
    this.get('gold').parentElement!.setAttribute(
      'aria-label',
      translate('골드 {0}', [Math.floor(v.gold)]),
    );
    this.get('mana').parentElement!.setAttribute(
      'aria-label',
      translate('마나 {0} / {1}', [Math.floor(v.mana), v.manaMax]),
    );
    this.get('population').parentElement!.setAttribute(
      'aria-label',
      translate('동료 {0} / {1}', [v.population, v.limit]),
    );
    this.get('objective-value').setAttribute('aria-label', `${v.missionLabel} · ${v.phase}`);

    this.drawMap(v.world);
    this.text('hint', v.auraLabel.split(' · ')[0].replace(translate('오라 '), ''));
    this.text('weapon-state', String(v.weaponCost));
    this.get('fire').classList.toggle('unavailable', v.mana < v.weaponCost);
    this.get('weapon-icon').innerHTML = icon(
      v.weaponId === 'frost' ? 'snow' : v.weaponId === 'storm' ? 'sword' : 'star',
    );
    this.get('fire').setAttribute(
      'aria-label',
      translate('{0} · 마나 {1}', [v.weaponName, v.weaponCost]),
    );
    this.text('hero-hp', String(Math.ceil(v.hero.current)));
    this.get('hero-fill').style.width = `${Math.max(0, v.hero.current / v.hero.max) * 100}%`;
    this.get('mana-fill').style.width = `${(v.mana / v.manaMax) * 100}%`;
    this.root.classList.toggle('hero-in-danger', v.hero.current <= v.hero.max * 0.3);
    this.text('ally-hp', String(Math.ceil(v.ally.current)));
    this.get('ally-fill').style.width = `${Math.max(0, v.ally.current / v.ally.max) * 100}%`;
    this.text('target-hp', v.target ? String(Math.max(0, Math.ceil(v.target.current))) : '∞');
    this.get('target-fill').style.width =
      `${v.target ? Math.max(0, v.target.current / v.target.max) * 100 : 100}%`;
    this.text('battle-title', v.title.split(' · ')[0]);
    this.text(
      'phase',
      `${Math.floor(v.elapsed / 60000)}:${String(Math.floor(v.elapsed / 1000) % 60).padStart(2, '0')}`,
    );
    this.get('objective-icon').innerHTML = icon(
      v.objective.kind === 'hold'
        ? 'shield'
        : v.objective.kind === 'siege'
          ? 'castle'
          : v.objective.kind === 'survival'
            ? 'flag'
            : 'skull',
    );
    this.text(
      'objective-value',
      v.objective.kind === 'hold'
        ? `${v.objective.value}/${v.objective.max} · ${v.objective.secondary}s`
        : v.objective.kind === 'survival'
          ? String(v.objective.value)
          : `${v.objective.value}/${v.objective.max}`,
    );
    this.text('gold', String(Math.floor(v.gold)));
    this.text('mana', String(Math.floor(v.mana)));
    this.text('population', `${v.population}/${v.limit}`);
    this.get('mute').innerHTML = icon(v.muted ? 'mute' : 'sound');
    this.get('mute').setAttribute(
      'aria-label',
      v.muted ? translate('소리 켜기') : translate('음소거'),
    );
    for (const slot of v.slots) {
      const t = slot.definition.type,
        button = this.get(`summon-${t}`);
      button.setAttribute('aria-disabled', String(!slot.summonable));
      button.setAttribute(
        'aria-label',
        translate('{0} 소환 · {1}', [UNIT_NAMES[t], this.slotState(t)]),
      );
      this.text(`cost-${t}`, String(slot.definition.summonCost));
      button.classList.toggle('unavailable', !slot.summonable);
      button.classList.toggle('locked', !slot.unlocked);
      button.classList.toggle('ready', slot.summonable);
      this.get(`state-${t}`).innerHTML = !slot.unlocked
        ? icon('lock')
        : slot.cooldownRemainingMs > 0
          ? `${(slot.cooldownRemainingMs / 1000).toFixed(1)}`
          : slot.summonable
            ? ''
            : icon(v.population >= v.limit ? 'party' : 'coin');
      this.get(`cooldown-${t}`).style.width =
        `${100 * (1 - Math.min(1, slot.cooldownRemainingMs / slot.definition.summonCooldownMs))}%`;
    }
    this.text('nova-state', v.novaCooldown > 0 ? `${(v.novaCooldown / 1000).toFixed(1)}` : '40');
    this.get('nova-progress').style.height = `${Math.min(100, (v.novaCooldown / 12000) * 100)}%`;
    this.get<HTMLButtonElement>('nova').disabled = v.novaCooldown > 0 || v.mana < 40;
  }
  private slotState(type: AllyUnitType): string {
    const slot = this.latest?.slots.find((s) => s.definition.type === type);
    return !slot?.unlocked
      ? translate('기사단 정비에서 해금하세요')
      : slot.cooldownRemainingMs > 0
        ? translate('{0}초 후 준비', [(slot.cooldownRemainingMs / 1000).toFixed(1)])
        : this.latest!.population >= this.latest!.limit
          ? translate('병력 한도에 도달했습니다')
          : !slot.summonable
            ? translate('골드가 부족합니다')
            : translate('소환 준비 완료');
  }
  intro(title: string, body: string, summary: string): void {
    this.get('paused').querySelector('h2')!.textContent = title;
    this.get('paused').querySelector('p')!.textContent = summary;
    this.get('pause-art').innerHTML = icon('flag');
    this.get('story-info').dataset.info = body;
    this.get('story-info').dataset.infoTitle = title;
    this.get('resume').innerHTML = translate('{0} 출정', [icon('play')]);
  }
  private drawMap(w: BattleView['world']): void {
    const canvas = this.get<HTMLCanvasElement>('minimap');
    const c = canvas.getContext('2d')!;
    const x = (worldX: number) => 8 + Math.max(0, Math.min(1, worldX / w.width)) * 344;
    c.clearRect(0, 0, 360, 30);
    c.fillStyle = '#617568';
    c.fillRect(8, 15, 344, 2);
    c.fillStyle = 'rgba(245,216,149,.12)';
    c.strokeStyle = '#b7a575';
    c.fillRect(x(w.cameraX), 2, (w.viewport / w.width) * 344, 26);
    c.strokeRect(x(w.cameraX), 2, (w.viewport / w.width) * 344, 26);
    c.fillStyle = '#a7d9be';
    c.fillRect(x(w.allyBaseX) - 4, 10, 8, 13);
    c.fillStyle = '#d18aad';
    c.fillRect(x(w.enemyBaseX) - 4, 10, 8, 13);
    for (const [positions, color, y] of [
      [w.allies, '#a7d9be', 11],
      [w.enemies, '#e291ab', 20],
    ] as const) {
      c.fillStyle = color;
      for (const p of positions) c.fillRect(x(p) - 1, y, 3, 4);
    }
    c.fillStyle = '#ffe4a2';
    c.beginPath();
    c.arc(x(w.heroX), 15, 4, 0, Math.PI * 2);
    c.fill();
  }

  pause(paused: boolean): void {
    this.get('paused').hidden = !paused;
    if (paused) this.controls.left = this.controls.right = this.controls.fire = false;
  }
  toast(message: string, glyph: IconName = 'star', count?: number): void {
    this.get('toast').innerHTML =
      `${icon(glyph)}${count ? `<b>${count}</b>` : ''}${infoButton('event-info', translate('전투 알림'), message)}`;
    this.get('toast').setAttribute('aria-label', message);
    this.get('toast').classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.get('toast').classList.remove('visible'), 2300);
  }
}
