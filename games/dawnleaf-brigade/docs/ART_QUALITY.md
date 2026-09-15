# Rank artwork quality correction

## Reproduced regression

The menu reserves a 475×475 CSS-pixel hero area. `GrowthArt.ts` previously exported `idle.canvas.toDataURL()` after rasterizing a character to roughly 100px high for combat. That same tiny raster was enlarged in the menu and roster. The elite primary-party portraits still used the much larger original atlas, so the quality difference was especially obvious between ranks. The six-by-six growth pose sheets also offered substantially fewer source pixels per portrait than the original three-by-two portrait atlas.

Before screenshot: `artifacts/runtime/art-quality/before-menu.png`.

## Correction

- Separate `PortraitArt.ts` from gameplay texture creation. Native source crop → portrait; there is no intermediate combat-sized raster and no artificial upscale/sharpen pass.
- New novice/trained primary-party portraits use the original elite atlas as the art-style and identity reference. Simple clothes remain detailed cloth/leather/fur rather than a low-detail substitute.
- Dedicated portraits for the owl, deer and wolf in all three ranks. The first draft had insufficient row gutters and was rejected; a layout-only correction keeps weapons and antlers within their cells.
- Original elite primary-party source remains unchanged, but uses the same native-crop/contain path for consistent framing. Transparent edge padding is retained.
- If a dedicated asset cannot load, retain a native-source crop fallback, never a shrunken gameplay canvas.
- Combat atlas resampling uses `imageSmoothingQuality = 'high'` consistently across ranks. Existing animation frame selection, rank texture keys, physics bodies, foot anchors, growth stats and saves are unchanged. This correction does **not** add new animation frames or claim to restore detail absent from an old animation source.

Generated asset provenance and exact prompts: [ART_QUALITY_PROMPTS.md](ART_QUALITY_PROMPTS.md). The original generated files and old gameplay assets are retained.

## Repeatable checks

`npm run test:art-quality` uses isolated Chrome contexts at 1280×720 and 844×390, with device scale factor 2. It reads the **actual displayed DOM background images**, verifies all three dedicated atlases loaded (no silent fallback), native portrait dimensions, nonempty transparent alpha, and different image hashes for each of the nine actors across three ranks. Hashes establish different artwork, not subjective quality; screenshots/contact sheets are inspected separately.

- Report: `artifacts/runtime/art-quality/report.json`
- Before/after menu and workshop captures: same directory
- All 27 portraits: `artifacts/runtime/art-quality/portraits.html` and `portraits.png`
- `npm run test:growth`: six levels × desktop/mobile; rank identity during movement/attack/hurt/guard, hitbox and feet invariants, actual HP/damage checks.
- Unit tests include native 1:1 copies, missing-asset fallback retention and bounded alpha padding.

Browser viewport/DPR checks do not constitute testing on a physical phone. These portraits target the existing CSS size and original artwork quality; a 2× DPR capture does not mean the source artwork itself is 2× retina resolution.

## Verified result (2026-09-15)

- `test:art-quality`: PASS, six viewport/rank fixtures, 27 distinct portraits; native crop heights 352–491px. All silhouettes have transparent crop edges. Dedicated assets loaded in all cases.
- Actual hero crop sizes: novice 471×486, trained 453×488, elite 445×477. The 475×475 menu no longer magnifies a ~100px combat raster.
- Inspected the complete 27-portrait contact sheet, desktop novice/trained menus, mobile workshop, and combat captures. Rank equipment remains distinct; fine outlines/fur/material shading are retained across ranks.
- `test:visual-ui`: PASS, desktop/mobile layout and contextual popup/focus/pause checks.
- Final `test:growth` rerun: PASS, all 12 level/viewport fixtures × nine actors, including motion rank identity, feet/body invariants and actual HP/damage checks.
- `build`, `lint`, unit tests: PASS, 515 tests in 23 files. Vite still emits the existing large-bundle warning; this is not a build failure.
- The same-size/DPR before-after comparison is `artifacts/runtime/art-quality/comparison.html` (both menu captures 1280×720, DPR 1).

The first quality-script attempt queried the roster before the scene transition completed; it now waits for the actual roster. A subsequent strict edge check caught the trained draft's crowded cell boundaries. That draft was replaced, and native cropping now finds and bisects transparent gutters instead of assuming exact gridlines. Acceptance numbers above are from the corrected assets and rerun, not those failed drafts.
