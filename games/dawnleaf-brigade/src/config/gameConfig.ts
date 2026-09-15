import Phaser from 'phaser';

/** Logical coordinates shared by Phaser and the responsive HTML interface. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const LANE_Y = 470;
export const WORLD_WIDTH = 3840;
export const LANE_LEFT_BOUND = 140;
export const LANE_RIGHT_BOUND = WORLD_WIDTH - 200;
export const ALLY_BASE_X = 140;
export const ENEMY_BASE_X = WORLD_WIDTH - 140;
export const BASE_WIDTH = 70;
export const BASE_HEIGHT = 130;
export const ENEMY_SPAWN_X = WORLD_WIDTH - 280;
export const PROJECTILE_CULL_X = WORLD_WIDTH + 60;
export const PROJECTILE_CULL_X_LEFT = -60;

/** Stable texture keys: painted art replaces the original fallback textures. */
export const TEXTURE = {
  paladog: 'tex-paladog',
  enemy: 'tex-enemy',
  projectile: 'tex-projectile',
  allyBase: 'tex-ally-base',
  enemyBase: 'tex-enemy-base',
} as const;
export const SCENE = {
  boot: 'Boot',
  preload: 'Preload',
  mainMenu: 'MainMenu',
  battle: 'Battle',
  result: 'Result',
  upgrade: 'Upgrade',
  stageSelect: 'StageSelect',
  modeSelect: 'ModeSelect',
} as const;
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#09231d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
};
/** Used only when loading artwork fails. */
export const PALADOG_WIDTH = 40;
export const PALADOG_HEIGHT = 56;
export const PROJECTILE_SIZE = 16;

/** The gameplay aura measures x distance; its ellipse is only floor lighting. */
export const AURA_VERTICAL_RATIO = 0.16;
export const AURA_CENTER_Y = LANE_Y + 30;
export const AURA_FILL_ALPHA = 0.09;
export const GROUND_DEPTH = 0;
export const AURA_DEPTH = 0.1;
export const SPRITE_DEPTH = 0.2;
