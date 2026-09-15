# Asset Licenses

이 파일은 `public/assets/` 아래에 놓인 모든 이미지·글꼴·오디오 파일의 출처와 라이선스를 기록한다.
출처를 모르는 파일은 커밋하지 않는다.

## 현재 등록된 에셋: 이미지 15건 / 글꼴 1건 (+ 라이선스 전문 1건) / 오디오 8건

이미지는 전부 이 저장소를 위해 새로 그린 원본이다. 원작 팔라독을 포함해 외부 게임의 스프라이트를
추출·모사·트레이스한 것은 하나도 없다 — `product.md`의 저작권 방침에 따른다.

각 PNG의 원본은 `assets-src/` 아래 같은 이름의 SVG이며, 아래 명령으로 재생성한다.

```
rsvg-convert -w <width> -h <height> assets-src/<name>.svg -o public/assets/images/<name>.png
```

가로·세로 값은 `src/config/gameConfig.ts`와 각 유닛·적 정의 파일이 선언한 크기와 정확히
일치해야 한다. 크기가 어긋나면 Phaser가 텍스처를 늘려 그리므로 히트박스와 그림이 따로 논다.

## 이미지

| 파일 | 크기 | 제작자 | 라이선스 | 출처 | 비고 |
|---|---|---|---|---|---|
| images/paladog.png | 40×56 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/paladog.svg | 주인공 |
| images/ally-tanker.png | 34×46 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/ally-tanker.svg | 아군 탱커 |
| images/ally-dealer.png | 34×46 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/ally-dealer.svg | 아군 딜러 |
| images/enemy-grunt.png | 40×48 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/enemy-grunt.svg | 잡몹 |
| images/enemy-brute.png | 56×66 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/enemy-brute.svg | 중형 적 |
| images/boss-grave-warden.png | 96×120 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/boss-grave-warden.svg | 보스 |
| images/projectile.png | 16×16 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/projectile.svg | 투사체 |
| images/base-ally.png | 70×130 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/base-ally.svg | 아군 본진 |
| images/base-enemy.png | 70×130 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/base-enemy.svg | 적 본진 |
| images/ally-archer.png | 32×44 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/ally-archer.svg | 아군 궁수형 (SPEC-UNIT-ROSTER-001) |
| images/ally-guardian.png | 42×50 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/ally-guardian.svg | 아군 방어특화형 (SPEC-UNIT-ROSTER-001) |
| images/ally-bannerman.png | 34×46 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/ally-bannerman.svg | 아군 지원형 (SPEC-UNIT-ROSTER-001) |
| images/enemy-skirmisher.png | 34×44 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/enemy-skirmisher.svg | 적 원거리형 (SPEC-UNIT-ROSTER-001) |
| images/enemy-juggernaut.png | 58×64 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/enemy-juggernaut.svg | 적 방어특화형 (SPEC-UNIT-ROSTER-001) |
| images/enemy-overseer.png | 44×52 | 이 저장소 (SVG 직접 제작) | 프로젝트 소유 (원본) | assets-src/enemy-overseer.svg | 적 지휘관형 (SPEC-UNIT-ROSTER-001) |

## 글꼴

게임의 모든 텍스트는 이 한 글꼴 가족으로 그려진다(`src/ui/TextStyles.ts`). 글꼴은 Phaser 로더가
아니라 `index.html`의 `@font-face`로 로드된다. OFL은 재배포 시 라이선스 전문을 함께 두기를
요구하므로 전문 파일이 글꼴 옆에 있고, `public/assets/` 아래의 모든 파일을 기재하는 규약에 따라
그 파일도 아래 표에 한 행으로 올린다. "크기" 칸은 파일 크기(KB)다 — 글꼴에는 픽셀 크기가 없다.

| 파일 | 크기 | 제작자 | 라이선스 | 출처 | 비고 |
|---|---|---|---|---|---|
| fonts/Galmuri11.woff2 | 493 KB (504,736 bytes) | Lee Minseo (quiple) | SIL Open Font License 1.1 (OFL-1.1) | https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/Galmuri11.woff2 (npm `galmuri` 2.40.3, https://github.com/quiple/galmuri) | Galmuri11 · 버전 2.40.3 · SHA-256 `f467d1b10e6b88dfa8399c9f93b38c7643e050abfe4fc15800ac0b000f5a57d6` · 한글 음절 + Latin-1 |
| fonts/LICENSE-Galmuri.txt | 4.3 KB (4,360 bytes) | Lee Minseo (quiple) | SIL Open Font License 1.1 (OFL-1.1) — 라이선스 전문 | https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/LICENSE.txt | Galmuri11의 OFL 전문 · SHA-256 `86a3ee9495f942f0243f18c103da9faca27adb88142613edb8bb852e56c892c1` |

## 오디오

효과음 여섯과 배경음악 둘, 모두 여덟이다. 전부 CC0(퍼블릭 도메인 헌정)이므로 출처 표기 의무가
없으나, `public/assets/` 아래의 모든 파일을 기재하는 이 저장소의 규약에 따라 아래 표에 올린다.
"크기" 칸은 글꼴 표와 같이 **파일 크기**다 — 오디오에는 픽셀 크기가 없다.

포맷은 **OGG Vorbis 하나**다(C-13). 효과음 여섯은 팩이 준 OGG를 재인코딩 없이 이름만 바꿔
넣었으므로 아래 SHA-256이 팩 원본의 해시와 그대로 일치한다. 배경음악 둘은 원본이 12.8 MB·14.4 MB
WAV여서 한 곡 700 KB 상한 아래로 실을 방법이 재인코딩밖에 없었고, 그래서 그 두 행의 SHA-256은
팩 원본이 아니라 **이 저장소가 만든 파일**의 해시다. 각 행의 비고에 원본 파일명을 함께 적어 둔 것이
그 대조를 대신한다.

| 파일 | 크기 | 제작자 | 라이선스 | 출처 | 비고 |
|---|---|---|---|---|---|
| audio/sfx-cast.ogg | 9.0 KB (9,252 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/impact-sounds (zip: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip) | Impact Sounds 1.0 · 원본 `impactBell_heavy_002.ogg` · 0.697초 · 재인코딩 없음 · SHA-256 `a4171ed1a4a17fb858a38de1c59b5b42e50d8f046c525706c0e3ac8671f189f5` |
| audio/sfx-hit.ogg | 8.5 KB (8,701 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/impact-sounds (zip: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip) | Impact Sounds 1.0 · 원본 `impactPunch_medium_001.ogg` · 0.405초 · 재인코딩 없음 · SHA-256 `e71d23abcc3f10d9d6bc9615b2a431fff70b12333a5fcdd9964457564ace4349` |
| audio/sfx-summon.ogg | 6.4 KB (6,570 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/impact-sounds (zip: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip) | Impact Sounds 1.0 · 원본 `impactSoft_heavy_000.ogg` · 0.505초 · 재인코딩 없음 · SHA-256 `49e7ca88743fca974bb8676ea138b751cfd8f9033b5e7af8736c2a215d6edbc1` |
| audio/sfx-death.ogg | 8.2 KB (8,400 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/impact-sounds (zip: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip) | Impact Sounds 1.0 · 원본 `impactGlass_medium_000.ogg` · 0.543초 · 재인코딩 없음 · SHA-256 `9252d50bfb85edb17d6073c4a7806e10cdb9de56d3dbfc93a4b9727146d2df6d` |
| audio/sfx-victory.ogg | 20.7 KB (21,202 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/music-jingles (zip: https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip) | Music Jingles · 8-Bit jingles · 원본 `jingles_NES12.ogg` · 0.852초 · 재인코딩 없음 · SHA-256 `ac678f8435036f800f4b2244e6d6b929bfdd012640698ab9815b35b86bfbcd29` |
| audio/sfx-defeat.ogg | 20.7 KB (21,177 bytes) | Kenney (Kenney Vleugels) | CC0 1.0 (출처 표기 불필요) | https://kenney.nl/assets/music-jingles (zip: https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip) | Music Jingles · 8-Bit jingles · 원본 `jingles_NES11.ogg` · 0.835초 · 재인코딩 없음 · SHA-256 `ee06814cd4e703bdd501b8035d143061b7fa21cf3b5ab2d0cb4e014dabf1054a` |
| audio/bgm-menu.ogg | 249 KB (255,393 bytes) | Juhani Junkala (SubspaceAudio) | CC0 1.0 (출처 표기 불필요) | https://opengameart.org/content/5-chiptunes-action (zip: https://opengameart.org/sites/default/files/5%20Action%20Chiptunes%20By%20Juhani%20Junkala.zip) | 5 Chiptunes (Action) · 원본 `Juhani Junkala [Retro Game Music Pack] Ending.wav` (12.8 MB WAV) · 44.652초 · OGG Vorbis `-q:a 1`로 재인코딩 · SHA-256 `9ed4bafe63e9e84adb148a215437746cd45b6b4458153b032ffe9e37a42b9f3f` |
| audio/bgm-battle.ogg | 656 KB (671,813 bytes) | Juhani Junkala (SubspaceAudio) | CC0 1.0 (출처 표기 불필요) | https://opengameart.org/content/5-chiptunes-action (zip: https://opengameart.org/sites/default/files/5%20Action%20Chiptunes%20By%20Juhani%20Junkala.zip) | 5 Chiptunes (Action) · 원본 `Juhani Junkala [Retro Game Music Pack] Level 3.wav` (14.4 MB WAV) · 81.897초 · OGG Vorbis `-q:a 1`로 재인코딩 · SHA-256 `6330c992f64cd3e927410907306449d5a1e4300e736945990c6cdfdad1a96730` |

위 "파일" 칸은 다른 두 표와 같이 `public/assets/` 기준의 경로다. `src/config/audio.ts`가 Phaser
로더에 넘기는 경로는 `public/` 기준이라 `assets/` 접두가 하나 더 붙으며, 여덟은 각각
`assets/audio/sfx-cast.ogg` · `assets/audio/sfx-hit.ogg` · `assets/audio/sfx-summon.ogg` ·
`assets/audio/sfx-death.ogg` · `assets/audio/sfx-victory.ogg` · `assets/audio/sfx-defeat.ogg` ·
`assets/audio/bgm-menu.ogg` · `assets/audio/bgm-battle.ogg`다. 두 형태를 함께 적어 두는 이유는
`acceptance.md` AC-003이 **코드가 선언한 그대로의 경로**를 이 파일에서 찾기 때문이다 — 접두가
어긋난 채로는 표에 다 있어도 대조가 실패하고, 그 실패는 "기재되지 않은 파일을 로드한다"와
구별되지 않는다.

각 팩의 CC0 선언은 팩이 함께 배포하는 `License.txt`에 있다. Impact Sounds는
`License: (Creative Commons Zero, CC0)`, Music Jingles는 `License (Creative Commons Zero, CC0)`로
적고 둘 다 `http://creativecommons.org/publicdomain/zero/1.0/`를 가리키며, 크레딧은
"not mandatory"라고 명시한다. Junkala 팩은 동봉된 `INFO.txt`에서 작곡가 본인이
"These music tracks have been released under CC0 creative commons license"라고 적었다.
세 팩 모두 라이선스 전문을 함께 두라는 요구가 없으므로(CC0는 OFL과 달리 재배포 조건이 없다)
`public/assets/audio/` 아래에는 음원 여덟만 두고 전문 파일을 싣지 않는다.

## Evergreen visual overhaul — 2026-09-11

The following original illustrations were generated specifically for this project using the built-in OpenAI `image_gen` tool. No original Paladog game artwork was used as source material. They are project-generated assets, not third-party CC0 downloads. Original PNG files, exact generation prompts, and encoding details are retained in [`assets-src/evergreen/README.md`](../../assets-src/evergreen/README.md).

- `images/forest-battle.webp`: forest landscape.
- `images/ruins-battle.webp`: ruined frontier landscape.
- `images/graveyard-battle.webp`: twilight graveyard landscape.
- `images/party-atlas.webp`: mounted corgi paladin, bear, fox, rabbit, badger, raccoon.
- `images/enemies-atlas.webp`: skeleton, ogre, ranger, armored boar, necromancer, grave guardian.
- `images/fortress-atlas.webp`: sanctuary and dark stronghold.

Existing PNG sprites remain as load-failure fallbacks. Their original provenance entries above still apply. Font and audio sources are unchanged.

### 이동 프레임 (2026-09-11)

`hero-run.webp`, `allies-walk.webp`, `enemies-walk.webp`는 기본 제공 image_gen 도구로 이 프로젝트의 기존 생성 아트를 참조하여 만든 새 프레임 시트입니다. 원본 PNG와 전체 프롬프트, 적군 시트의 투명 배경 보정 이력은 [MOVEMENT.md](../../assets-src/evergreen/MOVEMENT.md)에 있습니다. 외부 게임의 스프라이트를 복제하거나 추출한 에셋이 아닙니다. 이 설명은 CC0 라이선스 부여를 의미하지 않습니다.

### 전투 포즈 (2026-09-11)

`party-attack.webp`, `party-hurt.webp`, `party-guard.webp`, `enemies-attack.webp`, `enemies-hurt.webp`, `enemies-guard.webp`는 기본 제공 image_gen 도구로 생성한 이 프로젝트의 전투 프레임입니다. 기존 생성 캐릭터를 참조했습니다. 원본·프롬프트·보정 기록은 [COMBAT.md](../../assets-src/evergreen/COMBAT.md)에 있습니다. 외부 게임의 스프라이트를 추출한 파일이 아니며, 이 문구는 CC0 부여를 의미하지 않습니다.

## Expedition expansion · 2026-09-11

The built-in image_gen tool generated the following original project assets. These are AI-generated game artwork, not third-party CC0 assets. The existing party atlas was used as a style reference. Original PNGs and production prompts are retained in `assets-src/expedition/`.

| Runtime asset | Content |
|---|---|
| images/expedition-walk.webp | Six new characters, six walking poses each |
| images/expedition-attack.webp | Six new characters, four attack poses each |
| images/expedition-hurt.webp | Six new characters, four hurt poses each |
| images/expedition-guard.webp | Six new characters, four defensive poses each |
| images/frost-battle.webp | Snowy mountain pass and frozen bell tower |
| images/ember-battle.webp | Volcanic forge valley |
| images/astral-battle.webp | Celestial palace at dawn |

Sprite atlases use a magenta chroma key removed by the runtime texture loader. Character artwork was generated and edited with image_gen; the game renders procedural projectile and aura effects in Phaser/Canvas.

## Growth outfits · 2026-09-15

`images/party-novice.png`, `images/party-trained.png`, and `images/expedition-growth.png` were generated with the built-in image generation tool using this project's existing generated character art as the identity reference. These are project-generated images, not CC0 assets. The original alpha is retained; the runtime only extracts and sizes animation cells. Full prompts and output paths are recorded in [GROWTH_ART_PROMPTS.md](../../docs/GROWTH_ART_PROMPTS.md). Existing elite atlases remain unchanged.

## Native-resolution rank portraits · 2026-09-15

The following dedicated UI portrait atlases were generated/edited with the built-in `image_gen` tool using this project's existing artwork as reference. These are AI-generated project artwork, not third-party CC0 assets. Generated alpha is preserved. Source records and final prompts: [ART_QUALITY_PROMPTS.md](../../docs/ART_QUALITY_PROMPTS.md).

| Runtime asset | Actual pixels | Content |
|---|---|---|
| images/party-portraits-novice-v2.png | 1536×1024 | Six novice portraits, original elite art style with simple cloth/leather equipment |
| images/party-portraits-trained-v2.png | 1536×1024 | Six trained portraits, iron armor and blue/green cloaks |
| images/expedition-portraits-v2.png | 1254×1254 | Owl, deer and wolf, three equipment ranks each |
