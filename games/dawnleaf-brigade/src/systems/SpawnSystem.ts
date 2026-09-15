// @MX:ANCHOR: [AUTO] Wave scheduling — the single entry point deciding which
// enemies enter the battle and when.
// @MX:REASON: Called by BattleScene every frame; it is the only thing driving
// wave progression, so a fault here silently empties or floods the stage.
// Engine-independent by contract (REQ-013) — nothing in this file may import
// the rendering engine (structure.md @NAV:DEC-SYSTEMS-PURITY, AC-015a).
import type { WaveEntry, WaveSchedule } from '../types/stage';

// @MX:NOTE: [AUTO] This takes an interval (prev, now) rather than a single
// "current time" for a reason the signature alone does not reveal: frame
// deltas wobble, and a frame can be longer than the gap between two spawns.
// Comparing against one timestamp would either miss entries the frame jumped
// over, or re-report the same entry on the next frame. The half-open window
// [prev, now) makes every entry fall into exactly one frame's window —
// no duplicates, no drops (REQ-010). Left-closed rather than right-closed so
// that an entry scheduled at t=0 is caught by the very first frame.
/** Returns the wave entries falling in [prevElapsedMs, nowElapsedMs). */
export function dueSpawns(
  schedule: WaveSchedule,
  prevElapsedMs: number,
  nowElapsedMs: number,
): WaveEntry[] {
  return schedule.filter(
    (entry) => entry.spawnAtMs >= prevElapsedMs && entry.spawnAtMs < nowElapsedMs,
  );
}
