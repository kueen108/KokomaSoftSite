import { translate } from '../i18n/index';
import { readExperience, writeExperience, DIFFICULTIES } from '../systems/ExperienceSystem';
import type { Difficulty } from '../systems/ExperienceSystem';
import Phaser from 'phaser';
import { icon, infoButton } from '../ui/Icons';
import { gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import { SCENE } from '../config/gameConfig';
import { CAMPAIGN_STAGES } from '../data/stages';
import { CAMPAIGN_STORY, REGIONS, MISSION_NAMES } from '../data/expedition';
import { browserStorage } from '../storage/browserStorage';
import { loadState } from '../systems/SaveSystem';
import { isStageUnlocked } from '../systems/StageSystem';
import type { PersistedState } from '../types/save';
import { Backdrop } from '../ui/Backdrop';
import { Interface, top, back } from '../ui/Interface';
export class StageSelectScene extends Phaser.Scene {
  private state!: PersistedState;
  private selection = 0;
  private region = 0;
  private experience = readExperience(browserStorage());
  private ui!: Interface;
  constructor() {
    super(SCENE.stageSelect);
  }
  create(): void {
    new Backdrop(this, 'menu');
    const audio = gameAudio(this.game);
    audio.playBgm(SOUND.bgmMenu);
    audio.attach(this);
    this.state = loadState(browserStorage());
    this.experience = readExperience(browserStorage());
    this.selection = CAMPAIGN_STAGES.findIndex((s) => !this.state.clearedStages.includes(s.id));
    if (this.selection < 0) this.selection = 11;
    this.region = Math.floor(this.selection / 3);
    this.ui = new Interface(
      this,
      `${top('THE FOUR OATHS', translate('원정 지도'), '')}${back}<div class="difficulty-row">${icon('sword')}<div id="difficulty" class="difficulty-switch"></div>${infoButton('difficulty-info', translate('난이도'))}</div><div id="regions" class="region-tabs"></div><div id="stages" class="mode-grid stage-grid"></div><div class="screen-foot"><span id="notice" class="notice"></span><span class="campaign-marks" aria-label="${translate('{0}/12 완료', [this.state.clearedStages.length])}">${CAMPAIGN_STAGES.map((s) => `<i class="${this.state.clearedStages.includes(s.id) ? 'done' : ''}"></i>`).join('')}</span></div>`,
    );
    this.ui.on('back', () => this.scene.start(SCENE.modeSelect));
    const move = (n: number) => {
      this.selection = (this.selection + n + 12) % 12;
      this.region = Math.floor(this.selection / 3);
      this.refresh();
    };
    this.input.keyboard?.on('keydown-DOWN', () => move(1));
    this.input.keyboard?.on('keydown-UP', () => move(-1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmEntry());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENE.modeSelect));
    this.refresh();
  }
  private refresh(): void {
    this.ui.get('difficulty').innerHTML = (Object.keys(DIFFICULTIES) as Difficulty[])
      .map(
        (id) =>
          `<button id="difficulty-${id}" class="${this.experience.difficulty === id ? 'selected' : ''}" aria-pressed="${this.experience.difficulty === id}">${DIFFICULTIES[id].name}</button>`,
      )
      .join('');
    (Object.keys(DIFFICULTIES) as Difficulty[]).forEach((id) =>
      this.ui.on(`difficulty-${id}`, () => {
        this.experience = { ...this.experience, difficulty: id };
        writeExperience(browserStorage(), this.experience);
        this.refresh();
      }),
    );
    const d = DIFFICULTIES[this.experience.difficulty];
    this.ui.get('difficulty-info').dataset.info = translate(
      '{0}\n적 체력 {1}% · 적 공격 {2}%\n승리 보상 {3}%\n다음 전투부터 모든 모드에 적용합니다.',
      [d.name, Math.round(d.hp * 100), Math.round(d.damage * 100), Math.round(d.reward * 100)],
    );
    this.ui.get('regions').innerHTML = REGIONS.map(
      (r, i) =>
        `<button id="region-${i}" class="region-tab ${this.region === i ? 'selected' : ''}">${icon((['aura', 'snow', 'flame', 'star'] as const)[i])}${r.name}</button>`,
    ).join('');
    REGIONS.forEach((_, i) =>
      this.ui.on(`region-${i}`, () => {
        this.region = i;
        this.selection = i * 3;
        this.refresh();
      }),
    );
    this.ui.get('stages').innerHTML = CAMPAIGN_STAGES.slice(this.region * 3, this.region * 3 + 3)
      .map((s) => {
        const i = s.order - 1,
          story = CAMPAIGN_STORY[s.id],
          open = isStageUnlocked(CAMPAIGN_STAGES, s.id, this.state.clearedStages),
          clear = this.state.clearedStages.includes(s.id);
        const art =
          i < 3
            ? ['forest-battle', 'ruins-battle', 'graveyard-battle'][i]
            : REGIONS[story.region].art;
        const mission =
          story.mission === 'hold'
            ? translate('{0}초 수호 · 적 {1}명 격퇴', [story.duration / 1000, story.requiredKills])
            : MISSION_NAMES[story.mission];
        return `<div class="stage-choice"><button id="stage-${i}" style="--stage-art:url('${import.meta.env.BASE_URL}assets/images/${art}.webp')" class="mode-card stage-card ${open ? '' : 'locked'} ${this.selection === i ? 'selected' : ''}" aria-label="${s.displayName}${open ? '' : translate(' · 잠김')}"><span class="stage-icon">${String(i + 1).padStart(2, '0')}</span><span class="stage-state">${icon(clear ? 'check' : open ? (story.mission === 'hold' ? 'shield' : story.mission === 'hunt' ? 'skull' : 'castle') : 'lock')}</span><h2>${s.displayName}</h2></button>${infoButton(`stage-info-${i}`, s.displayName, `${mission}\n\n${story.intro}\n\n${story.reward}${open ? '' : translate('\n이전 전장을 먼저 클리어하세요.')}`)}</div>`;
      })
      .join('');
    CAMPAIGN_STAGES.slice(this.region * 3, this.region * 3 + 3).forEach((s) =>
      this.ui.on(`stage-${s.order - 1}`, () => {
        this.selection = s.order - 1;
        this.confirmEntry();
      }),
    );
  }

  private confirmEntry(): void {
    const stage = CAMPAIGN_STAGES[this.selection];
    if (!isStageUnlocked(CAMPAIGN_STAGES, stage.id, this.state.clearedStages)) {
      this.ui.showInfo(stage.displayName, translate('이전 전장을 먼저 클리어하세요.'));
      return;
    }
    this.scene.start(SCENE.battle, { stage });
  }
}
