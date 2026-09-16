import { translate } from '../i18n/index';
import { mobileViewport, visibleViewport, mobileBattleLayout } from '../ui/MobileViewport';
import { readExperience, DIFFICULTIES } from '../systems/ExperienceSystem';
import { formationStops, SPLASH_TARGET_LIMIT, HEAL_TARGET_LIMIT } from '../systems/PolishSystem';
import { CAMPAIGN_STORY, MISSION_NAMES } from '../data/expedition';
import { heroProgress, heroStats, auraAt, WEAPONS, ARMORS } from '../systems/HeroProgressSystem';
import { applyGrowthAppearance } from '../ui/GrowthArt';
import { limitHeroAdvance } from '../systems/PositioningSystem';
import type { ShotEffect } from '../types/combat';
import { BattleInterface } from '../ui/BattleInterface';
import type { BattleControls } from '../ui/BattleInterface';
import {
  incomeAfter,
  canCastNova,
  novaHits,
  NOVA_COST,
  NOVA_DAMAGE,
  NOVA_COOLDOWN_MS,
  NOVA_RADIUS,
} from '../systems/TacticsSystem';

import Phaser from 'phaser';

import { GameAudio, gameAudio } from '../audio/GameAudio';
import { SOUND } from '../config/audio';
import {
  ALLY_BASE_HP,
  ATTACK_COOLDOWN_MS,
  ATTACK_COST,
  BANNERMAN_AURA_ATTACK_MULTIPLIER,
  BANNERMAN_AURA_RADIUS,
  BANNERMAN_AURA_SPEED_MULTIPLIER,
  BATTLE_START_GOLD,
  ENEMY_BOUNTY,
  MANA_MAX,
  MANA_REGEN_PER_SEC,
  OVERSEER_AURA_ATTACK_MULTIPLIER,
  OVERSEER_AURA_RADIUS,
  OVERSEER_AURA_SPEED_MULTIPLIER,
  POPULATION_LIMIT,
  PROJECTILE_DAMAGE,
  PROJECTILE_SPEED,
} from '../config/balance';
import {
  ALLY_BASE_X,
  AURA_CENTER_Y,
  AURA_DEPTH,
  AURA_FILL_ALPHA,
  AURA_VERTICAL_RATIO,
  ENEMY_BASE_X,
  ENEMY_SPAWN_X,
  WORLD_WIDTH,
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_DEPTH,
  LANE_Y,
  SCENE,
  SPRITE_DEPTH,
  TEXTURE,
} from '../config/gameConfig';
import { enemyDefinition } from '../data/enemies';
import { SURVIVAL_CONFIG } from '../data/modes/survival';
import { ringDefinition } from '../data/rings';
import { unitDefinition } from '../data/units';
import { AllyUnit } from '../entities/AllyUnit';
import { Base } from '../entities/Base';
import { Boss } from '../entities/Boss';
import { EnemyUnit } from '../entities/EnemyUnit';
import { Paladog } from '../entities/Paladog';
import { Projectile } from '../entities/Projectile';
import { BattleFx } from '../fx/BattleFx';
import { UnitMotion } from '../fx/UnitMotion';
import { browserStorage } from '../storage/browserStorage';
import {
  effectiveStats,
  isWithinAnyAura,
  isWithinAura,
  strongestAuraBuff,
} from '../systems/AuraSystem';
import type { AuraSource } from '../systems/AuraSystem';
import { recordBossResult } from '../systems/BossSystem';
import {
  canAttack,
  consumeAttackCost,
  regenerateMana,
  resolveModeOutcome,
  tickCooldown,
} from '../systems/CombatSystem';
import {
  applySummon,
  awardBounty,
  canSummon,
  computeSettlement,
  initialBattleEconomy,
  releasePopulationSlot,
  tickSummonCooldowns,
} from '../systems/EconomySystem';
import type { BattleEconomy } from '../systems/EconomySystem';
import { effectiveAttackParams, ringLevel } from '../systems/RingSystem';
import { loadState, saveState } from '../systems/SaveSystem';
import { dueSpawns } from '../systems/SpawnSystem';
import { recordStageResult } from '../systems/StageSystem';
import { isWithinRange, nearestCandidateWithinRange } from '../systems/TargetingSystem';
import { recordSurvivalRun, survivalWave, survivalStats } from '../systems/SurvivalSystem';
import { isUnlocked, statsAtLevel, upgradeLevel } from '../systems/UpgradeSystem';
import { Backdrop } from '../ui/Backdrop';
import type { SummonSlot } from '../ui/SummonBar';
import type { BossDefinition, BossPhase } from '../types/boss';
import type { AttackState, BattleOutcome } from '../types/combat';
import { IMPLICIT_BATTLE_MODE } from '../types/mode';
import type { BattleLaunch, GameMode, SurvivalSpawn } from '../types/mode';
import type { AttackParams, RingDefinition } from '../types/ring';
import type { PersistedState } from '../types/save';
import { ALLY_UNIT_TYPES } from '../types/unit';
import type { AllyUnitType, AuraBuff, EngagedTarget, UnitStats } from '../types/unit';
import { ENEMY_KINDS } from '../types/stage';
import type { StageConfig } from '../types/stage';

const BANNERMAN_AURA_BUFF: AuraBuff = {
  attackDamageMultiplier: BANNERMAN_AURA_ATTACK_MULTIPLIER,
  speedMultiplier: BANNERMAN_AURA_SPEED_MULTIPLIER,
};

const OVERSEER_AURA_BUFF: AuraBuff = {
  attackDamageMultiplier: OVERSEER_AURA_ATTACK_MULTIPLIER,
  speedMultiplier: OVERSEER_AURA_SPEED_MULTIPLIER,
};

const SUMMON_KEYS: Readonly<Record<AllyUnitType, number>> = {
  tanker: Phaser.Input.Keyboard.KeyCodes.ONE,
  dealer: Phaser.Input.Keyboard.KeyCodes.TWO,
  archer: Phaser.Input.Keyboard.KeyCodes.THREE,
  guardian: Phaser.Input.Keyboard.KeyCodes.FOUR,
  bannerman: Phaser.Input.Keyboard.KeyCodes.FIVE,
  mage: Phaser.Input.Keyboard.KeyCodes.SIX,
  cleric: Phaser.Input.Keyboard.KeyCodes.SEVEN,
  lancer: Phaser.Input.Keyboard.KeyCodes.EIGHT,
};

const SUMMON_KEY_LABELS: Readonly<Record<AllyUnitType, string>> = {
  tanker: '1',
  dealer: '2',
  archer: '3',
  guardian: '4',
  bannerman: '5',
  mage: '6',
  cleric: '7',
  lancer: '8',
};

const ALLY_SPAWN_X = ALLY_BASE_X + 60;

type PhysicsObject =
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Tilemaps.Tile;

interface LegacyCampaignLaunch {
  readonly mode?: undefined;
  readonly stage: StageConfig;
}

type BattleSceneData = BattleLaunch | LegacyCampaignLaunch;

export interface AuraEllipse {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

function participant<T>(
  first: PhysicsObject,
  second: PhysicsObject,
  kind: abstract new (...args: never[]) => T,
): T | null {
  if (first instanceof kind) {
    return first;
  }

  if (second instanceof kind) {
    return second;
  }

  return null;
}

export class BattleScene extends Phaser.Scene {
  private launch!: BattleLaunch;
  private mode!: GameMode;

  private stage: StageConfig | null = null;
  private bossDefinition: BossDefinition | null = null;
  private attackState!: AttackState;
  private allyBase!: Base;

  private enemyBase: Base | null = null;
  private boss: Boss | null = null;

  private survivalWaveIndex = 0;
  private paladog!: Paladog;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;

  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private allyUnits!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private summonKeys!: Record<AllyUnitType, Phaser.Input.Keyboard.Key>;

  private prevPhase: BossPhase | null = null;

  private backdrop!: Backdrop;
  private cameraViewWidth = GAME_WIDTH;

  private motion!: UnitMotion;

  private auraGraphics!: Phaser.GameObjects.Graphics;

  private auraEllipseDrawn: AuraEllipse | null = null;

  private fx!: BattleFx;

  private audio!: GameAudio;
  private experience = readExperience(browserStorage());
  private elapsedMs = 0;
  private prevElapsedMs = 0;
  private battleOver = false;
  private progressSaved = true;
  private defeatedEnemies = 0;
  private paused = false;
  private novaCooldown = 0;
  private ui!: BattleInterface;
  private controls!: BattleControls;
  private unitDetails!: Phaser.GameObjects.Graphics;
  private moveKeys!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private pendingSummons = new Set<AllyUnitType>();
  private hudElapsed = 0;
  private formationIndex = 0;
  private bossPulseRemaining = 0;
  private nextBossPulseAt = 10000;
  private nextSurvivalWaveAt = 0;

  private persisted!: PersistedState;

  private battleBaseStats!: Record<AllyUnitType, UnitStats>;
  private economy!: BattleEconomy;

  private equippedRing!: RingDefinition | null;

  private attackParams!: AttackParams;

  constructor() {
    super(SCENE.battle);
  }

  init(data: BattleSceneData): void {
    this.launch =
      data.mode === undefined ? { mode: IMPLICIT_BATTLE_MODE, stage: data.stage } : data;
    this.mode = this.launch.mode;

    this.stage = 'stage' in this.launch ? this.launch.stage : null;
    this.bossDefinition = 'bossDefinition' in this.launch ? this.launch.bossDefinition : null;

    this.elapsedMs = 0;
    this.experience = readExperience(browserStorage());
    this.prevElapsedMs = 0;
    this.battleOver = false;
    this.progressSaved = true;
    this.defeatedEnemies = 0;
    this.paused = false;
    this.novaCooldown = 0;
    this.pendingSummons.clear();
    this.hudElapsed = 0;
    this.formationIndex = 0;
    this.bossPulseRemaining = 0;
    this.nextBossPulseAt = 10000;
    this.nextSurvivalWaveAt = 0;
    this.survivalWaveIndex = 0;
    this.enemyBase = null;
    this.boss = null;
    this.prevPhase = null;

    this.persisted = loadState(browserStorage());

    this.equippedRing =
      this.persisted.equippedRing === null ? null : ringDefinition(this.persisted.equippedRing);
    this.attackParams = effectiveAttackParams(
      { attackCost: ATTACK_COST, projectileDamage: PROJECTILE_DAMAGE },
      this.equippedRing,
      this.persisted.equippedRing === null
        ? 0
        : ringLevel(this.persisted, this.persisted.equippedRing),
    );

    this.attackState = {
      cooldownRemainingMs: 0,
      cooldownMs: ATTACK_COOLDOWN_MS,
      mana: MANA_MAX,
      manaMax: MANA_MAX,
      manaRegenPerSec: MANA_REGEN_PER_SEC,
      attackCost: this.attackParams.attackCost,
    };

    this.battleBaseStats = {} as Record<AllyUnitType, UnitStats>;

    for (const type of ALLY_UNIT_TYPES) {
      this.battleBaseStats[type] = statsAtLevel(
        unitDefinition(type),
        upgradeLevel(this.persisted, type),
      );
    }

    this.economy = initialBattleEconomy(BATTLE_START_GOLD, POPULATION_LIMIT);
  }

  create(): void {
    this.cameraViewWidth = GAME_WIDTH;
    this.fx = new BattleFx(this, this.experience.effects === 'light');
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.fx.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT).setScroll(0, 0);

    this.audio = gameAudio(this.game);

    this.audio.playBgm(SOUND.bgmBattle);

    this.audio.attach(this);

    this.backdrop = new Backdrop(
      this,
      'battle',
      this.stage?.order ?? (this.bossDefinition ? 3 : 2),
    );
    this.fx.toWorld(...this.backdrop.gameObjects());

    this.motion = new UnitMotion(this);

    this.drawGround();
    this.ensureAllyTextures();
    this.ensureEnemyTextures();

    this.auraGraphics = this.add.graphics();
    this.auraGraphics.setDepth(AURA_DEPTH);
    this.fx.toWorld(this.auraGraphics);

    this.allyBase = new Base(this, ALLY_BASE_X, LANE_Y, TEXTURE.allyBase, this.allyBaseHitPoints());
    this.allyBase.setDepth(SPRITE_DEPTH);
    this.fx.toWorld(this.allyBase);

    if (this.stage !== null) {
      this.enemyBase = new Base(
        this,
        ENEMY_BASE_X,
        LANE_Y,
        TEXTURE.enemyBase,
        this.stage.enemyBaseHp,
      );
      this.enemyBase.shielded = true;
      this.enemyBase.setDepth(SPRITE_DEPTH);
      this.fx.toWorld(this.enemyBase);
    }

    if (this.bossDefinition !== null) {
      this.ensureBossTexture(this.bossDefinition);
      const difficulty = DIFFICULTIES[this.experience.difficulty];
      this.boss = new Boss(this, ENEMY_SPAWN_X, LANE_Y, {
        ...this.bossDefinition,
        maxHp: Math.round(this.bossDefinition.maxHp * difficulty.hp),
        phases: this.bossDefinition.phases.map((phase) => ({
          ...phase,
          stats: {
            ...phase.stats,
            attackDamage: Math.round(phase.stats.attackDamage * difficulty.damage),
          },
        })),
      });
      this.boss.setDepth(SPRITE_DEPTH);
      this.fx.toWorld(this.boss);

      this.boss.startAdvance();
    }

    this.paladog = new Paladog(this, 260, LANE_Y);
    this.paladog.configure(
      heroProgress(this.persisted).armor,
      heroProgress(this.persisted).auraLevel,
    );
    applyGrowthAppearance(this.paladog, heroProgress(this.persisted).auraLevel);
    const equippedWeapon = WEAPONS[heroProgress(this.persisted).weapon];
    this.attackState = {
      ...this.attackState,
      attackCost: Math.round(this.attackState.attackCost * equippedWeapon.mana),
      cooldownMs: equippedWeapon.cooldown,
      manaRegenPerSec: this.attackState.manaRegenPerSec + this.aura.mana,
    };
    this.paladog.setDepth(SPRITE_DEPTH);
    this.fx.toWorld(this.paladog);

    const worldGroup = {
      createCallback: (child: Phaser.GameObjects.GameObject) => this.fx.toWorld(child),
    };

    this.enemies = this.physics.add.group(worldGroup);
    this.projectiles = this.physics.add.group(worldGroup);
    this.enemyProjectiles = this.physics.add.group(worldGroup);
    this.allyUnits = this.physics.add.group(worldGroup);

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy);
    this.physics.add.overlap(this.enemies, this.allyBase, this.onEnemyReachedAllyBase);
    this.physics.add.overlap(this.allyUnits, this.enemies, this.onAllyMetEnemy);
    this.physics.add.overlap(this.enemies, this.paladog, (first, second) => {
      const enemy = participant(first, second, EnemyUnit);
      if (
        !this.battleOver &&
        enemy?.active &&
        enemy.x <= ENEMY_SPAWN_X &&
        this.paladog.getHealth().current > 0
      )
        enemy.engageUnit(this.paladog);
    });
    this.physics.add.overlap(this.enemyProjectiles, this.paladog, (first, second) => {
      const projectile = participant(first, second, Projectile);
      if (!this.battleOver && projectile?.active && this.paladog.getHealth().current > 0) {
        this.impactProjectile(projectile, this.paladog, true);
      }
    });

    this.physics.add.overlap(
      this.enemyProjectiles,
      this.allyUnits,
      this.onEnemyProjectileHitAllyUnit,
    );
    this.physics.add.overlap(
      this.enemyProjectiles,
      this.allyBase,
      this.onEnemyProjectileHitAllyBase,
    );

    if (this.enemyBase !== null) {
      this.physics.add.overlap(this.projectiles, this.enemyBase, this.onProjectileHitEnemyBase);
      this.physics.add.overlap(this.allyUnits, this.enemyBase, this.onAllyReachedEnemyBase);
    }

    if (this.boss !== null) {
      this.physics.add.overlap(this.projectiles, this.boss, this.onProjectileHitBoss);
      this.physics.add.overlap(this.boss, this.allyBase, this.onBossReachedAllyBase);
      this.physics.add.overlap(this.allyUnits, this.boss, this.onAllyMetBoss);
      this.physics.add.overlap(this.boss, this.paladog, () => {
        if (!this.battleOver && this.paladog.getHealth().current > 0)
          this.boss?.engageUnit(this.paladog);
      });
    }

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is unavailable; this game is keyboard-only (C-4).');
    }

    this.cursors = keyboard.createCursorKeys();
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.summonKeys = {} as Record<AllyUnitType, Phaser.Input.Keyboard.Key>;

    for (const type of ALLY_UNIT_TYPES) {
      this.summonKeys[type] = keyboard.addKey(SUMMON_KEYS[type]);
    }

    this.buildHud();
    this.unitDetails = this.add.graphics().setDepth(0.15);
    this.fx.toWorld(this.unitDetails);
    this.moveKeys = { a: keyboard.addKey('A'), d: keyboard.addKey('D') };
    keyboard.on('keydown-Q', () => this.castNova());
    keyboard.on('keydown-ESC', () => this.setPaused(!this.paused));
    const blur = () => {
      if (!this.battleOver) this.setPaused(true);
    };
    window.addEventListener('blur', blur);
    const hidden = () => {
      if (document.hidden) blur();
    };
    document.addEventListener('visibilitychange', hidden);
    this.events.once('shutdown', () => {
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
    });
    if (!this.registry.get('tutorialSeen')) {
      this.setPaused(true);
      this.ui.intro(
        translate('출정 준비'),
        translate(
          '동료를 소환하고 함께 전진하세요. 오라 안의 동료는 강해집니다. 각 ⓘ 버튼에서 자세한 조작과 효과를 확인할 수 있습니다.',
        ),
        '',
      );
      this.registry.set('tutorialSeen', true);
    }
    if (this.stage) {
      const story = CAMPAIGN_STORY[this.stage.id];
      this.setPaused(true);
      this.ui.intro(
        this.stage.displayName,
        story.intro + '\n\n' + story.reward,
        story.mission === 'hold'
          ? translate('{0}s · {1} 격퇴', [story.duration / 1000, story.requiredKills])
          : MISSION_NAMES[story.mission],
      );
    }
  }

  private ensureAllyTextures(): void {
    for (const type of ALLY_UNIT_TYPES) {
      const definition = unitDefinition(type);

      if (this.textures.exists(definition.textureKey)) {
        continue;
      }

      const graphics = this.add.graphics();

      graphics.fillStyle(definition.tintColor, 1);
      graphics.fillRect(0, 0, definition.width, definition.height);
      graphics.generateTexture(definition.textureKey, definition.width, definition.height);
      graphics.destroy();
    }
  }

  private ensureEnemyTextures(): void {
    for (const kind of ENEMY_KINDS) {
      const definition = enemyDefinition(kind);

      if (this.textures.exists(definition.textureKey)) {
        continue;
      }

      const graphics = this.add.graphics();

      graphics.fillStyle(definition.tintColor, 1);
      graphics.fillRect(0, 0, definition.width, definition.height);
      graphics.generateTexture(definition.textureKey, definition.width, definition.height);
      graphics.destroy();
    }
  }

  private allyBaseHitPoints(): number {
    if (this.stage !== null) {
      return this.stage.allyBaseHp;
    }

    return this.bossDefinition !== null ? ALLY_BASE_HP : SURVIVAL_CONFIG.allyBaseHp;
  }

  private ensureBossTexture(definition: BossDefinition): void {
    if (this.textures.exists(definition.textureKey)) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(definition.tintColor, 1);
    graphics.fillRect(0, 0, definition.width, definition.height);
    graphics.generateTexture(definition.textureKey, definition.width, definition.height);
    graphics.destroy();
  }

  override update(_time: number, delta: number): void {
    if (this.battleOver || this.paused) {
      return;
    }
    delta = Math.min(delta, 60);
    this.novaCooldown = Math.max(0, this.novaCooldown - delta);
    this.economy = { ...this.economy, gold: incomeAfter(this.economy.gold, delta) };

    this.prevElapsedMs = this.elapsedMs;
    this.elapsedMs += delta;

    this.spawnDueEnemies();
    if (this.enemyBase && this.stage) {
      const shield =
        CAMPAIGN_STORY[this.stage.id].mission !== 'siege' ||
        this.elapsedMs <= this.stage.waves[this.stage.waves.length - 1].spawnAtMs ||
        this.enemies.countActive(true) > 0;
      if (this.enemyBase.shielded && !shield)
        this.ui.toast(translate('보호막이 사라졌습니다! 적 요새를 파괴하세요.'), 'castle');
      this.enemyBase.shielded = shield;
    }
    this.attackState = tickCooldown(regenerateMana(this.attackState, delta), delta);
    this.economy = tickSummonCooldowns(this.economy, delta);
    const beforeMove = this.paladog.x;
    this.paladog.move(
      this.cursors.left.isDown || this.moveKeys.a.isDown || this.controls.left,
      this.cursors.right.isDown || this.moveKeys.d.isDown || this.controls.right,
      delta,
    );
    const desiredX = this.paladog.x;
    this.paladog.x = limitHeroAdvance(
      beforeMove,
      desiredX,
      (this.paladog.body as Phaser.Physics.Arcade.Body).halfWidth,
      [...this.enemies.getChildren(), ...(this.boss ? [this.boss] : [])]
        .filter((actor) => actor.active && (actor as EnemyUnit | Boss).getHealth().current > 0)
        .map((actor) => ({
          x: (actor as EnemyUnit | Boss).x,
          halfWidth: ((actor as EnemyUnit | Boss).body as Phaser.Physics.Arcade.Body).halfWidth,
        })),
    );
    this.motion.setGuarding(this.paladog, this.paladog.x < desiredX);

    for (const u of [...this.allyUnits.getChildren(), ...this.enemies.getChildren()] as (
      AllyUnit | EnemyUnit
    )[])
      u.tickStatus(delta);
    this.boss?.tickStatus(delta);
    this.refreshAura();
    this.refreshEnemyAura();
    this.tickSupport(delta);
    this.paladog.regenerate(delta);
    this.motion.advance(delta);
    if (this.paladog.getHealth().current <= 0) {
      this.refreshHud();
      this.checkOutcome();
      return;
    }
    this.handleAttackInput();
    this.handleSummonInput();
    this.cullSpentProjectiles();
    this.tickEnemies(delta);
    this.tickBoss(delta);
    this.tickBossPulse(delta);
    this.tickAllyUnits(delta);

    this.arrangeFormation();
    this.motion.update(this.motionTargets());
    const viewport = visibleViewport();
    const viewWidth = mobileViewport()
      ? mobileBattleLayout(viewport.width, viewport.height).visibleWorldWidth
      : GAME_WIDTH;
    const viewChanged = viewWidth !== this.cameraViewWidth;
    if (viewChanged) {
      this.cameraViewWidth = viewWidth;
      // The canvas may extend beyond a portrait viewport; follow its visible
      // portion without altering simulation bounds or actor coordinates.
      this.fx.world.setBounds(0, 0, WORLD_WIDTH + GAME_WIDTH - viewWidth, GAME_HEIGHT);
    }
    const desiredScroll = Phaser.Math.Clamp(
      this.paladog.x - this.cameraViewWidth * 0.38,
      0,
      WORLD_WIDTH - this.cameraViewWidth,
    );
    this.fx.world.scrollX = viewChanged
      ? desiredScroll
      : this.fx.world.scrollX +
        (desiredScroll - this.fx.world.scrollX) * (1 - Math.exp(-delta / 110));
    this.backdrop.updateScroll(this.fx.world.scrollX);
    this.drawUnitDetails();
    this.hudElapsed += delta;
    if (this.hudElapsed >= 80) {
      this.refreshHud();
      this.hudElapsed = 0;
    }
    this.checkOutcome();
  }

  private get aura() {
    return auraAt(heroProgress(this.persisted).auraLevel);
  }

  private refreshAura(): void {
    this.drawAura();

    const bannermanSources: AuraSource[] = [];

    for (const child of this.allyUnits.getChildren()) {
      const candidate = child as AllyUnit;

      if (candidate.active && candidate.unitType === 'bannerman') {
        bannermanSources.push({ x: candidate.x, radius: BANNERMAN_AURA_RADIUS });
      }
    }

    for (const child of this.allyUnits.getChildren()) {
      const unit = child as AllyUnit;

      if (!unit.active) {
        continue;
      }

      const insidePaladogAura = isWithinAura(this.paladog.x, unit.x, this.aura.radius);
      const insideBannerAura = isWithinAnyAura(bannermanSources, unit.x);
      const inside = insidePaladogAura || insideBannerAura;
      let buff = insidePaladogAura
        ? { attackDamageMultiplier: this.aura.attack, speedMultiplier: this.aura.speed }
        : BANNERMAN_AURA_BUFF;
      if (insideBannerAura) buff = strongestAuraBuff(buff, BANNERMAN_AURA_BUFF);

      unit.applyStats(
        effectiveStats(this.battleBaseStats[unit.unitType], buff, inside),
        insidePaladogAura ? this.aura.incoming : 1,
      );
      unit.setAuraHighlight(inside);
    }
  }

  private refreshEnemyAura(): void {
    const overseerSources: AuraSource[] = [];

    for (const child of this.enemies.getChildren()) {
      const candidate = child as EnemyUnit;

      if (candidate.active && candidate.enemyKind === 'overseer') {
        overseerSources.push({ x: candidate.x, radius: OVERSEER_AURA_RADIUS });
      }
    }

    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemyUnit;

      if (!enemy.active) {
        continue;
      }

      const inside = isWithinAnyAura(overseerSources, enemy.x);
      const base = enemy.baseStats;

      const weakened = isWithinAura(this.paladog.x, enemy.x, this.aura.radius);
      enemy.applyStats(
        effectiveStats(
          effectiveStats(base, OVERSEER_AURA_BUFF, inside),
          { attackDamageMultiplier: this.aura.enemyAttack, speedMultiplier: this.aura.enemySpeed },
          weakened,
        ),
        weakened ? this.aura.enemyIncoming : 1,
      );
      enemy.setData('auraWeakened', weakened);
    }
    if (this.boss) {
      const weakened = isWithinAura(this.paladog.x, this.boss.x, this.aura.radius);
      this.boss.setAuraWeakened(
        weakened,
        this.aura.enemyAttack,
        this.aura.enemySpeed,
        this.aura.enemyIncoming,
      );
      this.boss.setData('auraWeakened', weakened);
    }
  }

  private drawAura(): void {
    this.auraGraphics.clear();
    if (this.aura.radius <= 0) {
      this.auraEllipseDrawn = null;
      return;
    }
    const cx = this.paladog?.x ?? 0;
    const cy = AURA_CENTER_Y;
    const rx = this.aura.radius;
    const ry = rx * AURA_VERTICAL_RATIO;

    this.auraEllipseDrawn = { cx, cy, rx, ry };

    this.auraGraphics.clear();
    this.auraGraphics.lineStyle(2, this.aura.color, 0.65);
    this.auraGraphics.strokeEllipse(cx, cy, rx * 2, ry * 2, 128);
    this.auraGraphics.fillStyle(this.aura.color, AURA_FILL_ALPHA);
    this.auraGraphics.fillEllipse(cx, cy, rx * 2, ry * 2);
    const t = this.elapsedMs / 1000,
      level = this.experience.effects === 'light' ? 0 : heroProgress(this.persisted).auraLevel,
      g = this.auraGraphics;
    for (let ring = 0; ring < 2 + level; ring++) {
      const scale = 0.56 + ring * 0.09 + Math.sin(t * 1.8 - ring) * 0.025;
      g.lineStyle(1 + level * 0.25, this.aura.color, 0.14 + ring * 0.04);
      g.strokeEllipse(cx, cy, rx * 2 * scale, ry * 2 * scale, 96);
      g.lineStyle(2, this.aura.color, 0.55);
      g.beginPath();
      for (let j = 0; j <= 20; j++) {
        const a = t * (ring % 2 ? -0.35 : 0.45) + ring * 2 + j * 0.065,
          x = cx + Math.cos(a) * rx * scale,
          y = cy + Math.sin(a) * ry * scale;
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
    for (let i = 0; i < 12 + level * 4; i++) {
      const a = i * 2.399 + t * 0.18,
        x = cx + Math.cos(a) * rx * 0.88,
        y = cy + Math.sin(a) * ry * 0.88;
      const rise = (t * 0.35 + i * 0.13) % 1;
      g.fillStyle(this.aura.color, (1 - rise) * 0.55);
      g.fillCircle(x, y - rise * (15 + level * 8), 1.2 + level * 0.25);
      if (i % 3 === 0) {
        g.lineStyle(1, this.aura.color, 0.45);
        g.strokeTriangle(x, y - 4, x - 3, y + 2, x + 3, y + 2);
      }
    }
  }

  auraEllipse(): AuraEllipse | null {
    return this.auraEllipseDrawn === null ? null : { ...this.auraEllipseDrawn };
  }

  private handleSummonInput(): void {
    for (const type of ALLY_UNIT_TYPES) {
      if (
        !Phaser.Input.Keyboard.JustDown(this.summonKeys[type]) &&
        !this.pendingSummons.has(type)
      ) {
        continue;
      }

      this.pendingSummons.delete(type);
      const definition = unitDefinition(type);

      if (!canSummon(this.economy, definition, this.persisted.unlocked)) {
        continue;
      }

      const unit = new AllyUnit(
        this,
        ALLY_SPAWN_X,
        LANE_Y,
        type,
        this.battleBaseStats[type],
        definition.textureKey,
        definition.attackRange,
        definition.damageReductionPercent,
      );

      applyGrowthAppearance(unit, upgradeLevel(this.persisted, type));
      const lane = this.formationIndex++ % 3;
      unit.setData('formationLane', lane);
      const laneOffset = [-13, 2, 17][lane];
      unit.setData('laneOffset', laneOffset);
      unit.setDepth(SPRITE_DEPTH + (laneOffset + 10) * 0.01);

      this.allyUnits.add(unit);
      unit.startAdvance();

      this.economy = applySummon(this.economy, definition);

      this.audio.playSfx(SOUND.summon);
    }
  }

  private tickAllyUnits(deltaMs: number): void {
    for (const child of [...this.allyUnits.getChildren()]) {
      const unit = child as AllyUnit;

      if (!unit.active) {
        continue;
      }

      unit.refreshTarget();
      if (unit.currentTarget() instanceof Base && this.enemyBase?.shielded) unit.startAdvance();
      if (unit.x > ENEMY_BASE_X - 35) {
        unit.x = ENEMY_BASE_X - 35;
        unit.setVelocityX(0);
      }

      if (unit.attackRange > 0 && unit.currentTarget() === null) {
        this.engageRangedAllyTarget(unit);
      }

      this.motion.setGuarding(unit, unit.currentTarget() !== null);
      const damage = unit.tick(deltaMs);
      const target = unit.currentTarget();

      if (damage > 0 && target !== null && !(target instanceof Base && target.shielded)) {
        const targetX = target instanceof Phaser.Physics.Arcade.Sprite ? target.x : ENEMY_BASE_X;
        this.motion.attack(unit, targetX, () => {
          if (!this.validStrike(unit, target, unit.attackRange)) return;
          if (unit.attackRange > 0) this.fireAllyProjectile(unit, damage);
          else this.applyStrikeDamage(target, damage);
        });
      }

      if (unit.getHealth().current <= 0) {
        this.economy = releasePopulationSlot(this.economy);
        this.fx.death(unit);

        this.audio.playSfx(SOUND.death);
        unit.destroy();
      }
    }
  }

  private engageRangedAllyTarget(unit: AllyUnit): void {
    const enemyXs: number[] = [];
    const enemiesByX = new Map<number, EnemyUnit>();

    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemyUnit;

      if (enemy.active) {
        enemyXs.push(enemy.x);

        if (!enemiesByX.has(enemy.x)) {
          enemiesByX.set(enemy.x, enemy);
        }
      }
    }

    const nearestX = nearestCandidateWithinRange(unit.x, enemyXs, unit.attackRange);
    const nearestEnemy = nearestX === null ? undefined : enemiesByX.get(nearestX);

    if (nearestEnemy !== undefined) {
      unit.engage(nearestEnemy);
      return;
    }

    if (
      this.enemyBase !== null &&
      !this.enemyBase.shielded &&
      isWithinRange(unit.x, ENEMY_BASE_X, unit.attackRange)
    ) {
      unit.engage(this.enemyBase);
    }
  }

  private fireAllyProjectile(unit: AllyUnit, damage: number): void {
    const effect: ShotEffect =
      unit.unitType === 'mage'
        ? 'fire'
        : unit.unitType === 'lancer'
          ? 'spear'
          : unit.unitType === 'cleric'
            ? 'heal'
            : 'arrow';
    const target = unit.currentTarget();
    const projectile = new Projectile(this, unit.x, LANE_Y, {
      speed: PROJECTILE_SPEED,
      damage,
      direction: target instanceof Phaser.Physics.Arcade.Sprite && target.x < unit.x ? -1 : 1,
      textureKey: `shot-${effect}`,
      effect,
    });

    projectile.setDepth(SPRITE_DEPTH);
    this.projectiles.add(projectile);
    projectile.launch();
  }

  private handleAttackInput(): void {
    if (!this.fireKey.isDown && !this.controls.fire) {
      return;
    }

    if (!canAttack(this.attackState)) {
      return;
    }

    const closest = (
      [...this.enemies.getChildren(), ...(this.boss ? [this.boss] : [])] as (EnemyUnit | Boss)[]
    )
      .filter((e) => e.active)
      .sort((a, b) => Math.abs(a.x - this.paladog.x) - Math.abs(b.x - this.paladog.x))[0];
    const direction =
      closest && closest.x < this.paladog.x && Math.abs(closest.x - this.paladog.x) < 450 ? -1 : 1;
    this.paladog.setFlipX(direction < 0);
    const weapon = WEAPONS[heroProgress(this.persisted).weapon];
    this.motion.attack(this.paladog, this.paladog.x + direction * 100, () => {
      const projectile = new Projectile(this, this.paladog.x, LANE_Y, {
        speed: PROJECTILE_SPEED,
        damage: Math.round(
          this.attackParams.projectileDamage *
            weapon.damage *
            heroStats(heroProgress(this.persisted).auraLevel).attackMultiplier,
        ),

        direction,
        textureKey: weapon.effect === 'plain' ? TEXTURE.projectile : `shot-${weapon.effect}`,
        effect: weapon.effect,
      });

      projectile.setDepth(SPRITE_DEPTH);

      this.projectiles.add(projectile);
      projectile.launch();
      this.audio.playSfx(SOUND.cast);
    });

    this.attackState = consumeAttackCost(this.attackState);
  }

  private spawnDueEnemies(): void {
    if (this.stage !== null) {
      for (const entry of dueSpawns(this.stage.waves, this.prevElapsedMs, this.elapsedMs)) {
        this.spawnGroup(entry);
      }

      return;
    }

    if (this.bossDefinition !== null) {
      return;
    }

    // Prevent an off-screen backlog of hundreds of enemies. The wave number
    // advances only when its enemies actually enter the battlefield.
    if (this.elapsedMs < this.nextSurvivalWaveAt || this.enemies.countActive(true) > 66) return;
    this.survivalWaveIndex++;
    this.nextSurvivalWaveAt = this.elapsedMs + SURVIVAL_CONFIG.waveIntervalMs;
    this.ui.toast(
      translate('WAVE {0} · 적의 증원이 도착합니다', [this.survivalWaveIndex]),
      'flag',
      this.survivalWaveIndex,
    );
    for (const group of survivalWave(this.survivalWaveIndex, SURVIVAL_CONFIG))
      this.spawnGroup(group);
  }

  private spawnGroup(group: SurvivalSpawn): void {
    const original = enemyDefinition(group.enemyKind);
    const scaled =
      this.survivalWaveIndex > 0
        ? { ...original, baseStats: survivalStats(original.baseStats, this.survivalWaveIndex) }
        : original;
    const difficulty = DIFFICULTIES[this.experience.difficulty];
    const definition = {
      ...scaled,
      baseStats: {
        ...scaled.baseStats,
        maxHp: Math.round(scaled.baseStats.maxHp * difficulty.hp),
        attackDamage: Math.round(scaled.baseStats.attackDamage * difficulty.damage),
      },
    };

    for (let index = 0; index < group.count; index += 1) {
      const enemy = new EnemyUnit(this, ENEMY_SPAWN_X + index * 24, LANE_Y, definition);
      const lane = this.formationIndex++ % 3;
      enemy.setData('formationLane', lane);
      const laneOffset = [-13, 2, 17][lane];
      enemy.setData('laneOffset', laneOffset);
      enemy.setDepth(SPRITE_DEPTH + (laneOffset + 11) * 0.01);

      this.enemies.add(enemy);
      enemy.startAdvance();
    }
  }

  private tickBoss(deltaMs: number): void {
    const boss = this.boss;

    if (boss === null || !boss.active) {
      return;
    }

    boss.refreshTarget();

    this.motion.setGuarding(boss, boss.currentUnitTarget() !== null || this.bossPulseRemaining > 0);
    const damage = boss.tick(deltaMs);
    if (damage > 0) {
      const target = boss.currentUnitTarget() ?? this.allyBase;
      this.motion.attack(
        boss,
        target instanceof Phaser.Physics.Arcade.Sprite ? target.x : ALLY_BASE_X,
        () => {
          if (this.validStrike(boss, target)) this.applyStrikeDamage(target, damage);
        },
      );
    }
  }

  private tickEnemies(deltaMs: number): void {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemyUnit;

      if (!enemy.active) {
        continue;
      }

      // Reinforcements enter the gate staging line before acquiring targets.
      if (enemy.x > ENEMY_SPAWN_X) {
        enemy.startAdvance();
        continue;
      }
      enemy.refreshTarget();

      if (enemy.attackRange > 0 && !enemy.isEngaged()) {
        this.engageRangedEnemyTarget(enemy);
      }

      this.motion.setGuarding(enemy, enemy.isEngaged());
      const damage = enemy.tick(deltaMs);

      if (damage > 0) {
        const target = enemy.currentUnitTarget() ?? this.allyBase;
        this.motion.attack(
          enemy,
          target instanceof Phaser.Physics.Arcade.Sprite ? target.x : ALLY_BASE_X,
          () => {
            if (!this.validStrike(enemy, target, enemy.attackRange)) return;
            if (enemy.attackRange > 0) this.fireEnemyProjectile(enemy, damage);
            else this.applyStrikeDamage(target, damage);
          },
        );
      }
    }
  }

  private validStrike(
    attacker: Phaser.Physics.Arcade.Sprite,
    target: EngagedTarget,
    range = 0,
  ): boolean {
    if (!attacker.active || !target.active || this.battleOver) return false;
    if (target instanceof Base && target.shielded) return false;
    if (
      target instanceof Base ||
      target instanceof Boss ||
      target instanceof EnemyUnit ||
      target instanceof AllyUnit ||
      target instanceof Paladog
    ) {
      if (target.getHealth().current <= 0) return false;
      const reach =
        range > 0
          ? range + 20
          : (attacker.body as Phaser.Physics.Arcade.Body).halfWidth +
            (target.body as Phaser.Physics.Arcade.Body).halfWidth +
            24;
      return Math.abs(attacker.x - target.x) <= reach;
    }
    return false;
  }

  private applyStrikeDamage(target: EngagedTarget, damage: number): void {
    const result = target.takeDamage(damage);
    this.hitFx(target, damage);
    if (result.dead && target instanceof EnemyUnit) {
      this.defeatedEnemies++;
      this.economy = awardBounty(this.economy, ENEMY_BOUNTY);
      this.fx.death(target);
      this.audio.playSfx(SOUND.death);
      target.destroy();
    }
  }

  private engageRangedEnemyTarget(enemy: EnemyUnit): void {
    const allyXs: number[] = [];
    const alliesByX = new Map<number, AllyUnit | Paladog>();

    for (const child of this.allyUnits.getChildren()) {
      const ally = child as AllyUnit;

      if (ally.active) {
        allyXs.push(ally.x);

        if (!alliesByX.has(ally.x)) {
          alliesByX.set(ally.x, ally);
        }
      }
    }

    if (this.paladog.getHealth().current > 0) {
      allyXs.push(this.paladog.x);
      if (!alliesByX.has(this.paladog.x)) alliesByX.set(this.paladog.x, this.paladog);
    }
    const nearestX = nearestCandidateWithinRange(enemy.x, allyXs, enemy.attackRange);
    const nearestAlly = nearestX === null ? undefined : alliesByX.get(nearestX);

    if (nearestAlly !== undefined) {
      enemy.engageUnit(nearestAlly);
      return;
    }

    if (isWithinRange(enemy.x, ALLY_BASE_X, enemy.attackRange)) {
      enemy.engage();
    }
  }

  private fireEnemyProjectile(enemy: EnemyUnit, damage: number): void {
    const effect: ShotEffect =
      enemy.enemyKind === 'bomber' ? 'bomb' : enemy.enemyKind === 'wraith' ? 'frost' : 'arrow';
    const target = enemy.currentUnitTarget();
    const projectile = new Projectile(this, enemy.x, LANE_Y, {
      speed: PROJECTILE_SPEED,
      damage,
      direction: target instanceof Phaser.Physics.Arcade.Sprite && target.x > enemy.x ? 1 : -1,
      textureKey: `shot-${effect}`,
      effect,
    });

    projectile.setDepth(SPRITE_DEPTH);
    this.enemyProjectiles.add(projectile);
    projectile.launch();
  }

  private cullSpentProjectiles(): void {
    this.cullProjectileGroup(this.projectiles);

    this.cullProjectileGroup(this.enemyProjectiles);
  }

  private cullProjectileGroup(group: Phaser.Physics.Arcade.Group): void {
    for (const child of [...group.getChildren()]) {
      const projectile = child as Projectile;

      if (projectile.active && projectile.hasLeftLane()) {
        projectile.destroy();
      }
    }
  }

  private readonly onProjectileHitEnemy = (first: PhysicsObject, second: PhysicsObject): void => {
    if (this.battleOver) {
      return;
    }

    const projectile = participant(first, second, Projectile);
    const enemy = participant(first, second, EnemyUnit);

    if (!projectile?.active || !enemy?.active) {
      return;
    }

    this.impactProjectile(projectile, enemy, false);
  };

  private readonly onAllyMetEnemy = (first: PhysicsObject, second: PhysicsObject): void => {
    const ally = participant(first, second, AllyUnit);
    const enemy = participant(first, second, EnemyUnit);

    if (!ally?.active || !enemy?.active) {
      return;
    }

    ally.engage(enemy);
    enemy.engageUnit(ally);
  };

  private readonly onAllyReachedEnemyBase = (first: PhysicsObject, second: PhysicsObject): void => {
    const ally = participant(first, second, AllyUnit);

    const enemyBase = this.enemyBase;

    if (ally?.active && enemyBase !== null) {
      ally.engage(enemyBase);
    }
  };

  private readonly onProjectileHitEnemyBase = (
    first: PhysicsObject,
    second: PhysicsObject,
  ): void => {
    if (this.battleOver) {
      return;
    }

    const projectile = participant(first, second, Projectile);
    const enemyBase = this.enemyBase;

    if (!projectile?.active || enemyBase === null) {
      return;
    }

    if (enemyBase.shielded) {
      projectile.destroy();
      return;
    }
    this.impactProjectile(projectile, enemyBase, false);
  };

  private readonly onEnemyReachedAllyBase = (first: PhysicsObject, second: PhysicsObject): void => {
    const enemy = participant(first, second, EnemyUnit);

    if (enemy?.active) {
      enemy.engage();
    }
  };

  private readonly onEnemyProjectileHitAllyUnit = (
    first: PhysicsObject,
    second: PhysicsObject,
  ): void => {
    if (this.battleOver) {
      return;
    }

    const projectile = participant(first, second, Projectile);
    const ally = participant(first, second, AllyUnit);

    if (!projectile?.active || !ally?.active) {
      return;
    }

    this.impactProjectile(projectile, ally, true);
  };

  private readonly onEnemyProjectileHitAllyBase = (
    first: PhysicsObject,
    second: PhysicsObject,
  ): void => {
    if (this.battleOver) {
      return;
    }

    const projectile = participant(first, second, Projectile);

    if (!projectile?.active) {
      return;
    }

    this.impactProjectile(projectile, this.allyBase, true);
  };

  private readonly onProjectileHitBoss = (first: PhysicsObject, second: PhysicsObject): void => {
    if (this.battleOver) {
      return;
    }

    const projectile = participant(first, second, Projectile);
    const boss = participant(first, second, Boss);

    if (!projectile?.active || !boss?.active) {
      return;
    }

    this.impactProjectile(projectile, boss, false);
  };

  private readonly onBossReachedAllyBase = (first: PhysicsObject, second: PhysicsObject): void => {
    const boss = participant(first, second, Boss);

    if (boss?.active) {
      boss.engage();
    }
  };

  private readonly onAllyMetBoss = (first: PhysicsObject, second: PhysicsObject): void => {
    const ally = participant(first, second, AllyUnit);
    const boss = participant(first, second, Boss);

    if (!ally?.active || !boss?.active) {
      return;
    }

    ally.engage(boss);
    boss.engageUnit(ally);
  };

  private checkOutcome(): void {
    const target = this.boss?.getHealth() ?? this.enemyBase?.getHealth() ?? null;
    let outcome = resolveModeOutcome(
      this.mode,
      this.allyBase.getHealth(),
      target,
      this.paladog.getHealth(),
    );

    if (this.stage && outcome !== 'defeat') {
      const story = CAMPAIGN_STORY[this.stage.id];
      if (story.mission === 'hold')
        outcome =
          this.elapsedMs >= story.duration && this.defeatedEnemies >= story.requiredKills
            ? 'victory'
            : 'ongoing';
      if (story.mission === 'hunt')
        outcome =
          this.elapsedMs > this.stage.waves[this.stage.waves.length - 1].spawnAtMs &&
          this.enemies.countActive(true) === 0
            ? 'victory'
            : 'ongoing';
    }
    if (outcome === 'ongoing') {
      return;
    }

    this.battleOver = true;

    const settlement = this.settleBattle(outcome);

    const payload = {
      outcome,

      launch: this.launch,
      stage: this.stage,
      settlement,
      saved: this.progressSaved,
      elapsedMs: this.elapsedMs,
      difficulty: DIFFICULTIES[this.experience.difficulty].name,
      defeatReason:
        this.paladog.getHealth().current <= 0
          ? translate('루미가 쓰러졌습니다. 동료 뒤로 물러나 체력을 회복하세요.')
          : translate('성역이 무너졌습니다. 적이 성역에 도달하기 전에 전선을 세우세요.'),
      survival: this.survivalResult(),
    };

    this.audio.playSfx(outcome === 'victory' ? SOUND.victory : SOUND.defeat);

    this.fx.finish(outcome, () => {
      this.scene.start(SCENE.result, payload);
    });
  }

  private survivalResult(): { record: number; best: number } | null {
    if (this.stage !== null || this.bossDefinition !== null) {
      return null;
    }

    return { record: this.survivalWaveIndex, best: this.persisted.survivalBestWave };
  }

  private settleBattle(outcome: BattleOutcome): number {
    const baseSettlement =
      computeSettlement(this.economy, outcome) +
      (outcome === 'victory' && this.stage ? Math.floor((this.stage.order - 1) / 3) * 40 : 0);
    const settlement = Math.round(
      baseSettlement *
        (outcome === 'victory' ? DIFFICULTIES[this.experience.difficulty].reward : 1),
    );
    const storage = browserStorage();
    const paid: PersistedState = {
      ...this.persisted,
      settlementGold: this.persisted.settlementGold + settlement,
    };

    this.persisted = this.recordResult(paid, outcome);
    if (outcome === 'victory' && this.stage) {
      const gift: AllyUnitType | undefined = (
        { 'stage-3': 'cleric', 'stage-4': 'mage', 'stage-6': 'lancer' } as Partial<
          Record<string, AllyUnitType>
        >
      )[this.stage.id];
      if (gift && !this.persisted.unlocked.includes(gift))
        this.persisted = { ...this.persisted, unlocked: [...this.persisted.unlocked, gift] };
    }

    this.progressSaved = saveState(storage, this.persisted);

    return settlement;
  }

  private readonly recorders: Readonly<
    Record<GameMode, (state: PersistedState, outcome: BattleOutcome) => PersistedState>
  > = {
    campaign: (state, outcome) =>
      this.stage === null ? state : recordStageResult(state, this.stage.id, outcome),
    survival: (state) => recordSurvivalRun(state, this.survivalWaveIndex),
    boss: (state, outcome) =>
      this.bossDefinition === null
        ? state
        : recordBossResult(state, this.bossDefinition.id, outcome),
  };

  private recordResult(state: PersistedState, outcome: BattleOutcome): PersistedState {
    return this.recorders[this.mode](state, outcome);
  }

  private hitFx(target: EngagedTarget, damage: number): void {
    this.audio.playSfx(SOUND.hit);

    if (target instanceof EnemyUnit) {
      this.motion.hurt(
        target,
        enemyDefinition(target.enemyKind).damageReductionPercent > 0 &&
          damage < target.getHealth().max * 0.15,
      );
      this.fx.hit(target, 'enemy', target.receivedDamage(damage));
    } else if (target instanceof AllyUnit) {
      this.motion.hurt(
        target,
        unitDefinition(target.unitType).damageReductionPercent > 0 &&
          damage < target.getHealth().max * 0.15,
      );
      this.fx.hit(target, 'ally', target.receivedDamage(damage));
    } else if (target instanceof Boss) {
      this.motion.hurt(target);
      this.fx.hit(target, 'boss', target.receivedDamage(damage));
    } else if (target instanceof Paladog) {
      this.motion.hurt(target);
      this.fx.hit(target, 'ally', target.receivedDamage(damage));
    } else if (target instanceof Base) {
      this.fx.hit(target, 'base', damage);

      this.fx.baseHit();
    }
  }

  private motionTargets(): Phaser.Physics.Arcade.Sprite[] {
    const units: Phaser.Physics.Arcade.Sprite[] = [this.paladog];

    for (const group of [this.allyUnits, this.enemies]) {
      for (const child of group.getChildren()) {
        const unit = child as Phaser.Physics.Arcade.Sprite;

        if (unit.active) {
          units.push(unit);
        }
      }
    }

    if (this.boss !== null && this.boss.active) {
      units.push(this.boss);
    }

    return units;
  }

  private drawGround(): void {
    const ground = this.add.graphics();

    ground.setName('ground');
    ground.setDepth(GROUND_DEPTH);

    ground.fillStyle(this.backdrop.groundColor(), 1);
    if (!this.textures.exists('forest-battle')) ground.fillRect(0, LANE_Y + 30, WORLD_WIDTH, 220);
    this.fx.toWorld(ground);
  }

  private buildHud(): void {
    this.controls = {
      left: false,
      right: false,
      fire: false,
      summon: (type) => {
        if (this.paused || this.battleOver) return;
        const definition = unitDefinition(type);
        if (!canSummon(this.economy, definition, this.persisted.unlocked)) {
          this.ui.toast(
            !isUnlocked(this.persisted, type)
              ? translate('기사단 정비에서 이 동료를 해금하세요.')
              : this.economy.liveUnitCount >= this.economy.populationLimit
                ? translate('동료가 가득 찼습니다.')
                : this.economy.gold < definition.summonCost
                  ? translate('골드가 부족합니다. 매초 3 골드가 회복됩니다.')
                  : translate('소환을 준비 중입니다.'),
            !isUnlocked(this.persisted, type)
              ? 'lock'
              : this.economy.liveUnitCount >= this.economy.populationLimit
                ? 'party'
                : this.economy.gold < definition.summonCost
                  ? 'coin'
                  : 'clock',
          );
          return;
        }
        this.pendingSummons.add(type);
      },
      nova: () => this.castNova(),
      pause: () => this.setPaused(true),
      resume: () => this.setPaused(false),
      retreat: () => this.scene.start(SCENE.mainMenu),
      mute: () => {
        this.audio.toggleMuted();
        this.refreshHud();
      },
    };
    this.ui = new BattleInterface(this, this.controls, {
      hero: heroProgress(this.persisted).auraLevel,
      units: this.persisted.upgradeLevels,
    });
    this.refreshHud();
  }

  private refreshHud(): void {
    const phase = this.boss?.activePhase();
    if (phase && this.prevPhase && phase !== this.prevPhase) {
      this.fx.phaseFlash();
      this.ui.toast(translate('무덤지기가 새로운 힘을 깨웁니다!'));
    }
    if (phase) this.prevPhase = phase;
    const due = this.stage?.waves.filter((w) => w.spawnAtMs > this.elapsedMs)[0];
    const title = this.stage
      ? this.stage.displayName
      : this.boss
        ? translate('무덤지기의 왕좌')
        : translate('끝없는 파도');
    let status = this.stage
      ? due
        ? translate('다음 증원 {0}초', [Math.ceil((due.spawnAtMs - this.elapsedMs) / 1000)])
        : this.enemies.countActive(true) > 0
          ? translate('남은 적 {0}명 · 요새 보호막', [this.enemies.countActive(true)])
          : translate('적 요새를 파괴하세요')
      : phase
        ? `${Math.ceil((this.boss!.getHealth().current / this.boss!.getHealth().max) * 100)}% · ${phase.displayName.split('  ').pop()}`
        : `WAVE ${this.survivalWaveIndex}`;
    const hero = heroProgress(this.persisted),
      aura = this.aura,
      armor = ARMORS[hero.armor],
      story = this.stage ? CAMPAIGN_STORY[this.stage.id] : null;
    if (story?.mission === 'hold')
      status = translate('수호 {0}초 · 격퇴 {1}/{2}', [
        Math.max(0, Math.ceil((story.duration - this.elapsedMs) / 1000)),
        Math.min(this.defeatedEnemies, story.requiredKills),
        story.requiredKills,
      ]);
    if (story?.mission === 'hunt')
      status = translate('군단 섬멸 · 남은 적 {0} · {1}', [
        this.enemies.countActive(true),
        due ? translate('증원 예정') : translate('마지막 증원 도착'),
      ]);
    this.ui.render({
      ally: this.allyBase.getHealth(),
      hero: this.paladog.getHealth(),
      target:
        story?.mission === 'hold'
          ? {
              current: Math.max(0, Math.ceil((story.duration - this.elapsedMs) / 1000)),
              max: story.duration / 1000,
            }
          : (this.boss?.getHealth() ?? this.enemyBase?.getHealth() ?? null),
      title: title + ' · ' + DIFFICULTIES[this.experience.difficulty].name,
      auraDescription: translate(
        '오라 {0} · 범위 {1} · 아군 공격 +{2}% / 속도 +{3}% / 피해 −{4}%\n적 공격 −{5}% / 속도 −{6}% / 피해 +{7}%{8}',
        [
          aura.name,
          aura.radius,
          Math.round((aura.attack - 1) * 100),
          Math.round((aura.speed - 1) * 100),
          Math.round((1 - aura.incoming) * 100),
          Math.round((1 - aura.enemyAttack) * 100),
          Math.round((1 - aura.enemySpeed) * 100),
          Math.round((aura.enemyIncoming - 1) * 100),
          aura.heal ? translate(' · 동료 회복 {0}/s', [aura.heal]) : '',
        ],
      ),
      auraLabel: translate('오라 {0} · 동료와 함께 전진', [aura.name]),
      weaponCost: this.attackState.attackCost,
      weaponName: WEAPONS[hero.weapon].name,
      weaponId: hero.weapon,
      armorDescription:
        translate('{0} · {1}초 후 +{2} HP/s · HP 0이면 패배', [
          armor.name,
          armor.delay / 1000,
          armor.regen,
        ]) +
        '\n' +
        translate('루미는 적 전열을 통과할 수 없습니다. 동료와 함께 돌파하거나 뒤로 물러나세요.'),
      objective: {
        kind: story?.mission ?? (this.boss ? 'boss' : 'survival'),
        value:
          story?.mission === 'hold'
            ? Math.min(this.defeatedEnemies, story.requiredKills)
            : this.stage
              ? this.defeatedEnemies
              : this.survivalWaveIndex,
        max:
          story?.mission === 'hold'
            ? story.requiredKills
            : this.stage
              ? this.stage.waves.reduce((n, w) => n + w.count, 0)
              : 1,
        secondary:
          story?.mission === 'hold'
            ? Math.max(0, Math.ceil((story.duration - this.elapsedMs) / 1000))
            : 0,
      },
      missionLabel: story
        ? MISSION_NAMES[story.mission]
        : this.boss
          ? translate('무덤지기')
          : translate('끝없는 웨이브'),
      phase: status,
      gold: this.economy.gold,
      mana: this.attackState.mana,
      manaMax: this.attackState.manaMax,
      population: this.economy.liveUnitCount,
      limit: this.economy.populationLimit,
      elapsed: this.elapsedMs,
      slots: this.summonSlots(),
      novaCooldown: this.novaCooldown,
      muted: this.audio.settings.muted,
      world: {
        width: WORLD_WIDTH,
        cameraX: this.fx.world.scrollX,
        viewport: this.cameraViewWidth,
        heroX: this.paladog.x,
        allyBaseX: ALLY_BASE_X,
        enemyBaseX: this.boss?.x ?? ENEMY_BASE_X,
        allies: (this.allyUnits.getChildren() as AllyUnit[])
          .filter((u) => u.active)
          .map((u) => u.x),
        enemies: (this.enemies.getChildren() as EnemyUnit[])
          .filter((u) => u.active)
          .map((u) => u.x),
      },
    });
  }

  private setPaused(value: boolean): void {
    if (this.battleOver || !this.ui) return;
    this.paused = value;
    this.pendingSummons.clear();
    this.ui.pause(value);
    if (value) {
      this.physics.world.pause();
      this.tweens.pauseAll();
    } else {
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.input.keyboard?.resetKeys();
      this.ui.get('paused').querySelector('h2')!.textContent = translate('일시정지');
      this.ui.get('paused').querySelector('p')!.innerHTML = '';
      this.ui.text('resume', translate('계속'));
    }
  }

  private castNova(): void {
    if (this.paused || this.battleOver || !canCastNova(this.attackState.mana, this.novaCooldown))
      return;
    this.attackState = { ...this.attackState, mana: this.attackState.mana - NOVA_COST };
    this.novaCooldown = NOVA_COOLDOWN_MS;
    this.motion.defend(this.paladog);
    const ring = this.add
      .ellipse(this.paladog.x, LANE_Y, 20, 12, 0xe9dcff, 0.5)
      .setStrokeStyle(4, 0xf1d48e)
      .setDepth(1);
    this.fx.toWorld(ring);
    this.tweens.add({
      targets: ring,
      displayWidth: NOVA_RADIUS * 2,
      displayHeight: 190,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
    this.audio.playSfx(SOUND.cast);
    const targets: (EnemyUnit | Boss)[] = [
      ...(this.enemies.getChildren() as EnemyUnit[]),
      ...(this.boss ? [this.boss] : []),
    ];
    for (const target of targets) {
      if (!target.active || !novaHits(this.paladog.x, target.x)) continue;
      if (target instanceof Boss && this.bossPulseRemaining > 0) {
        this.bossPulseRemaining = 0;
        this.motion.interrupt(target);
        this.nextBossPulseAt = this.elapsedMs + 9000;
        this.ui.toast(translate('무덤지기의 강타를 차단했습니다!'), 'nova');
      }
      const result = target.takeDamage(NOVA_DAMAGE);
      this.hitFx(target, NOVA_DAMAGE);
      if (target instanceof EnemyUnit) {
        if (result.dead) {
          this.defeatedEnemies++;
          this.economy = awardBounty(this.economy, ENEMY_BOUNTY);
          this.fx.death(target);
          target.destroy();
        } else target.x = Math.min(ENEMY_SPAWN_X, target.x + 65);
      }
    }
    this.ui.toast(translate('신성한 파동 · 강타 차단 / 주변 적에게 55 피해'), 'nova');
    this.refreshHud();
  }

  private tickBossPulse(delta: number): void {
    if (!this.boss || this.boss.getHealth().current <= 0) return;
    if (this.bossPulseRemaining > 0) {
      const before = this.bossPulseRemaining;
      this.bossPulseRemaining -= delta;
      if (before > 90 && this.bossPulseRemaining <= 90)
        this.motion.attack(this.boss, this.paladog.x);
      if (this.bossPulseRemaining <= 0) {
        if (Math.abs(this.paladog.x - this.boss.x) <= 190)
          this.applyStrikeDamage(
            this.paladog,
            this.boss.outgoingDamage(26 * DIFFICULTIES[this.experience.difficulty].damage),
          );
        for (const unit of this.allyUnits.getChildren() as AllyUnit[]) {
          if (unit.active && Math.abs(unit.x - this.boss.x) <= 190) {
            this.applyStrikeDamage(
              unit,
              this.boss.outgoingDamage(26 * DIFFICULTIES[this.experience.difficulty].damage),
            );
          }
        }
        this.fx.phaseFlash();
        this.nextBossPulseAt =
          this.elapsedMs +
          (this.boss.getHealth().current / this.boss.getHealth().max < 0.33 ? 6500 : 9000);
      }
    } else if (this.elapsedMs >= this.nextBossPulseAt) {
      this.bossPulseRemaining = 1600;
      this.ui.toast(translate('무덤지기의 강타! 가까이서 신성한 파동으로 차단하세요.'), 'nova');
    }
  }

  private drawUnitDetails(): void {
    this.unitDetails.clear();
    this.drawHeroEquipment();
    if (this.boss && this.bossPulseRemaining > 0) {
      this.unitDetails.fillStyle(0xe75a74, 0.16);
      this.unitDetails.fillEllipse(this.boss.x, 495, 380, 55);
      this.unitDetails.lineStyle(3, 0xff8191, 0.7);
      this.unitDetails.strokeEllipse(this.boss.x, 495, 380, 55);
      this.unitDetails.lineStyle(2, 0xffd5df, 0.8);
      this.unitDetails.strokeEllipse(
        this.boss.x,
        495,
        380 * (1 - this.bossPulseRemaining / 1600),
        55 * (1 - this.bossPulseRemaining / 1600),
      );
    }
    if (this.enemyBase?.shielded) {
      this.unitDetails.lineStyle(2, 0xc1a1ff, 0.45 + Math.sin(this.elapsedMs / 400) * 0.12);
      this.unitDetails.strokeEllipse(this.enemyBase.x, 420, 160, 195);
    }
    for (const unit of [
      this.paladog,
      ...this.allyUnits.getChildren(),
      ...this.enemies.getChildren(),
      ...(this.boss ? [this.boss] : []),
    ] as (Paladog | AllyUnit | EnemyUnit | Boss)[]) {
      if (!unit.active) continue;
      this.unitDetails.fillStyle(0x03130e, 0.38);
      const laneOffset = Number(unit.getData('laneOffset') ?? 0);
      this.unitDetails.fillEllipse(unit.x, 502 + laneOffset, unit.width * 0.7, 12);
      if (unit.getData('auraWeakened')) {
        this.unitDetails.lineStyle(2, 0xbb9aea, 0.85);
        this.unitDetails.strokeEllipse(unit.x, 502 + laneOffset, 42, 10);
      }
      const hp = unit.getHealth();
      if (hp.current >= hp.max) continue;
      const y = 500 + Number(unit.getData('laneOffset') ?? 0) - unit.height - 9;
      this.unitDetails.fillStyle(0x071b17, 0.9);
      this.unitDetails.fillRoundedRect(unit.x - 23, y, 46, 5, 2);
      this.unitDetails.fillStyle(
        unit instanceof Paladog ? 0xffdb86 : unit instanceof AllyUnit ? 0xb8dca0 : 0xdc91a0,
        1,
      );
      this.unitDetails.fillRoundedRect(unit.x - 23, y, 46 * Math.max(0, hp.current / hp.max), 5, 2);
    }
  }

  private summonSlots(): SummonSlot[] {
    return ALLY_UNIT_TYPES.map((type) => {
      const definition = unitDefinition(type);

      return {
        key: SUMMON_KEY_LABELS[type],
        definition,
        unlocked: isUnlocked(this.persisted, type),
        summonable: canSummon(this.economy, definition, this.persisted.unlocked),
        cooldownRemainingMs: this.economy.cooldownRemainingMs[type],
      };
    });
  }
  private tickSupport(delta: number): void {
    for (const unit of this.allyUnits.getChildren() as AllyUnit[]) {
      if (!unit.active || unit.getHealth().current <= 0) continue;
      if (isWithinAura(this.paladog.x, unit.x, this.aura.radius))
        unit.heal((this.aura.heal * delta) / 1000);
      if (unit.unitType !== 'cleric' || this.elapsedMs < Number(unit.getData('nextHeal') ?? 0))
        continue;
      const targets = [this.paladog, ...this.allyUnits.getChildren()] as (Paladog | AllyUnit)[];
      const injured = targets.filter(
        (t) =>
          t.active &&
          t.getHealth().current > 0 &&
          t.getHealth().current < t.getHealth().max &&
          Math.abs(t.x - unit.x) <= 200,
      );
      if (!injured.length) continue;
      unit.setData('nextHeal', this.elapsedMs + 2400);
      this.motion.defend(unit);
      injured.sort(
        (a, b) =>
          a.getHealth().current / a.getHealth().max - b.getHealth().current / b.getHealth().max,
      );
      for (const t of injured.slice(0, HEAL_TARGET_LIMIT)) {
        t.heal(8);
        this.effectRing(t.x, 0x8ee8ac, 45);
      }
    }
  }
  private effectRing(x: number, color: number, radius: number): void {
    if (this.experience.effects === 'light') return;
    const ring = this.add
      .ellipse(x, LANE_Y, 12, 8)
      .setStrokeStyle(2, color, 0.85)
      .setDepth(SPRITE_DEPTH + 1);
    this.fx.toWorld(ring);
    this.tweens.add({
      targets: ring,
      displayWidth: radius * 2,
      displayHeight: radius * 0.8,
      alpha: 0,
      duration: 360,
      onComplete: () => ring.destroy(),
    });
  }
  private impactProjectile(
    projectile: Projectile,
    target: Paladog | AllyUnit | EnemyUnit | Boss | Base,
    hostile: boolean,
  ): void {
    if (
      !projectile.active ||
      !target.active ||
      target.getHealth().current <= 0 ||
      !projectile.canHit(target)
    )
      return;
    if (target instanceof Base && target.shielded) {
      projectile.destroy();
      return;
    }
    const x = target.x,
      effect = projectile.effect,
      damage = projectile.damage;
    this.applyStrikeDamage(target, damage);
    if (effect === 'frost' && !(target instanceof Base)) {
      target.slow(2000);
      this.effectRing(x, 0x8ce4ff, 40);
    }
    const radius = effect === 'fire' ? 90 : effect === 'storm' ? 110 : effect === 'bomb' ? 85 : 0;
    if (radius) {
      this.effectRing(x, effect === 'storm' ? 0xd5afff : 0xffae67, radius);
      const others = hostile
        ? [this.paladog, ...this.allyUnits.getChildren(), this.allyBase]
        : [...this.enemies.getChildren(), ...(this.boss ? [this.boss] : [])];
      const nearby = (others as (Paladog | AllyUnit | EnemyUnit | Boss | Base)[])
        .filter(
          (other) =>
            other !== target &&
            other.active &&
            other.getHealth().current > 0 &&
            Math.abs(other.x - x) <= radius,
        )
        .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))
        .slice(0, SPLASH_TARGET_LIMIT);
      for (const other of nearby) {
        if (
          other !== target &&
          other.active &&
          other.getHealth().current > 0 &&
          Math.abs(other.x - x) <= radius
        )
          this.applyStrikeDamage(other, Math.round(damage * 0.65));
      }
    }
    projectile.consumeHit(target);
  }
  private drawHeroEquipment(): void {
    const hero = heroProgress(this.persisted),
      g = this.unitDetails,
      x = this.paladog.x,
      d = this.paladog.flipX ? -1 : 1,
      t = this.elapsedMs / 1000;
    if (hero.armor === 'bulwark') {
      g.fillStyle(0x133d43, 0.9);
      g.fillEllipse(x + d * 24, LANE_Y - 20, 28, 46);
      g.lineStyle(2, 0xf3d38a, 0.95);
      g.strokeEllipse(x + d * 24, LANE_Y - 20, 28, 46, 40);
      g.lineStyle(1, 0xf9df9f, 0.85);
      g.strokeCircle(x + d * 24, LANE_Y - 20, 6);
    } else if (hero.armor === 'renewal') {
      for (let i = 0; i < 4; i++) {
        const a = t + (i * Math.PI) / 2;
        g.fillStyle(0x9af6ad, 0.65);
        g.fillEllipse(x + Math.cos(a) * 25, LANE_Y - 35 + Math.sin(a) * 15, 3, 7);
      }
    }
    if (hero.weapon === 'frost') {
      const y = LANE_Y - 66;
      g.fillStyle(0x95efff, 0.75 + Math.sin(t * 3) * 0.15);
      g.fillTriangle(x + d * 42, y - 12, x + d * 34, y + 3, x + d * 50, y + 3);
      g.lineStyle(1, 0xdffcff, 0.8);
      g.strokeCircle(x + d * 42, y, 14 + Math.sin(t * 2) * 2);
    } else if (hero.weapon === 'storm') {
      g.lineStyle(2, 0xe9c7ff, 0.9);
      g.beginPath();
      g.moveTo(x + d * 42, LANE_Y - 82);
      g.lineTo(x + d * 32, LANE_Y - 68);
      g.lineTo(x + d * 46, LANE_Y - 68);
      g.lineTo(x + d * 35, LANE_Y - 53);
      g.strokePath();
    }
  }
  private arrangeFormation(): void {
    for (const [group, direction] of [
      [this.allyUnits, 1],
      [this.enemies, -1],
    ] as const) {
      const units = (group.getChildren() as (AllyUnit | EnemyUnit)[]).filter(
        (u) => u.active && u.getHealth().current > 0,
      );
      const stopped = formationStops(
        units.map((u) => ({
          x: u.x,
          // Short-range troops must be able to pass a firing rear line.
          lane: Number(u.getData('formationLane') ?? 0) + u.attackRange * 10,
          moving: Math.abs((u.body as Phaser.Physics.Arcade.Body).velocity.x) > 0,
        })),
        direction,
      );
      for (const i of stopped) units[i].setVelocityX(0);
    }
  }
}
