import Phaser from 'phaser';
import { LANE_Y, TEXTURE } from '../config/gameConfig';

export type MotionState = 'idle' | 'walk' | 'attack' | 'hurt' | 'guard';
type MotionUnit = Phaser.Physics.Arcade.Sprite;
interface Pose {
  kind: 'attack' | 'hurt' | 'guard';
  start: number;
  duration: number;
  flipX?: boolean;
}
interface Record {
  base: string;
  lastX: number;
  distance: number;
  moving: boolean;
  attack?: Pose;
  reaction?: Pose;
  guardingSince?: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyX: number;
  bodyY: number;
  footOffset: number;
}
interface Strike {
  unit: MotionUnit;
  at: number;
  impact: () => void;
}

/** Combat poses use the simulation clock; movement poses use travelled distance. */
export class UnitMotion {
  private readonly records = new WeakMap<MotionUnit, Record>();
  private strikes: Strike[] = [];
  private clock = 0;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once('shutdown', () => {
      this.strikes = [];
    });
  }

  /** Called only while battle simulation runs, so pauses freeze both poses and impacts. */
  advance(delta: number): void {
    this.clock += delta;
    const due = this.strikes.filter((s) => s.at <= this.clock);
    this.strikes = this.strikes.filter((s) => s.at > this.clock);
    for (const s of due) {
      const health = (
        s.unit as MotionUnit & { getHealth?: () => { current: number } }
      ).getHealth?.();
      if (s.unit.active && (!health || health.current > 0)) s.impact();
    }
  }

  update(units: Iterable<MotionUnit>): void {
    for (const unit of units) {
      if (!unit.active) continue;
      const r = this.record(unit);
      const dx = unit.x - r.lastX;
      r.distance += Math.abs(dx);
      r.moving = Math.abs(dx) > 0.01 || Math.abs(unit.body?.velocity.x ?? 0) > 0;
      r.lastX = unit.x;
      this.draw(unit, r);
      unit.y = LANE_Y + Number(unit.getData('laneOffset') ?? 0);
      unit.setAngle(0);
    }
  }

  stateOf(unit: MotionUnit): MotionState {
    const r = this.records.get(unit);
    if (!r) return 'idle';
    return this.pose(r)?.kind ?? (r.moving ? 'walk' : 'idle');
  }

  attack(unit: MotionUnit, targetX: number, impact?: () => void): void {
    const r = this.record(unit);
    r.attack = { kind: 'attack', start: this.clock, duration: 360 };
    const facesLeft = r.base.startsWith('tex-enemy') || r.base.startsWith('tex-boss');
    unit.setFlipX(facesLeft ? targetX > unit.x : targetX < unit.x);
    r.attack.flipX = unit.flipX;
    if (impact) this.strikes.push({ unit, at: this.clock + 90, impact });
    this.draw(unit, r);
  }

  hurt(unit: MotionUnit, blocked = false): void {
    const r = this.record(unit);
    // Dense simultaneous hits must not pin an actor forever on the first reaction frame.
    if (
      r.reaction &&
      this.clock < r.reaction.start + r.reaction.duration &&
      r.reaction.kind === (blocked ? 'guard' : 'hurt')
    )
      return;
    r.reaction = { kind: blocked ? 'guard' : 'hurt', start: this.clock, duration: 320 };
    this.draw(unit, r);
  }

  defend(unit: MotionUnit): void {
    const r = this.record(unit);
    r.reaction = { kind: 'guard', start: this.clock, duration: 360 };
    this.draw(unit, r);
  }

  setGuarding(unit: MotionUnit, guarding: boolean): void {
    const r = this.record(unit);
    if (guarding) r.guardingSince ??= this.clock;
    else r.guardingSince = undefined;
  }

  interrupt(unit: object): void {
    const r = this.records.get(unit as MotionUnit);
    if (r) r.attack = undefined;
    this.strikes = this.strikes.filter((s) => s.unit !== unit);
  }

  private record(unit: MotionUnit): Record {
    let r = this.records.get(unit);
    if (!r) {
      const body = unit.body as Phaser.Physics.Arcade.Body;
      r = {
        base: unit.texture.key,
        lastX: unit.x,
        distance: 0,
        moving: false,
        bodyWidth: body.width,
        bodyHeight: body.height,
        bodyX: body.offset.x - unit.displayOriginX,
        bodyY: body.offset.y - unit.displayOriginY,
        footOffset: unit.height - unit.displayOriginY,
      };
      this.records.set(unit, r);
    }
    return r;
  }

  private pose(r: Record): Pose | undefined {
    if (r.reaction && this.clock < r.reaction.start + r.reaction.duration) return r.reaction;
    if (r.attack && this.clock < r.attack.start + r.attack.duration) return r.attack;
    if (r.guardingSince !== undefined && !r.moving)
      return { kind: 'guard', start: r.guardingSince, duration: 360 };
    return undefined;
  }

  private draw(unit: MotionUnit, r: Record): void {
    const pose = this.pose(r);
    if (pose?.flipX !== undefined) unit.setFlipX(pose.flipX);
    const hero = r.base === TEXTURE.paladog || r.base.startsWith(`${TEXTURE.paladog}-`);
    let texture = `${r.base}-locomotion`;
    let frame = r.moving
      ? Math.floor((r.distance / (hero ? 160 : 64)) * (hero ? 8 : 6)) % (hero ? 8 : 6)
      : 0;
    if (pose && this.scene.textures.exists(`${r.base}-${pose.kind}`)) {
      texture = `${r.base}-${pose.kind}`;
      frame = Math.min(3, Math.floor((this.clock - pose.start) / (pose.duration / 4)));
    }
    if (!this.scene.textures.exists(texture)) return;
    if (unit.texture.key === texture && unit.frame.name === String(frame)) return;
    unit.setTexture(texture, String(frame));
    unit.setOrigin(0.5, 1 - r.footOffset / unit.height);
    const body = unit.body as Phaser.Physics.Arcade.Body;
    // Larger action canvases allow full weapon swings without changing the combat hitbox.
    body.setSize(r.bodyWidth, r.bodyHeight, false);
    body.setOffset(unit.displayOriginX + r.bodyX, unit.displayOriginY + r.bodyY);
  }
}
