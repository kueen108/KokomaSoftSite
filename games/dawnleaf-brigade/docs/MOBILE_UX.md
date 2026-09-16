# Mobile play

The mobile interface uses native CSS pixels, independently of Phaser's 1280×720 simulation. Browser bars reducing the visible height must not shrink text and controls. `visualViewport` resize/scroll events update the UI and canvas; safe-area padding keeps controls away from notches and home indicators.

## Player experience

- Tap ⛶ to request fullscreen directly from a user gesture. Exit uses the same button. Landscape locking is optional and a rejected lock does not prevent playing.
- Unsupported or denied fullscreen opens localized home-screen guidance. On iPhone, use Safari's Add to Home Screen and enable Open as Web App. Websites cannot promise to remove OS-owned bars. No offline mode is claimed.
- Movement and attack have separate thumb zones and support simultaneous holds. Cancellation, blur and viewport changes release held controls.
- Summon cards swipe horizontally; all eight units remain available. Portrait stacks the cards above the controls and follows a closer visible camera region instead of shrinking the landscape screen.
- Vital values and costs use at least 14px; main text and instructions use 16px or more. Interactive buttons have a 44px minimum target.
- Equipment, aura, map, sound and touch instructions are available in pause. Information dialogs preserve the previous pause state.
- Menus, workshop and results use native layouts with scrolling when necessary, not a scaled desktop overlay.

## Repeatable checks

Run `npm run dev`, then `npm run test:mobile-ux`. Results and screenshots are written to `artifacts/runtime/mobile-ux/` (ignored by Git).

The browser suite covers 844×390, 844×300, 667×280, 390×844, 360×640 and 932×430, with one of the six supported languages per viewport. It checks menu/workshop/stage/battle/result targets, text sizes, all eight unit explanations, simultaneous touch, cancellation, rotation at the far battlefield, pause preservation, fullscreen enter/exit, unsupported fallback, desktop restoration and manifest/icon URLs. Result-screen navigation uses a controlled defeat fixture; it is not proof of winning a campaign.

`npm test`, `npm run lint` and `npm run build` cover unit/catalog integrity and compilation. `tests/ui/MobileViewport.test.ts` covers aspect ratio and fullscreen rejection behavior. The site's `scripts/verify-dawnleaf.mjs` separately checks built subpath URLs, supported locales and English fallback, asset loading and actual battle entry.

These are automated Chrome browser checks, not physical iPhone/Android device certification. Device-specific browser chrome, OS gestures and home-screen installation should be checked on the target phone; code does not assume fullscreen API support.

## Platform references

- [Fullscreen request and user activation](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
- [WebKit home-screen web apps](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [Apple home-screen web app guide](https://support.apple.com/en-me/guide/iphone/iphea86e5236/ios)

## App icon provenance

`public/app-icon.svg` is original code-drawn leaf/shield artwork for this project. `scripts/build-app-icons.mjs` renders it into the 192px and 512px PNG manifest icons. No external artwork was used for these icons.
