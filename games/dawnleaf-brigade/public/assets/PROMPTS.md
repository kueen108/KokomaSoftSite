# PaladogWeb — pen.dev AI 이미지 제작 프롬프트

이 문서는 pen.dev(pencil.dev)의 AI 에이전트에게 붙여넣어 PaladogWeb 게임용 이미지를 만들 때 쓰는 프롬프트 모음이다. pen.dev는 IDE 안에서 AI 코딩 에이전트(Claude Code 등)가 MCP로 캔버스를 조작하며 이미지를 생성·배치하는 방식으로 동작하므로, 프롬프트는 "무엇을, 몇 픽셀로, 어떤 스타일로" 를 구체적으로 명시하는 형태로 작성했다.

**중요 — 저작권 원칙** (`product.md` 참고): 아래 프롬프트 어디에도 "팔라독처럼", "원작 게임과 똑같이" 같은 지시를 넣지 않았다. 게임성(측면 디펜스, 오라 시스템)은 재현하되 그래픽은 완전히 새로 만드는 것이 이 프로젝트의 원칙이다. pen.dev에 프롬프트를 넣을 때도 이 원칙을 지켜서, 특정 원작 게임을 참조 대상으로 언급하지 말 것.

**사용법**: 아래 "0. 스타일 가이드" 프롬프트를 가장 먼저 pen.dev에 전달해 전체 톤을 잡은 뒤, 이후 개별 에셋 프롬프트를 하나씩 순서대로 전달한다. 매 프롬프트 끝에 스타일 가이드를 한 문장으로 반복해 일관성을 유지한다.

---

## 0. 스타일 가이드 (가장 먼저 전달)

```
I'm building a 2D side-scrolling lane-defense browser game called "PaladogWeb" using
Phaser 3. I need a consistent set of original game sprites — NOT based on or inspired
by any existing commercial game's art, purely an original design brief below.

ART STYLE:
- Chibi/cute fantasy style, thick clean outlines (2-3px black outline), flat cel-shaded
  coloring (2-3 shading tones per surface, no photorealistic gradients)
- Warm, readable color palette: primary accent colors are a deep royal blue and gold for
  the player's side, a sickly purple-green for the enemy side, and a warm tan/brown for
  neutral terrain and UI frames
- Side-view (2D profile / 3/4 side view), designed to read clearly at small size on a
  single horizontal lane
- All character/unit sprites face RIGHT by default (this is a side-scroller where the
  player advances rightward)

TECHNICAL FORMAT:
- PNG with transparent background for all characters, units, and UI icons
- Background art is opaque, sized for a 1280x720 game canvas
- Keep each sprite's silhouette readable at 64x64px display size, even though the source
  file may be larger
- No text or watermarks baked into any image

Please keep this style guide in mind for every asset I ask you to generate next — I will
reference "the established style" in later prompts.
```

---

## 1. 팔라독(주인공) — Paladog

**코드 위치**: `src/entities/Paladog.ts` · **저장 경로**: `public/assets/images/paladog.png`

```
Following the established style: design the player character — a small, brave paladin
dog. It walks on two legs like a knight, wearing a simple breastplate of steel armor
with a blue-and-gold color scheme, and carries a wooden mace with a glowing blue magical
gem embedded in the head. Floppy ears, determined expression, short tail. No cape, no
helmet (face and ears stay visible for readability).

Deliver 2 poses as separate transparent PNGs, both facing right, each roughly 64x96px
source canvas:
1. "idle/walk" — a simple two-frame-readable standing pose, mace held at rest
2. "attack" — mace raised and glowing brighter, mid-swing/cast pose

Keep the silhouette simple enough to read as "small heroic dog" at 48px tall on screen.
```

---

## 2. 아군 근접 유닛 — 탱커형 (Tank Ally)

**코드 위치**: `src/entities/AllyUnit.ts` (유닛 타입 데이터 `src/data/units/`) · **저장 경로**: `public/assets/images/ally-tank.png`

```
Following the established style: design a melee ally unit with a "tanky, high-HP"
role — a sturdy badger or bear-cub warrior, stocky build, wearing a thick round wooden
shield strapped to one arm and a short blunt club. Same blue-and-gold color accents as
Paladog (they're allies), but visually distinct enough from Paladog to tell apart
instantly at a glance — bulkier silhouette, no mace-glow effect.

One pose, facing right, transparent PNG, ~64x64px source canvas: a forward-leaning
"advancing/braced" stance that reads as "this unit tanks hits."
```

---

## 3. 아군 근접 유닛 — 딜러형 (Damage Ally)

**코드 위치**: `src/entities/AllyUnit.ts` (유닛 타입 데이터 `src/data/units/`) · **저장 경로**: `public/assets/images/ally-striker.png`

```
Following the established style: design a melee ally unit with a "high damage, agile"
role — a lean fox or wolf-cub fighter, slim build, wielding a curved short sword in each
hand (dual-wield), no shield. Same blue-and-gold ally color accents, but a sleeker,
lower-profile silhouette than the tank unit above, so the two ally types are instantly
distinguishable side by side.

One pose, facing right, transparent PNG, ~56x64px source canvas: a forward-lunging
attack-ready stance.
```

---

## 4. 적 유닛 — Enemy Unit

**코드 위치**: `src/entities/EnemyUnit.ts` · **저장 경로**: `public/assets/images/enemy-grunt.png`

```
Following the established style: design a basic enemy creature — a small shambling
skeleton-imp hybrid, sickly purple-green color scheme (matching the enemy palette from
the style guide), glowing dim red eyes, clawed hands, no weapon (attacks by clawing).
Should read as clearly hostile and visually opposite to the blue-and-gold ally units —
different silhouette family entirely (hunched, asymmetric) so players never confuse
allies and enemies even in a crowded battle.

One pose, facing LEFT (enemies advance leftward toward the player, opposite of ally
units), transparent PNG, ~56x64px source canvas: a shambling advance pose.
```

---

## 5. 마법 투사체 — Mace Projectile

**코드 위치**: `src/entities/Projectile.ts` · **저장 경로**: `public/assets/images/projectile-mace.png`

```
Following the established style: design a small flying magic projectile fired by
Paladog's mace — a glowing blue-white orb of energy with a faint trailing wisp/comet
tail behind it (trail points left, since the orb flies rightward). Should look distinct
and bright against both the tan background and the enemy purple-green palette so it's
always readable mid-flight.

One sprite, transparent PNG, ~24x24px source canvas, facing right (trail extends to the
left of the orb).
```

---

## 6. 본진 — 아군/적 (Bases)

**코드 위치**: `src/entities/Base.ts` · **저장 경로**: `public/assets/images/base-ally.png`, `public/assets/images/base-enemy.png`

```
Following the established style: design two small fortress icons that sit at the two
ends of the battle lane.

1. ALLY BASE — a simple stone keep/tower with a blue-and-gold banner flying on top,
   warm tan stonework matching the neutral palette.
2. ENEMY BASE — a similarly-shaped stone structure but corrupted-looking: cracked
   stonework, a purple-green banner, jagged dark spikes instead of a clean roofline.

Keep both the SAME approximate footprint/scale so they read as a matched pair at
opposite ends of the lane, just palette-and-detail-swapped. Transparent PNG background,
~96x128px source canvas each, front-facing (no left/right orientation needed).
```

---

## 7. HUD 요소 — Health Bar / Gold / Summon Icons

**코드 위치**: `src/ui/HealthBar.ts`, `src/ui/SummonBar.ts`, `src/ui/GoldCounter.ts` · **저장 경로**: `public/assets/images/ui-*.png`

```
Following the established style: design a small set of flat UI icons for the game's
HUD, in the same warm tan/brown frame color used for neutral terrain, with the
blue-and-gold accent used elsewhere:

1. "health-bar-frame" — an empty horizontal bar frame with a simple bordered/riveted
   look, ~200x24px, transparent background, meant to have a solid color fill drawn
   inside it by code (so leave the interior empty/transparent).
2. "gold-coin" — a single small gold coin icon, ~32x32px, transparent background, used
   next to the gold count number.
3. "summon-icon-tank" and "summon-icon-striker" — two small circular button icons
   (~48x48px each) showing a simplified head/silhouette of the tank ally and striker
   ally respectively, for the summon hotkey buttons.

Keep all four icons flat and simple — they'll be small and need to read instantly during
fast gameplay, not stand out artistically.
```

---

## 8. 배경 — 전투 스테이지 배경

> **이 절이 배경의 본체다.** 이 게임은 카메라가 고정된 한 화면짜리 전장이므로
> 배경은 1280×720 한 장이 맞는 형태다. 11번은 그 위에 얹는 **선택 항목**(느리게
> 흐르는 구름 한 겹)이며, 8번을 대체하지 않는다 — 자세한 근거는 11번의 정정 참조.

**코드 위치**: `src/scenes/BattleScene.ts` · **저장 경로**: `public/assets/images/bg-battle.png`

```
Following the established style: design a side-scrolling battlefield background for a
single-lane defense game — a gently rolling grassy plain under a warm late-afternoon
sky, with a simple distant tree line and a few clouds. Keep the ground area (bottom
third of the image) relatively flat and plain, since characters/units will stand and
walk along it and shouldn't be visually competed with by busy foreground detail.

One opaque PNG (no transparency needed), sized 1280x720px to match the game canvas
exactly, designed so the horizon/ground line sits roughly 3/4 of the way down the image
(leaving room for the sky/background art up top and a walkable ground strip at the
bottom).

HUD READABILITY — a hard constraint, not a preference:
- The game draws light HUD text (gold #f5d76e, red #f2777a, white) over the TOP ~200px
  of this image. Nothing can be moved; the text is already there.
- That top band MUST stay DARK — a deep dusk sky, not a bright one — so the text reads
  against it. Picture the sky just after the sun has dropped: deep and violet-blue
  overhead, warm and glowing only down near the horizon.
- Brightness must increase smoothly from the top edge toward the horizon and never
  reverse. The bright, warm part of the sky belongs near the horizon, where no text is
  drawn and the units stand.
- A uniformly bright "afternoon" sky, however pretty, makes the HUD unreadable and
  cannot be used. Measured: light text over a bright warm sky gives a contrast ratio
  near 1.3 where 4.5 is the minimum.
```

---

## 9. 메인 메뉴 / 결과 화면 장식 (선택)

**코드 위치**: `src/scenes/MainMenuScene.ts`, `src/scenes/ResultScene.ts` · **저장 경로**: `public/assets/images/menu-bg.png`, `public/assets/images/victory-banner.png`, `public/assets/images/defeat-banner.png`

```
Following the established style, design three optional decorative pieces:

1. "menu-bg" — a calmer, more atmospheric version of the battle background (same
   plains/sky setting, but wider view, slightly darker/more dramatic sky) as a full
   1280x720px opaque background for the main menu screen, with open sky space in the
   upper-middle area reserved for a game title text overlay (added later by code — leave
   that area relatively uncluttered).
2. "victory-banner" — a small celebratory gold-and-blue ribbon/banner graphic, ~400x120px,
   transparent background, no text baked in (the word "VICTORY" is added by code).
3. "defeat-banner" — the same ribbon/banner shape but in a somber gray-purple palette
   matching the enemy color family, same size, no text baked in.

TEXT READABILITY for "menu-bg" — a hard constraint:
- Menu text is drawn across the MIDDLE of the screen (around y=270 of 720), not the top.
  So unlike the battle background, this image cannot be rescued by keeping only its top
  dark — its whole middle band must stay dark.
- Keep this image darker overall than the battle background: warm in hue, low in
  brightness throughout the middle third where the menu items sit.
- The same measured floor applies: light text needs 4.5:1 against whatever sits behind
  it.
```

---

## 적용 순서 참고

1. 스타일 가이드(0번)를 먼저 전달해 톤을 고정한다.
2. 팔라독(1번) → 아군 유닛 2종(2, 3번) → 적 유닛(4번) → 투사체(5번) 순으로, 캐릭터류부터 만들어 색·비율 기준을 세운다.
3. 본진(6번)과 HUD(7번)는 캐릭터 팔레트가 확정된 뒤에 만들면 색이 어긋나지 않는다.
4. 배경(8번)과 메뉴/결과 화면 장식(9번)은 캐릭터 뒤에 — 전경 캐릭터가 잘 보이는지
   확인하며 배경 채도를 조절할 수 있다.
5. 애니메이션 프레임(10번)은 언제 해도 되지만, 캐릭터마다 **기준 파일을 첨부해 한 번에 세 장씩**
   만든다. 한 캐릭터의 세 장은 같은 자리에서 나와야 서로 어긋나지 않는다.

**출처를 반드시 기록할 것** (`product.md` 요구사항): 이미지가 만들어지면 이 파일 옆의 `public/assets/LICENSES.md`에 파일명·생성 도구(pen.dev)·생성일을 반드시 남긴다. 스프라이트 9종은 `SPEC-CAMPAIGN-ART-001`이 이미 게임에 연결했다(2026-09-02) — 1~7번은 실행이 끝난 절이다. 남은 것은 **8번(배경 한 장) · 10번(애니메이션 프레임) · 11번(구름 한 겹, 선택)**이며, 그림이 만들어지면 별도 SPEC이 코드에 연결한다.

---

## 10. 애니메이션 프레임 (트랙 1 잔여 — 신규)

지금 게임의 스프라이트 9종은 전부 **정지 이미지**다(`anims` 사용 0건). 유닛이 체스 말처럼 미끄러지는 것이 현재 가장 조악해 보이는 지점이며, 이 절은 그것을 걷는 리듬으로 바꾸기 위한 프레임을 만든다.

### 10-0. 프레임 정합 규칙 (모든 프레임 프롬프트에 반드시 포함)

독립적으로 생성한 프레임들은 **정합(registration)이 어긋나면 애니메이션이 아니라 떨림이 된다.** 이것이 이 작업의 유일하고 가장 큰 실패 지점이므로, 아래 다섯 줄을 각 프롬프트 끝에 그대로 붙인다.

```
FRAME REGISTRATION — this is the most important constraint:
- Every frame MUST use the exact same canvas size as the reference sprite, to the pixel.
- The character MUST occupy the same position within that canvas in every frame: same
  horizontal center, and the lowest pixel of the feet on the same baseline row.
- Do not re-crop, re-center, or "tighten" any frame. Padding is intentional.
- Keep colors, outline weight, and proportions identical to the reference sprite — these
  are frames of the same character, not variations of it.
- Transparent background, PNG.
```

### 10-1. 만들 프레임 (6종 × 3장 = 18장)

캐릭터당 **걷기 2장 + 공격 1장**이다. 기존 PNG가 정지/기본 포즈로 계속 쓰이므로 새로 만드는 것은 3장뿐이다. 걷기를 2프레임으로 두는 것은 작은 크기에서 2프레임 순환이 충분히 걷는 것으로 읽히기 때문이며, 4프레임은 생성 부담과 정합 위험을 두 배로 만든다.

| 캐릭터 | 기준 파일 (참조로 첨부) | 캔버스 크기 | 만들 파일 |
|---|---|---|---|
| 팔라독 | `paladog.png` | 40×56 | `paladog-walk-a.png` · `paladog-walk-b.png` · `paladog-attack.png` |
| 탱커 | `ally-tanker.png` | 34×46 | `ally-tanker-walk-a.png` · `-walk-b.png` · `-attack.png` |
| 딜러 | `ally-dealer.png` | 34×46 | `ally-dealer-walk-a.png` · `-walk-b.png` · `-attack.png` |
| 잡졸 | `enemy-grunt.png` | 40×48 | `enemy-grunt-walk-a.png` · `-walk-b.png` · `-attack.png` |
| 정예 | `enemy-brute.png` | 56×66 | `enemy-brute-walk-a.png` · `-walk-b.png` · `-attack.png` |
| 보스 | `boss-grave-warden.png` | 96×120 | `boss-grave-warden-walk-a.png` · `-walk-b.png` · `-attack.png` |

죽는 장면은 프레임이 필요 없다 — `SPEC-COMBAT-FEEL-001`이 이미 사본 축소와 불꽃으로 처리하며, 그 연출은 어떤 스프라이트에도 붙는다.

### 10-2. 프롬프트 본문 (캐릭터마다 표의 값만 바꿔 사용)

pen.dev에 **기준 파일을 함께 첨부**하고 아래를 전달한다. 새로 설명하지 않고 기존 그림을 참조시키는 이유는, 말로 다시 묘사하면 같은 캐릭터가 아니라 비슷한 캐릭터가 나오기 때문이다.

```
Attached is an existing sprite from my game: <파일명> (<가로>x<세로>px, transparent PNG).
I need three more frames of THIS EXACT character — same art, same palette, same outline
weight, same proportions. Treat the attached image as the authoritative reference.

1. "<이름>-walk-a" — a walking contact pose: the far leg forward, the near leg back,
   body weight slightly forward, a small downward bob compared to the reference.
2. "<이름>-walk-b" — the opposite step of the same walk cycle: legs swapped, body
   slightly higher. Frames a and b alternate, so they must be mirror-ish in timing but
   NOT a horizontal flip of each other — the character always faces right.
3. "<이름>-attack" — the strike pose: weapon or body driven forward toward the right,
   at the moment of impact. One frame only; the game handles the wind-up and recovery
   with motion, so this frame should read as the peak of the swing.

<10-0 프레임 정합 규칙 다섯 줄을 여기에 그대로 붙인다>
```

**보스만 다르게**: 보스(`boss-grave-warden.png`)는 걷는 대신 자리에서 위압하는 존재이므로, `walk-a`/`walk-b`를 **가벼운 부유/호흡 두 프레임**(위아래로 살짝 뜨는 정지 포즈)으로 요청한다. 공격 프레임은 같다.

### 10-3. 만들어진 뒤에

파일을 `public/assets/images/`에 넣고 알려주면, 이쪽에서 `PreloadScene`에 로드를 붙이고 Phaser `anims`로 걷기 순환과 공격 재생을 연결한다. 걷는 속도에 프레임 전환을 맞추는 것(빠른 유닛은 빠르게 밟는다)까지 코드가 처리한다.

**출처 기록은 필수다.** `public/assets/LICENSES.md`의 `## 이미지` 표에 파일명·생성 도구(pen.dev)·생성일을 새 파일마다 한 줄씩 남긴다 — 기존 9종과 같은 형식이며, 이것은 `product.md`의 저작권 원칙이 요구하는 것이다.

---

## 11. 배경 보강 — 느리게 흐르는 구름 한 겹 (선택)

> **정정 — 이 절의 초판은 틀렸다.** 초판은 배경을 하늘·원경·지면 **세 겹**으로 나눠
> 시차(parallax)로 깊이를 만들자고 했다. 시차는 **카메라가 움직여야** 생기는데,
> 이 게임에는 움직일 카메라가 없다.
>
> 확인한 근거: `src/` 전체에 `startFollow`·`setBounds`·`scrollX`·`scrollY`·`centerOn`이
> **0건**이고, 전장이 아군 본진 `ALLY_BASE_X = 60`부터 적 본진 `ENEMY_BASE_X = 1220`까지라
> 화면 폭 `GAME_WIDTH = 1280` 안에 통째로 들어온다. 한 화면 고정 전장이다.
>
> 세 겹을 만들어 겹쳐 놓으면 한 장과 **같은 그림**이 되고, 겹끼리 지평선을 맞추라는
> 제약 때문에 **한 장보다 만들기만 어려워진다.** 그래서 8번(1280×720 불투명 한 장)이
> 이 게임에 맞는 형태이며 8번을 그대로 쓴다. 이 절에는 그 위에 얹는 선택 항목만 남긴다.

### 고정 화면에 생기를 주는 것

카메라가 안 움직여도 **텍스처 자체를 흘리는 것**은 된다 — `add.tileSprite`의
`tilePositionX`를 매 프레임 조금씩 더하면 카메라와 무관하게 흐른다. 배경 위에 구름 한 겹만
얹어 아주 느리게 흘리면 정지 화면이 살아 있는 화면이 된다. 깊이가 아니라 **생기**를 위한
것이므로 한 겹이면 충분하고, 두 겹 이상은 이 화면에서 구별되지 않는다.

**저장 경로**: `public/assets/images/bg-clouds.png`

```
Following the established style: design a transparent cloud layer to overlay a fixed
battlefield background. This is NOT a parallax layer — the game camera never moves;
the layer is scrolled by shifting its own texture, so it must tile seamlessly.

- 1280x720px PNG, fully transparent except the clouds.
- Clouds occupy roughly the TOP THIRD only. The middle and bottom must be fully
  transparent so the battlefield and the units stay unobstructed.
- Soft, sparse, low-contrast clouds in the warm late-afternoon palette of the
  background — they sit behind the action and must never draw the eye.

SEAMLESS TILING — the one constraint that ruins this if missed:
- The left and right edges MUST match exactly, so that placing a copy of the image
  immediately to the right produces no visible seam.
- No cloud may be cut off at the left or right edge in a way that does not continue
  on the opposite edge.
- Verify by mentally wrapping the image: the rightmost column must flow into the
  leftmost column without a break in shape, tone, or edge softness.
```

**만들어진 뒤에**: `bg-clouds.png`를 넣고 알려주면, 배경 위에 `tileSprite`로 얹고 매 프레임
`tilePositionX`를 아주 작은 값씩 더하는 코드를 붙인다. 속도는 눈에 띄지 않을 만큼 느리게
잡는다 — 구름이 움직이는 것이 보이면 그건 이미 너무 빠른 것이다.

**메뉴 배경(9번)은 그대로 유효하다.**
