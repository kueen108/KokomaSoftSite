import { translate } from '../i18n/index';
import { heroProgress } from '../systems/HeroProgressSystem';
import { readExperience, writeExperience, DIFFICULTIES } from '../systems/ExperienceSystem';
import Phaser from 'phaser';
import { icon, infoButton } from '../ui/Icons';
import { gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import { SCENE } from '../config/gameConfig';
import { Backdrop } from '../ui/Backdrop';
import { Interface, portrait } from '../ui/Interface';
import { loadState } from '../systems/SaveSystem';
import { browserStorage } from '../storage/browserStorage';
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE.mainMenu);
  }
  create(): void {
    new Backdrop(this, 'menu');
    const audio = gameAudio(this.game);
    audio.playBgm(SOUND.bgmMenu);
    audio.attach(this, { volumeKeys: true });
    const save = loadState(browserStorage());
    const ui = new Interface(
      this,
      `<div class="menu-copy"><h1>${translate('새벽잎 원정대')}</h1><div class="subtitle">${translate('네 개의 맹세')}</div>${infoButton('menu-info', translate('네 개의 맹세'), translate('루미와 동료를 이끌고 네 지역의 열두 전장을 지나 새벽을 되찾으세요.\n원정에서 얻은 골드로 기사단과 장비를 성장시킬 수 있습니다.\n키보드, 마우스, 터치로 플레이할 수 있습니다.'))}<div class="menu-actions"><button id="play" class="primary">${translate('{0} 원정', [icon('play')])}</button><button id="upgrade" class="secondary">${translate('{0} 기사단', [icon('shield')])}</button></div></div><div class="menu-hero">${portrait(0, false, heroProgress(save).auraLevel)}</div><footer class="menu-footer"><span>${icon('flag')} ${save.clearedStages.length}/12</span><span>${icon('coin')} ${save.settlementGold}</span><button id="sound" class="sound-button" aria-label="${translate('환경 설정')}">${icon('gear')}</button></footer><section class="sound-panel" id="sound-panel" hidden><h2>${translate('설정 {0}', [infoButton('settings-info', translate('환경 설정'), translate('음량과 음소거, 전투 연출, 난이도를 바꿀 수 있습니다.\n간결한 연출은 번쩍임과 화면 흔들림을 줄입니다.\n이야기: 적 체력 85%, 공격 75%, 승리 보상 80%.\n일반: 100%. 도전: 적 체력 115%, 공격 125%, 보상 120%.\n난이도와 전투 연출은 다음 전투부터 적용됩니다.'))])}</h2><div class="volume-controls"><button id="quieter" aria-label="${translate('음량 줄이기')}">−</button><span id="volume"></span><button id="louder" aria-label="${translate('음량 높이기')}">+</button></div><button id="mute" class="secondary"></button><button id="effects" class="secondary"></button><button id="setting-difficulty" class="secondary"></button><button id="close-sound" class="minor">${translate('닫기')}</button></section>`,
    );
    const play = () => this.scene.start(SCENE.modeSelect);
    const upgrade = () => this.scene.start(SCENE.upgrade);
    ui.on('play', play);
    ui.on('upgrade', upgrade);
    let experience = readExperience(browserStorage());
    ui.on('effects', () => {
      experience = { ...experience, effects: experience.effects === 'full' ? 'light' : 'full' };
      writeExperience(browserStorage(), experience);
      refreshSound();
    });
    ui.on('setting-difficulty', () => {
      experience = {
        ...experience,
        difficulty:
          experience.difficulty === 'normal'
            ? 'veteran'
            : experience.difficulty === 'veteran'
              ? 'story'
              : 'normal',
      };
      writeExperience(browserStorage(), experience);
      refreshSound();
    });
    const refreshSound = () => {
      const d = DIFFICULTIES[experience.difficulty];
      ui.text('setting-difficulty', translate('난이도 · {0}', [d.name]));
      ui.text(
        'effects',
        experience.effects === 'full' ? translate('연출 · 풍부') : translate('연출 · 간결'),
      );
      ui.text('volume', `${audio.settings.volumeStep * 20}%`);
      ui.text('mute', audio.settings.muted ? translate('소리 켜기') : translate('음소거'));
    };
    ui.on('sound', () => {
      ui.get('sound-panel').hidden = !ui.get('sound-panel').hidden;
      refreshSound();
    });
    ui.on('close-sound', () => {
      ui.get('sound-panel').hidden = true;
    });
    ui.on('mute', () => {
      audio.toggleMuted();
      refreshSound();
    });
    ui.on('quieter', () => {
      audio.changeVolume(-1);
      refreshSound();
    });
    ui.on('louder', () => {
      audio.changeVolume(1);
      refreshSound();
    });
    this.input.keyboard?.on('keydown-M', refreshSound);
    this.input.keyboard?.on('keydown-LEFT', refreshSound);
    this.input.keyboard?.on('keydown-RIGHT', refreshSound);
    this.input.keyboard?.once('keydown-SPACE', play);
    this.input.keyboard?.once('keydown-U', upgrade);
  }
}
