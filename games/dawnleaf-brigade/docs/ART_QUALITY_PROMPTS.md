# Portrait quality correction — 2026-09-15

Mode: built-in `image_gen` editing/generation, not CLI/API. Generated PNG alpha is preserved; no upscaling, sharpening filter, recolouring or synthetic detail was applied after generation.

The existing combat animation assets remain in use. These dedicated large portraits replace the low-resolution combat canvases previously enlarged by the UI. Elite primary-party artwork is the unchanged `party-atlas.webp` source, cropped at native resolution.

## Expansion party

Saved: `public/assets/images/expedition-portraits-v2.png` (actual 1254×1254, three columns / three rows; the requested larger dimensions are not treated as measured output).
Final generated source: `exec-c6293acb-2096-4849-bcef-ba5274455a80.png`.
The preceding draft `exec-afe7a529-fe56-423c-9311-8adee70a3834.png` had overly tight gutters and was not integrated.
Both remain under `/Users/kueen108/.codex/generated_images/01a0a2a1-f0a1-71b1-8938-dee4b7038a79/`.

Draft generation used `party-atlas.webp` as the definitive painterly style reference, `expedition-walk.webp` for the three allied species and elite outfits, and `expedition-growth.png` for novice/trained equipment. Only the three allied species were requested; enemy rows and magenta backgrounds were explicitly excluded. The final edit used that draft as its sole edit target.

### Final edit prompt

```text
Use case: precise-object-edit. Image 1 edit target: the supplied nine-character portrait atlas. Fix ONLY layout padding: currently the novice deer's antlers touch the top edge and the owl's crystal overlaps between rows. Preserve all nine identities, species, face shapes, premium hand-painted fur/feather and material details, right-facing poses, outfit colors and rank progression. Keep exactly 3 equal columns by 3 equal rows, same order. Put every character AND all its equipment entirely INSIDE its own cell with at least 32px empty transparent space on ALL FOUR SIDES of every cell. The full composition should have three visibly separated rows and columns with 64px-wide clear transparent gutters, no character or crystal crossing any gridline. Keep every antler tip, staff head, flag/cape edge, paw and spear tip. Scale the full individual character including weapon together to fit the cell, do not crop or reduce its illustration detail. Square high-resolution canvas. GENUINE TRANSPARENT alpha background, no painted checkerboard, no labels, no gridlines, no shadows behind characters. Also ensure intermediate row has plain silver iron armor and simple blue round shield, while bottom elite row retains gold sun heraldry and ornate gold armor. All nine equally detailed and clean.
```

## Primary party

### party-portraits-novice-v2.png

Saved: `public/assets/images/party-portraits-novice-v2.png` (1536×1024, three columns / two rows).
Reference/edit target: `public/assets/images/party-atlas.webp`.
Generated source: `exec-bf598482-b131-49a4-9c0f-2b0689e95bb2.png` in the session generated-images directory.

```text
Use case: precise-object-edit. Asset: high fidelity 2D game character portrait atlas for Dawnleaf Brigade. Image 1 is the edit target and definitive painterly style reference. Change equipment ONLY, preserve species, face, realistic fluffy fur detail, body proportions, hand-painted dimensional shading, crisp delicate outlines, lighting, right-facing three-quarter pose, full body and mount, exactly THREE equal columns by TWO equal rows (six characters) and character order. Output landscape 1536x1024 or larger. Each character occupies most of its 512x512 cell with transparent gutters, no clipping, all feet and weapons visible. GENUINELY TRANSPARENT alpha background, no checkerboard painted in, no colored matte, no ground shadows or border, no text. Do NOT simplify to flat cartoon/cell-shaded art or chibi, do not shrink characters to tiny animation frames. Detailed fur, cloth weave, leather stitching and subtle metal reflections have the SAME premium illustration quality as Image 1. Top row corgi hero riding large fluffy white wolf, bear shield swordsman, fox twin swordsman. Bottom row rabbit archer, badger tower-shield guardian, raccoon standard bearer. Equipment novice rank: cream linen tunics and fitted brown leather belts/bracers/boots, short muted sage scarf or hood. Hero plain carved wooden mace and plain leather saddle on wolf, no mount barding. Bear simple iron short sword and round wooden shield; fox plain twin iron short swords; rabbit plain wooden bow and small quiver; badger tall wooden plank shield edged in iron; raccoon small rectangular natural-linen flag on wood pole. Remove gold armor, jeweled fittings, elaborate capes, glowing magic, heraldic sun symbols. Humble well-made practical gear, NOT torn dirty rags. Preserve art quality while reducing equipment complexity.
```

### party-portraits-trained-v2.png

Saved: `public/assets/images/party-portraits-trained-v2.png` (1536×1024, three columns / two rows).
Reference/edit target: `public/assets/images/party-atlas.webp`.
Initial source: `exec-9ec1fa7e-e7d7-4ab9-aba1-6cdfde1feec5.png` in the session generated-images directory (retained, superseded after boundary checks).
Final source: `exec-f1b1ac0c-f5b9-4174-870c-b5eb0d424dba.png` (1536×1024). This final edit is the file installed in the project.

Final padding correction prompt (initial generation prompt follows):

```text
Use case: precise-object-edit. Fix only the padding of this six-character 3-column by 2-row portrait atlas. The hero's mace at the top and the flag pole tip are touching/crossing the cell edges. Repaint the missing tips completely. Preserve the exact trained outfits, faces, species, right-facing poses, painterly fur texture, leather/metal details and lighting of all six characters. On a landscape 1536x1024 transparent canvas, reserve six precise 512x512 cells. Make each entire character (including mount, all weapons, ears, flag and cape) fit inside the INNER 440x440 rectangle of its own cell, giving at least 36px fully transparent margin on every side of each cell. Clearly separate all rows/columns with wide empty gutters. ALL artwork must stay away from the outer image boundary and all internal cell boundaries. Do not enlarge heads or flatten textures when fitting them. Complete every mace spike, ear, boot, sword and flag tip; nothing clipped. GENUINE TRANSPARENT alpha background, no colored matte, no floor, no shadows, no text, no grid lines. Keep three columns and two rows with original character ordering. Do not alter equipment rank or add gold ornament.
```

```text
Use case: precise-object-edit. Asset: high fidelity 2D game character portrait atlas for Dawnleaf Brigade. Image 1 is the edit target and definitive painterly style reference. Change equipment ONLY, preserve species, face, realistic fluffy fur detail, body proportions, hand-painted dimensional shading, crisp delicate outlines, lighting, right-facing three-quarter pose, full body and mount, exactly THREE equal columns by TWO equal rows (six characters) and character order. Output landscape 1536x1024 or larger. Each character occupies most of its 512x512 cell with transparent gutters, no clipping, all feet and weapons visible. GENUINELY TRANSPARENT alpha background, no checkerboard painted in, no colored matte, no ground shadows or border, no text. Do NOT simplify to flat cartoon/cell-shaded art or chibi, do not shrink characters to tiny animation frames. Detailed fur, cloth weave, leather stitching and subtle metal reflections have the SAME premium illustration quality as Image 1. Top row corgi hero riding large fluffy white wolf, bear shield swordsman, fox twin swordsman. Bottom row rabbit archer, badger tower-shield guardian, raccoon standard bearer. Equipment trained rank: well-fitted silver iron breastplates/shoulders over teal leather tunics, short blue-teal capes and scarves, brown leather belts/boots. Hero iron-headed mace and short blue saddlecloth on white wolf, no full mount plate. Bear round blue wood shield with plain iron rim; fox twin steel swords and light shoulder armor; rabbit fitted green hood leather vest with iron bracers; badger tall blue shield with plain iron edges; raccoon medium blue banner with simple white leaf insignia. No elaborate gold filigree, jeweled fittings, huge capes or glowing magic. Clearly intermediate gear, premium art identical in fidelity to original.
```
