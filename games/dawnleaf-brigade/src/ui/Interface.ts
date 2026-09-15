import { translate } from '../i18n/index';
import Phaser from 'phaser';
import './interface.css';
import { icon, infoButton } from './Icons';
import { growthPortraits } from './PortraitArt';
import { growthRank } from '../systems/HeroProgressSystem';

/** A semantic, touch-friendly overlay sharing the canvas' design coordinates. */
export class Interface {
  readonly root: HTMLDivElement;
  private popup!: HTMLDivElement;
  private returnFocus: HTMLElement | null = null;
  private afterClose: (() => void) | undefined;
  infoHandler?: (title: string, body: string) => void;
  constructor(scene: Phaser.Scene, html: string, className = '') {
    this.root = document.createElement('div');
    this.root.className = `game-interface ${className}`;
    this.root.innerHTML = `<div class="interface-content">${html}</div><div class="info-scrim" hidden><section class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" tabindex="-1"><button class="info-close" aria-label="${translate('설명 닫기')}">×</button><div class="info-emblem">${icon('book')}</div><h2 id="info-title"></h2><div class="info-body"></div></section></div>`;
    this.popup = this.root.querySelector<HTMLDivElement>('.info-scrim')!;
    this.root.addEventListener('click', (e) => {
      const button = (e.target as Element).closest<HTMLElement>('[data-info]');
      if (button) {
        const title = button.dataset.infoTitle ?? '',
          body = button.dataset.info ?? '';
        if (this.infoHandler) this.infoHandler(title, body);
        else this.showInfo(title, body);
      }
    });
    this.popup.querySelector('.info-close')!.addEventListener('click', () => this.closeInfo());
    this.popup.addEventListener('click', (e) => {
      if (e.target === this.popup) this.closeInfo();
    });
    const guard = (e: KeyboardEvent) => {
      if (this.popup.hidden) return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeInfo();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        this.popup.querySelector<HTMLButtonElement>('.info-close')!.focus();
      }
    };
    window.addEventListener('keydown', guard, true);
    window.addEventListener('keyup', guard, true);
    document.body.append(this.root);
    const resize = () => {
      const rect = scene.game.canvas.getBoundingClientRect();
      this.root.style.left = `${rect.left}px`;
      this.root.style.top = `${rect.top}px`;
      this.root.style.transform = `scale(${rect.width / 1280})`;
    };
    resize();
    scene.scale.on('resize', resize);
    window.addEventListener('resize', resize);
    scene.events.once('shutdown', () => {
      window.removeEventListener('keydown', guard, true);
      window.removeEventListener('keyup', guard, true);
      this.root.remove();
      scene.scale.off('resize', resize);
      window.removeEventListener('resize', resize);
    });
  }
  showInfo(title: string, body: string, onClose?: () => void): void {
    if (this.popup.hidden)
      this.returnFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.afterClose = onClose;
    this.popup.querySelector('h2')!.textContent = title;
    this.popup.querySelector('.info-body')!.textContent = body;
    this.popup.hidden = false;
    this.root.querySelector<HTMLElement>('.interface-content')!.inert = true;
    this.popup.querySelector<HTMLButtonElement>('.info-close')!.focus();
  }
  closeInfo(): void {
    if (this.popup.hidden) return;
    this.popup.hidden = true;
    this.root.querySelector<HTMLElement>('.interface-content')!.inert = false;
    this.returnFocus?.focus({ preventScroll: true });
    const action = this.afterClose;
    this.afterClose = undefined;
    action?.();
  }
  on(id: string, action: () => void): void {
    this.get(id).addEventListener('click', action);
  }
  get<T extends HTMLElement = HTMLElement>(id: string): T {
    return this.root.querySelector<T>(`#${id}`)!;
  }
  text(id: string, value: string): void {
    const el = this.get(id);
    if (el.textContent !== value) el.textContent = value;
  }
}

export const UNIT_NAMES: Record<string, string> = {
  tanker: translate('곰 수호병'),
  dealer: translate('여우 검사'),
  archer: translate('토끼 궁수'),
  guardian: translate('오소리 철벽병'),
  bannerman: translate('너구리 기수'),
  mage: translate('올빼미 화염술사'),
  cleric: translate('사슴 치유사'),
  lancer: translate('늑대 창기사'),
};
export const UNIT_SHORT_NAMES: Record<string, string> = {
  tanker: translate('수호병'),
  dealer: translate('검사'),
  archer: translate('궁수'),
  guardian: translate('철벽병'),
  bannerman: translate('기수'),
  mage: translate('화염술사'),
  cleric: translate('치유사'),
  lancer: translate('창기사'),
};
export const UNIT_ROLES: Record<string, string> = {
  tanker: translate('전선을 지키는 든든한 방패'),
  dealer: translate('빠르고 강력한 근접 공격'),
  archer: translate('후방에서 지원하는 원거리 공격'),
  guardian: translate('받는 피해를 줄이는 중장갑'),
  bannerman: translate('군기 · 주변 아군의 공격력·속도 강화'),
  mage: translate('화염 지팡이 · 반경 90 · 주 대상과 추가 3명에게 폭발 피해'),
  cleric: translate('치유의 종 · 2.4초마다 루미 포함 부상자 최대 3명 HP 8 회복'),
  lancer: translate('장창과 원형 방패 · 두 적을 관통하는 창 투척'),
};
export const expansionPortraits: Record<number, string> = {};
export const portrait = (index: number, enemy = false, level = 0) =>
  !enemy && growthPortraits[`${index}-${growthRank(level)}`]
    ? `<span class="portrait extra-portrait" data-growth="${growthRank(level)}" style="background-image:url('${growthPortraits[`${index}-${growthRank(level)}`]}')" aria-hidden="true"></span>`
    : index > 5 && !enemy
      ? `<span class="portrait extra-portrait" style="background-image:url('${expansionPortraits[index] ?? ''}')" aria-hidden="true"></span>`
      : `<span class="portrait ${enemy ? 'enemy' : ''}" style="--col:${index % 3};--row:${Math.floor(index / 3)}" aria-hidden="true"></span>`;
export const top = (_eyebrow: string, title: string, subtitle: string) =>
  `<header class="screen-heading"><h1>${title}</h1>${subtitle ? infoButton('screen-info', title, subtitle) : ''}</header>`;
export const back = `<button id="back" class="back-button" aria-label="${translate('돌아가기')}">${icon('arrow')}</button>`;
