import { translate } from '../i18n/index';
import type { StorageAdapter } from '../types/save';
export const EXPERIENCE_KEY = 'paladogweb:experience';
export const DIFFICULTIES = {
  story: { name: translate('이야기'), hp: 0.85, damage: 0.75, reward: 0.8 },
  normal: { name: translate('일반'), hp: 1, damage: 1, reward: 1 },
  veteran: { name: translate('도전'), hp: 1.15, damage: 1.25, reward: 1.2 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export interface Experience {
  readonly difficulty: Difficulty;
  readonly effects: 'full' | 'light';
}
export function readExperience(storage: StorageAdapter | null): Experience {
  const defaults: Experience = { difficulty: 'normal', effects: 'full' };
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(EXPERIENCE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
    const raw = parsed as Record<string, unknown>;
    return {
      difficulty:
        raw.difficulty === 'story' || raw.difficulty === 'veteran' ? raw.difficulty : 'normal',
      effects: raw.effects === 'light' ? 'light' : 'full',
    };
  } catch {
    return defaults;
  }
}
export function writeExperience(storage: StorageAdapter | null, value: Experience): void {
  try {
    storage?.setItem(EXPERIENCE_KEY, JSON.stringify(value));
  } catch {
    /* Settings remain optional when browser storage is unavailable. */
  }
}
