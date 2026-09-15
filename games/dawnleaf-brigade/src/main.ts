/// <reference types="vite/client" />
import Phaser from 'phaser';
import { localizeDocument } from './i18n';

import { gameConfig } from './config/gameConfig';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { UpgradeScene } from './scenes/UpgradeScene';

// Scene registration order. The first entry starts automatically; the rest are
// entered by name. New scenes are appended at the end and existing lines are
// not reordered (structure.md @NAV:DEC-SHARED-FILE-APPEND-ONLY).
const scenes = [
  BootScene,
  PreloadScene,
  MainMenuScene,
  BattleScene,
  ResultScene,
  UpgradeScene,
  StageSelectScene,
  ModeSelectScene,
];

localizeDocument();
const game = new Phaser.Game({ ...gameConfig, scene: scenes });

// Dev-only handle for browser verification (tech.md @NAV:DEC-VERIFY-DUAL).
//
// Scenes, entities and UI are verified by driving the real game rather than by
// unit tests (C-8), and the two defects Phase 1 shipped were both of the kind
// that every test passes and only a running browser reveals. Reading live
// scene state is what turns that verification from "it looked right" into an
// assertion, so this exposes the game instance to a driving script — Phaser's
// ESM build registers no global of its own.
//
// `import.meta.env.DEV` is false in `npm run build`, so this whole block is
// removed from the production bundle.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
