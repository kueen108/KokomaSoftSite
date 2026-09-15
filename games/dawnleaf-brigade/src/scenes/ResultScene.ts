import { translate } from '../i18n/index';
import { CAMPAIGN_STORY } from '../data/expedition';
import Phaser from 'phaser';
import { icon, infoButton } from '../ui/Icons';
import { gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import { SCENE } from '../config/gameConfig';
import { nextStage } from '../data/stages';
import type { BattleOutcome } from '../types/combat';
import type { BattleLaunch } from '../types/mode';
import type { StageConfig } from '../types/stage';
import { Backdrop } from '../ui/Backdrop';
import { Interface } from '../ui/Interface';
interface ResultSceneData {
  outcome: BattleOutcome;
  launch: BattleLaunch;
  stage: StageConfig | null;
  settlement: number;
  saved?: boolean;
  elapsedMs?: number;
  difficulty?: string;
  defeatReason?: string;
  survival: { record: number; best: number } | null;
}
export class ResultScene extends Phaser.Scene {
  private result!: ResultSceneData;
  constructor() {
    super(SCENE.result);
  }
  init(data: ResultSceneData): void {
    this.result = data;
  }
  create(): void {
    new Backdrop(this, 'menu');
    const audio = gameAudio(this.game);
    audio.playBgm(SOUND.bgmMenu);
    audio.attach(this);
    const r = this.result;
    const victory = r.outcome === 'victory';
    const following = victory && r.stage ? nextStage(r.stage.id) : null;
    const ui = new Interface(
      this,
      `<section class="result-panel visual-result"><div class="result-medal ${victory ? 'won' : 'lost'}">${icon(r.survival ? 'flag' : victory ? 'shield' : 'heart')}</div><h1>${r.survival ? translate('생존') : victory ? translate('승리') : translate('패배')}</h1><div class="result-meta">${icon('clock')} ${Math.floor((r.elapsedMs ?? 0) / 60000)}:${String(Math.floor(((r.elapsedMs ?? 0) % 60000) / 1000)).padStart(2, '0')}${r.survival ? ` · ${icon('flag')} ${r.survival.record}` : ''}</div><div class="reward">${icon('coin')} +${r.settlement}</div>${infoButton('result-info', r.stage?.displayName ?? translate('전투 결과'), translate('{0} 난이도\n{1}\n정산 골드 +{2}', [r.difficulty ?? translate('일반'), r.survival ? translate('최고 기록 {0} 웨이브', [r.survival.best]) : victory ? (r.stage ? CAMPAIGN_STORY[r.stage.id].ending + '\n\n' + CAMPAIGN_STORY[r.stage.id].reward : translate('무덤지기를 물리쳤습니다.')) : (r.defeatReason ?? translate('동료와 함께 다시 도전하세요.')), r.settlement]))}${r.saved === false ? `<p class="save-warning" role="alert">${translate('저장 실패 · 브라우저 저장 공간을 확인하세요.')}</p>` : ''}<div class="result-actions"><button id="next" class="primary">${icon('play')} ${following ? translate('다음') : translate('재도전')}</button><button id="upgrade" class="secondary">${translate('{0} 기사단', [icon('shield')])}</button></div><button id="menu" class="minor" aria-label="${translate('메인 메뉴')}">${icon('arrow')}</button></section>`,
    );
    const retry = () => this.scene.start(SCENE.battle, r.launch);
    const next = () =>
      following ? this.scene.start(SCENE.battle, { ...r.launch, stage: following }) : retry();
    ui.on('next', next);
    ui.on('upgrade', () => this.scene.start(SCENE.upgrade));
    ui.on('menu', () => this.scene.start(SCENE.mainMenu));
    this.input.keyboard?.once('keydown-R', retry);
    if (following) this.input.keyboard?.once('keydown-N', next);
    if (r.stage) this.input.keyboard?.once('keydown-S', () => this.scene.start(SCENE.stageSelect));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SCENE.mainMenu));
  }
}
