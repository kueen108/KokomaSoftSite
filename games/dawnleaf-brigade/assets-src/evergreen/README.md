# Evergreen artwork

Created for PaladogWeb on 2026-09-11 with the built-in `image_gen` tool. These are newly generated illustrations; no original Paladog game images were used as inputs.

| Original source | Production asset | Use |
|---|---|---|
| `forest-battle.png` | `public/assets/images/forest-battle.webp` | Menu / chapter 1 |
| `ruins-battle.png` | `public/assets/images/ruins-battle.webp` | Chapter 2 / survival |
| `graveyard-battle.png` | `public/assets/images/graveyard-battle.webp` | Chapter 3 / boss |
| `party-atlas.png` | `public/assets/images/party-atlas.webp` | Hero and five companions |
| `enemies-atlas.png` | `public/assets/images/enemies-atlas.webp` | Five enemies and boss |
| `fortress-atlas.png` | `public/assets/images/fortress-atlas.webp` | Both strongholds |

Production copies are WebP quality 88, method 6, with alpha preserved. PNG originals stay here for future art work. Runtime code trims atlas cells by alpha and creates individual Phaser textures once during preload. The ogre's club uses a custom first-row crop boundary at x=396; the remaining character atlas cells use the regular 3×2 arrangement. Fortress art uses 2×1.

Generated illustration, PNG-to-WebP encoding, runtime atlas cropping, and gameplay rendering are distinct steps. No automatic repainting or background-removal library is required at runtime.

## Prompts

All six generations used the built-in tool. Each paragraph below records the submitted prompt.

### Forest

Use case: stylized-concept. Asset type: production background painting for a 16:9 side scrolling fantasy defense browser game. Generate a beautiful original hand-painted storybook fantasy landscape, 1536x1024 or wide landscape. Emerald ancient forest at dusk, layered teal mountains and mist, giant dark oak trees framing the left and right edge, golden sun rays and floating fireflies, ruined stone arch far on the right, tiny warm sanctuary far left. A perfectly horizontal gently lit earthen battlefield traverses the image from edge to edge at 70 percent height, with moss stones and lush grass below. Center area spacious, readable and unobstructed for small game characters. Rich cinematic dark teal and jade palette with amber highlights, beautifully textured painterly brushwork, polished indie fantasy game art, atmospheric depth. No text, no letters, no UI, no characters, no logos. Must function as a flat side-view game background, not a perspective path receding into distance.

### Party

Use case: stylized-concept. Asset: six individual original fantasy game character sprites in precisely aligned 3 columns by 2 rows sprite atlas. Transparent background, no floor, no shadows outside character. Image 1536x1024. EACH cell exactly 512x512. Each character centered in its own cell, fully visible with ample 60px padding, all feet at same relative height near bottom. All characters face RIGHT, side view, cute heroic anthropomorphic animal knights, exquisite hand painted 2D mobile game art with bold dark outlines and readable silhouettes, cream/gold armor, teal cloaks. Top left: heroic white corgi paladin riding a stout fluffy white dog mount, golden mace and flowing teal cape. Top middle: stocky brown bear infantry with round blue shield and short sword. Top right: agile orange fox duelist with twin swords, gold scarf. Bottom left: rabbit archer with emerald hood and curved bow. Bottom middle: armored badger with enormous blue tower shield. Bottom right: small raccoon standard bearer holding a tall teal banner with golden sun symbol. No words, no UI, no labels, no grid lines, no background scene. Uniform cohesive production quality, charming expressive faces. Each isolated entirely inside its cell, do not overlap adjacent cells. Genuine alpha transparency.

### Enemies

Use case: stylized-concept. Asset: six individual original fantasy enemy sprites in precisely aligned 3 columns by 2 rows sprite atlas. Transparent background, no floor. Image 1536x1024, EACH cell exactly 512x512. Each character centered in its own cell, fully visible with ample 60px padding. Feet near bottom. All characters face LEFT in clear side view, whimsical dark forest villains, beautiful hand painted 2D game art, bold dark outlines and readable silhouettes, muted purple armor and glowing amber eyes. Top left: small goblin skeleton with rusty sword and purple hood. Top middle: hulking moss-covered ogre with stone club. Top right: skeletal ranger with crossbow and torn plum cloak. Bottom left: black iron armored boar knight with massive shield. Bottom middle: sinister crow necromancer with crooked staff and purple cloak. Bottom right: massive horned grave guardian in ancient stone armor, enormous axe and luminous violet runes, impressive boss. No blood, no gore, no words, no UI, no labels, no grid lines, no background scene. Uniform cohesive polished indie game quality, expressive cartoon faces. Each isolated entirely inside its cell, do not overlap adjacent cells. Genuine alpha transparency.

### Fortresses

Use case: stylized-concept. Asset type: two original side-view fantasy game fortress sprites on genuine alpha transparent background, no backdrop, no ground plane. Wide image split into two equal halves, ample margin within each half, sprites fully isolated. Left half: charming small white stone sanctuary castle, teal peaked roofs, warm golden glowing arched gate, sun emblem, teal banners, stone walls covered in moss. Right half: sinister ruined dark stone fortress, jagged spires, glowing purple portal doorway, crooked purple banners, thorn vines and ancient skull arch. Same cohesive painterly storybook fantasy game style, thick clean outlines, readable silhouettes, detailed textured materials, polished original indie game assets. Flat 2D front elevation slightly side-on, no isometric floor. Both structures entire, centered in respective halves, equal height, no overlap. No text no UI no letters. TRANSPARENT outside buildings, not colored or checkerboard background.

### Ruins

Use case: stylized-concept. Asset type: wide side-scrolling fantasy game background painting. Original hand-painted storybook 2D game art with rich atmospheric depth and clean readable foreground. Scene: ruined castle frontier, enormous broken stone aqueduct and ivy-covered arches in the middle distance, blue-gray mountainous valley and a pale golden sky, damaged watchtowers, weathered teal banners, forest creeping over ancient masonry. Horizontal illuminated cobblestone battlefield runs perfectly edge to edge at exactly 68 percent of image height, its surface continues to 73 percent; mossy stone cliff and roots below. No path receding into distance. Keep the entire battlefield unobstructed for characters. Side elevation game camera, no characters, no UI, no text, no lettering, no foreground props blocking units. Dark framing on far left and right, center open, warm light on cool slate stone, exceptionally polished painterly indie fantasy game art. Landscape 1536x1024.

### Graveyard

Use case: stylized-concept. Asset type: wide side-scrolling fantasy game background painting. Original hand-painted storybook 2D game art with rich atmospheric depth and clean readable foreground. Scene: ancient haunted forest graveyard at violet twilight, enormous twisted trees framing far left and right, a ruined gothic mausoleum far in the middle distance, moon above layered purple mist, scattered weathered tombstones far BEHIND the playable lane, fireflies glowing lavender, beautiful mysterious magical atmosphere not horror gore. Horizontal moonlit dirt and flagstone battlefield runs perfectly edge to edge at exactly 68 percent of image height, its surface continues to 73 percent; dark mossy roots and rocks below. No path receding into distance. Keep entire battlefield unobstructed for characters. Side elevation game camera, no characters, no UI, no text, no lettering, no foreground props blocking units. Center open, dusty plum and deep midnight teal palette with pale amber accents, exceptionally polished painterly indie fantasy game art. Landscape 1536x1024.
