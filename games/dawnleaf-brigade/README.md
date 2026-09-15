# Dawnleaf Brigade

Source snapshot from the PaladogWeb workspace, including six-language localization, Dawnleaf Brigade branding, growth/balance improvements and native-resolution rank portraits (2026-09-15).

Public URL: https://www.kokomasoft.com/games/dawnleaf-brigade/

The site build installs the pinned game dependencies with `npm ci`, builds this source for `/games/dawnleaf-brigade/`, then runs Astro. Output under the site's `public/games/dawnleaf-brigade/` is generated and ignored by Git; only this game's own output directory is cleared by Vite. No other site assets or Worker routes are replaced.

From the site root:

```sh
npm run build
npm --prefix games/dawnleaf-brigade test
```

To develop the game separately, run `npm ci` and `npm run dev` here. Keep the trailing slash on the public game URL so relative Phaser image/audio requests resolve inside the game directory. CSS/font URLs are handled by Vite's base; dynamically generated stage backgrounds use `import.meta.env.BASE_URL`.

The game supports English, Korean, Japanese, Simplified Chinese, French and Spanish; unsupported browser languages fall back to English. Progress uses browser localStorage and is origin-specific: localhost progress does not automatically transfer to www.kokomasoft.com. Internal legacy texture/save identifiers are retained for compatibility.

Asset provenance is in `public/assets/LICENSES.md`; artwork prompt records are in `docs/`. No API keys, user saves, build caches, node_modules or test artifacts are included.
