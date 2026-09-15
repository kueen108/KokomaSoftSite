import { bossDefinition } from '../data/bosses';
import { enemyDefinition } from '../data/enemies';
import { unitDefinition } from '../data/units';

import { TEXTURE } from './gameConfig';

/**
 * One image to load, and the texture key it is registered under.
 *
 * Deliberately no size field. Six of the nine keys already declare their size
 * in the file that defines the thing they draw, and a size here would put the
 * same number in a second place where the two are free to drift apart with
 * nothing failing (REQ-002, plan.md D-1). Loading needs the key and the path;
 * anything else here would be a second truth rather than a convenience.
 */
export interface ImageAsset {
  readonly key: string;
  readonly path: string;
}

/**
 * The fifteen images the game draws with (REQ-001, extended by
 * SPEC-UNIT-ROSTER-001 REQ-021 for the six new roster sprites).
 *
 * The keys are read from the declarations that already own them rather than
 * retyped, because a key typed a second time can drift from the first: the
 * image would load under a name nothing draws with, the entity would fall back
 * to its placeholder shape, and no error would be raised. That is the same
 * silent failure the sizes were moved to escape.
 *
 * The paths are written out because they genuinely are new information — the
 * file names do not follow from the keys (`tex-ally-base` is `base-ally.png`,
 * `tex-enemy` is `enemy-grunt.png`), so there is nothing to derive them from.
 * Every path here must appear in `public/assets/LICENSES.md`; acceptance.md
 * AC-013 reads this file to check that.
 */
export const IMAGE_ASSETS: readonly ImageAsset[] = [
  { key: TEXTURE.paladog, path: 'assets/images/paladog.png' },
  { key: TEXTURE.projectile, path: 'assets/images/projectile.png' },
  { key: TEXTURE.allyBase, path: 'assets/images/base-ally.png' },
  { key: TEXTURE.enemyBase, path: 'assets/images/base-enemy.png' },
  { key: unitDefinition('tanker').textureKey, path: 'assets/images/ally-tanker.png' },
  { key: unitDefinition('dealer').textureKey, path: 'assets/images/ally-dealer.png' },
  { key: enemyDefinition('grunt').textureKey, path: 'assets/images/enemy-grunt.png' },
  { key: enemyDefinition('brute').textureKey, path: 'assets/images/enemy-brute.png' },
  { key: bossDefinition('grave-warden').textureKey, path: 'assets/images/boss-grave-warden.png' },
  { key: unitDefinition('archer').textureKey, path: 'assets/images/ally-archer.png' },
  { key: unitDefinition('guardian').textureKey, path: 'assets/images/ally-guardian.png' },
  { key: unitDefinition('bannerman').textureKey, path: 'assets/images/ally-bannerman.png' },
  { key: enemyDefinition('skirmisher').textureKey, path: 'assets/images/enemy-skirmisher.png' },
  { key: enemyDefinition('juggernaut').textureKey, path: 'assets/images/enemy-juggernaut.png' },
  { key: enemyDefinition('overseer').textureKey, path: 'assets/images/enemy-overseer.png' },
];
