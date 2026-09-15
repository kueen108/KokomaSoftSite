import { translate } from '../i18n/index';
import Phaser from 'phaser';
import { infoButton } from '../ui/Icons';
import { gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import { SCENE } from '../config/gameConfig';
import { GAME_MODE_DEFINITIONS } from '../data/modes';
import { Backdrop } from '../ui/Backdrop';
import { Interface, top, back, portrait } from '../ui/Interface';
export class ModeSelectScene extends Phaser.Scene {
  private selection = 0;
  private ui!: Interface;
  constructor() {
    super(SCENE.modeSelect);
  }
  create(): void {
    new Backdrop(this, 'menu');
    const audio = gameAudio(this.game);
    audio.playBgm(SOUND.bgmMenu);
    audio.attach(this);
    this.selection = 0;
    const cards = [
      [
        translate('네 개의 맹세'),
        '12-STAGE CAMPAIGN',
        `${translate('네 지역의 열두 전장을 지나')}<br>${translate('동료들과 새벽을 되찾으세요.')}`,
        portrait(0),
      ],
      [
        translate('끝없는 파도'),
        'SURVIVAL',
        `${translate('점점 강해지는 군단을 상대하세요.')}<br>${translate('최후까지 버틴 웨이브가 기록됩니다.')}`,
        portrait(1),
      ],
      [
        translate('무덤지기의 왕좌'),
        'BOSS CHALLENGE',
        `${translate('세 번 변하는 거대한 수호자.')}<br>${translate('마지막 순간까지 방심하지 마세요.')}`,
        portrait(5, true),
      ],
    ];
    this.ui = new Interface(
      this,
      `${top('CHOOSE YOUR ADVENTURE', translate('모험'), translate('동료를 지휘하고 빛의 오라 안에서 함께 싸우세요.'))}${back}<div class="mode-grid">${cards.map((c, i) => `<div class="mode-choice"><button id="mode-${i}" class="mode-card"><span class="number">0${i + 1}</span>${c[3]}<h2>${[translate('원정'), translate('생존'), translate('보스')][i]}</h2></button>${infoButton(`mode-info-${i}`, c[0], c[2].replaceAll('<br>', '\n'))}</div>`).join('')}</div>`,
    );
    cards.forEach((_, i) =>
      this.ui.on(`mode-${i}`, () => {
        this.selection = i;
        this.confirmEntry();
      }),
    );
    this.ui.on('back', () => this.scene.start(SCENE.mainMenu));
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selection = (this.selection + 1) % 3;
      this.refresh();
    });
    this.input.keyboard?.on('keydown-UP', () => {
      this.selection = (this.selection + 2) % 3;
      this.refresh();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmEntry());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENE.mainMenu));
    this.refresh();
  }
  private refresh(): void {
    for (let i = 0; i < 3; i++)
      this.ui.get(`mode-${i}`).classList.toggle('selected', i === this.selection);
  }
  private confirmEntry(): void {
    const { entry } = GAME_MODE_DEFINITIONS[this.selection];
    if (entry.kind === 'battle') this.scene.start(SCENE.battle, entry.launch);
    else this.scene.start(SCENE.stageSelect);
  }
}
