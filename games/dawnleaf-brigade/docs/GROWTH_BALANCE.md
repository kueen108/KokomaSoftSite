# Growth and balance implementation audit

Status: implementation and verification complete. See [GROWTH_ACCEPTANCE.md](GROWTH_ACCEPTANCE.md) for the final requirement-by-requirement audit and measured limits. The work log below is chronological; earlier pending items and pre-fix reports are superseded by that audit.

## Player experience

- Lumi and all eight recruitable allies begin in visibly modest clothes and equipment.
- Six permanent growth levels (displayed as Lv.1–6) have monotonically increasing combat stats and visible rank changes. Novice, trained and elite silhouettes must differ in actual clothing; recolouring alone is insufficient.
- Lumi begins with no aura: no ring, particles, buffs or enemy debuffs. Purchasing growth unlocks and enlarges the aura, improves attack and health, and upgrades the outfit.
- The workshop shows current/next level, appearance, stats, cost and stage requirement before purchase. The actual battle sprites and menu portraits agree with the purchased level.
- Save/reload retains growth and equipment. Older saves remain readable. Invalid levels, insufficient gold and max-level purchases cannot corrupt progression or charge gold.
- All new player-facing messages support the existing six languages and English fallback.

## Balance evidence required

- Record the current 12-stage, earned-reward campaign before tuning.
- Re-run from an empty save using only earned currency; record purchases, battle duration, hero/base HP, unit losses, casts and outcome per stage.
- Compare realistic input cadences, mixed and specialised armies, defensive positioning, reckless play and no input. Do not equate a frame-perfect bot win with approachable difficulty.
- Verify early encounters without an aura, each region's difficulty transition, hold/hunt/siege objectives, boss and survival. Normal should reward ordinary mixed-army play; idle play should fail. Story and Veteran must remain meaningfully easier/harder.
- Verify upgrades materially improve survival or clear efficiency without making all strategic choices irrelevant.

## Visual and technical gates

- Capture novice/intermediate/elite side-by-side examples of all nine friendly characters and their movement, attack and reaction states in the real game.
- Inspect desktop and mobile battle, workshop, growth preview and all locale layouts.
- No equipped sprite may switch back to an old rank when walking, attacking, taking damage or guarding. Hitboxes and foot anchors must remain stable.
- No aura effect or benefit at Lumi level zero, including exact-overlap edge cases.
- Tests, build and lint pass; browser console remains clean. Check pause/resume, input, progression save and bounded actor/effect counts.
- Document measured results and remaining limitations. Commercial-quality claims require the full evidence above; automated runs do not replace physical-device or human playtesting.

## Work log

- Inspected current growth: allies increase stats only; Lumi has four aura tiers but starts with radius 220, +50% allied attack and −50% enemy attack. Existing art begins in ornate armour. These contradict the requested progression.
- Started fresh-save campaign baseline and novice sprite production using the built-in image generation tool.
- Implemented six Lumi levels using the compatible `hero.auraLevel` save field (0–5), health +12% and attack +22% per level. Aura radius is now 0/145/190/235/280/325; level zero has neutral modifiers and no drawn ring or overlap membership.
- Generated and integrated novice/trained costumes for all nine friendly characters. Existing elite art remains the third outfit tier. Runtime extraction retains alpha; all motion families retain the chosen rank and original physics dimensions. Prompt/provenance: `GROWTH_ART_PROMPTS.md`.
- Workshop now previews current/next appearance and combat stats; menu, roster and battle portraits follow the saved level. Low-level Lumi aura no longer overrides a stronger banner buff.
- Baseline archived in `artifacts/runtime/expedition-before-growth.json`. Initial new-growth earned campaign passed all 12 stages (`expedition-growth-first-pass.json`), with 73–166 second clears. No claim that this alone proves balance.
- Visual fixture audit passed 12 viewport-level combinations (two viewports × six levels), all nine actors × five motion states: `artifacts/runtime/growth/report.json`. Desktop novice/trained/elite combat and desktop/mobile workshop and elite combat screenshots were visually inspected. This audit does not prove earned progression.
- English/French desktop/mobile runtime localization passed 268 screen/popup checks after the growth UI integration. Unit suite reached 508 passing tests and production build passed. Phaser bundle size warning remains; performance verification still required.
- Cadence proxy (600 ms decisions, 1200 ms summons) cleared 12 earned stages. Slower proxy (1200/2400 ms) cleared 11, failed stage 12 in one run. Replaying stage 12 also produced wins, exposing native-frame scheduling variation in the harness. The harness now stops at the paused briefing boundary and asserts elapsed time zero, records hero damage traces and supports action-phase offsets. Repeated deterministic late-game/difficulty/army comparisons remain required before tuning/acceptance.
- Subsequent full six-language plus unsupported-locale desktop/mobile audit passed 938 checks. Updated expedition-features audit passed purchase/equip/reload, six aura tiers, actual growth-scaled projectile damage/health, healing, explosions, piercing, frost and paused aura animation. Polish audit passed difficulty settings, boss multipliers/pulse, reduced effects, modal pause, target caps and CDP multitouch.
- **Important balance root cause found:** hit-effect yoyo tweens wrote actor `x`, restoring old coordinates during player retreat and AI movement. Phaser TweenManager advances from `Date.now()`, so accelerated battle results also depended on real machine timing. Removed positional hit tweens; simulation-clock hurt/guard art still supplies recoil, with flash/damage numbers unchanged. A new browser regression asserts no actor-position tweens and immediate 52px retreat over 200ms after a hit. All earlier accelerated balance results must be revalidated after this fix.
- After the fix, the slow-input stage-12 replay won in 157s. Full post-fix campaign, difficulty and policy runs remain outstanding.
- A pre-fix reckless forward-rush with continuous fire and mixed summons won faster than the defensive policy (108s, minimum HP about 60). Do not silently turn that failed negative-control assertion into a pass. Inspect hero/enemy overlap and positioning: hero currently can walk through enemy formations, while ordinary retreat was impaired by the fixed cosmetic tween. Decide and implement fair frontline blocking if needed, then repeat controls and campaign tests.
- Post-fix reckless rush still won in 122s (minimum HP about 110). The issue is not only the old hit tween: current hero/enemy overlaps engage combat but do not block crossing. A fair forward-only frontline constraint should preserve free retreat, handle swept movement and enemies spawning nearby, and include a visible braced pose plus localized help. This is the next gameplay change; it is not implemented yet.
- Lossless WebP encoding was measured for the three new atlases in `artifacts/runtime/*-lossless.webp` (about 4.6 MB combined versus about 6.1 MB PNG). These are encoding experiments, not loaded runtime assets. Source PNGs remain unchanged.

## Acceptance follow-up history

### Frontline follow-up (2026-09-15)

- Implemented swept forward-only hero blocking at living enemy/boss body edges, without teleporting on overlaps or restricting retreat. Added a guarded pose and six-language help.
- Four pure positioning tests cover free movement, tunnelling, nearest edge, overlap and retreat; total unit suite is now 512 passing tests.
- Post-fix policy matrix passes: reckless charge loses at 28s; idle loses in all four regions; mixed armies clear stage 12 on Story/Normal/Veteran in 141/157/164s. Single-type tanker/mage armies remain viable but have different time/health costs. `artifacts/runtime/polish-balance.json`.
- The full slow-input earned campaign is being rerun after both cosmetic-movement and frontline fixes; earlier runs must not be substituted for its result.

- Inspect updated unit current/next previews, all six languages and rank transitions; confirm purchase/reload/max/cost gates through the UI.
- Consider visible refinements between the two levels sharing each outfit tier; current costume changes occur at Lv.3 and Lv.5, while every Lumi level changes aura/stats.
- Finish deterministic slow-input campaign and phase variation tests, idle/reckless/specialised army tests, difficulty separation, boss/survival and upgrade-benefit comparisons. Tune measured weak points rather than relaxing assertions.
- Re-run full browser growth/localization/pause/input suites after final edits; inspect all elite/mobile motion captures, performance and resource bounds.
- Finish final requirement-by-requirement audit. Goal remains active; commercial-quality completion is not yet established.
