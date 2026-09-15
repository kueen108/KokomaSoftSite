# 이동 애니메이션 아트

2026-09-11, 기본 제공 `image_gen` 도구로 생성했습니다. 기존 `party-atlas.png`, `enemies-atlas.png`를 캐릭터 디자인 참조로 사용했습니다.

| 원본 | 런타임 | 내용 |
|---|---|---|
| `hero-run.png` | `public/assets/images/hero-run.webp` | 성기사와 탈것의 8프레임 달리기 |
| `allies-walk.png` | `public/assets/images/allies-walk.webp` | 아군 5종, 각 6프레임 걷기 |
| `enemies-walk.png` | `public/assets/images/enemies-walk.webp` | 일반 적 5종과 보스, 각 6프레임 걷기 |

총 74개의 개별 포즈입니다. 최종 PNG의 실제 alpha 채널을 검사하고, WebP 품질 90 / method 6으로 인코딩했습니다. 생성 이미지의 실제 크기는 요청 크기와 다를 수 있으므로 런타임은 실제 크기로 프레임을 구성합니다. 공격은 기존 내지르기 연출을 유지하며 이동 시에는 여러 그림을 교체합니다. 생성된 행 간격이 완전히 균일하지 않아 아군은 y=0/239/458/683/890/1145, 적군은 y=0/185/393/587/790/994/1254 경계를 사용해 인접 행의 그림이 섞이지 않도록 했습니다. 각 행은 alpha 경계를 읽어 공통 크기로 맞추고 발을 하단에 정렬합니다.

## 생성 프롬프트

### hero-run

Use case: stylized-concept. Production game sprite animation sheet, transparent alpha background. Reference image provides character identity and painted style ONLY. Draw ONLY the mounted corgi paladin from the top left, riding its fluffy white dog with teal gold caparison, gold armor, teal cape, golden mace. Create EIGHT DISTINCT consecutive frames of a smooth looping RUN cycle facing RIGHT in exactly 4 columns x 2 rows, reading left to right top then bottom. Canvas 1536x1024, every cell384x512. All eight versions same size, same rider proportions and equipment, centered inside their cells, grounded paws near y440 of each cell, at least40px padding. Four-legged dog legs must visibly articulate between extension, contact, gathering and suspended stride; front and hind feet move alternately, cape flows. Keep torso and head stable, no camera rotation. Hand painted fantasy game art, clear outlines. No other characters, no text, no borders, no labels, no floor, NO background, genuine alpha transparency. Every pose wholly inside its cell, no overlap.


### allies-walk

Use case: stylized-concept. Production game animation sprite sheet, genuinely transparent background. Reference supplies five allied character identities and painterly style. Exclude mounted hero. Exactly SIX columns by FIVE rows, canvas1536x1280 with uniform256x256 cells. Every row is SIX DISTINCT consecutive frames of a looping walk cycle of ONE character, facing RIGHT: row1 brown bear shield infantry; row2 orange fox twin-sword duelist; row3 rabbit hooded archer carrying bow; row4 armored badger tower-shield guardian; row5 raccoon teal sun banner bearer. Same character design and scale within each row, feet baseline at relative y225, at least20px cell padding. Poses: contact left leg forward, down, passing, contact right leg forward, down, passing; legs and knees must articulate significantly and arms counter-swing; preserve weapons/heads/costume. Body stable, capes and tails follow movement. Each of30 figures entirely within own cell. Polished hand painted fantasy sprite art with bold readable silhouettes. No labels, no grid lines, no environment, no ground shadows, true alpha transparency.


### enemies-walk

Use case: stylized-concept. Production game animation sprite sheet with genuine alpha transparency. Match six enemy identities and painterly style of reference. Exactly SIX columns by SIX rows, canvas1536x1536 with uniform256x256 cells. Each row is SIX DISTINCT consecutive animation frames of ONE enemy walking LEFT: row1 purple hood skeletal goblin sword; row2 moss ogre stone club; row3 skeletal crossbow ranger; row4 black armored boar shield knight; row5 crow necromancer staff; row6 massive horned grave guardian violet rune axe. Consistent size and character anatomy within each row, feet baseline at relative y225 with20px padding all edges. Six poses loop in chronological order: left foot contact, down, passing, right foot contact, down, passing. Clearly articulate legs/knees/feet and counter-swing arms, stable torso/head, cloth trailing. Weapons stay in respective cells.36 complete figures, all facing LEFT. Polished hand painted 2D fantasy game art, readable outlines. No text, no grid lines, no labels, no floor, no background. Genuine transparent outside characters.

### 적군 시트의 배경 보정

Use case: background-extraction. This is a game sprite animation sheet. Remove ONLY the gray and white checkerboard background from this exact image and replace it with genuine alpha transparency. The checkerboard is currently baked into the RGB pixels. Keep all 36 character poses, their shapes, colors, exact pixel positions, six columns and six rows unchanged. Do not redraw characters. Transparent PNG with alpha channel outside sprites, not a drawing of a checkerboard.

첫 적군 출력은 체크무늬가 RGB에 포함되어 폐기했고, 위 보정 후 진짜 alpha 채널을 가진 출력을 프로젝트에 저장했습니다.
