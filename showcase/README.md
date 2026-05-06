# Unified AV Showcase

A single-page, zero-build prototype that stitches the existing Onboarding and Driving prototypes into one presentation-ready narrative for the AeroDrive autonomous vehicle. The Showcase is designed for live industry demos: start at the Intro, step linearly through the story, or jump to any Step via the persistent Timeline.

## Runtime contract: no build step

The Showcase is plain HTML, CSS, and JavaScript ES modules. Open `index.html` directly in a modern browser, or serve this directory over any static file server (`python3 -m http.server`, `npx serve`, GitHub Pages). There is no bundler, no transpiler, and no runtime dependency beyond the browser and the Google Fonts / Phosphor CDN links in `index.html`.

`showcase/package.json` exists only for **development tooling** (test runner). It is never loaded by the browser and is not required to run the demo.

## Project structure

```
showcase/
├── index.html                     Single entry point
├── package.json                   Dev-only: vitest + fast-check + jsdom
├── vitest.config.js               Test runner config (jsdom env)
├── README.md
├── css/
│   ├── tokens.css                 Design tokens (colors, type, spacing, motion)
│   ├── base.css                   Reset, typography, focus rings
│   ├── layout.css                 Dual-display grid + timeline placement
│   └── components.css             Buttons, cards, alerts, timeline nodes
├── js/
│   ├── main.js                    Boot: theme → router → controller → modules → first render
│   ├── core/
│   │   ├── event-bus.js           Tiny pub/sub (on/off/emit)
│   │   ├── stage-controller.js    Owns activeIndex + Trust_Moment accounting
│   │   ├── state-router.js        Hash ↔ Step index
│   │   ├── theme-system.js        Applies light-mode tokens + reduced-motion
│   │   ├── animation-controller.js Cross-fade cluster + tablet in one rAF
│   │   ├── timeline.js            Persistent skippable nav
│   │   ├── cluster-host.js        Dashboard_Cluster render surface
│   │   └── tablet-host.js         Infotainment_Tablet render surface
│   ├── steps/
│   │   └── registry.js            Canonical ordered Step list (14 entries)
│   └── modules/
│       ├── intro.js               Intro Stage renderers
│       ├── onboarding.js          6 onboarding Step renderers
│       ├── driving.js             3 driving scenario renderers
│       ├── riding.js              3 riding scenario renderers
│       └── summary.js             Closing recap renderer
├── assets/                        Images and illustrations (copied in, never referenced via ../)
└── tests/
    ├── properties/                fast-check property-based tests
    ├── examples/                  Unit tests for specific examples
    ├── smoke/                     End-to-end smoke tests
    └── fixtures/                  Shared test data
```

## Run the Showcase

Option 1 — open directly:

```sh
open showcase/index.html
```

Option 2 — serve statically (preferred; ES modules load over HTTPS/HTTP, not `file://` in every browser):

```sh
cd showcase
python3 -m http.server 8080
# open http://localhost:8080
```

## Run the dev tests

```sh
cd showcase
npm install
npm test
```

This runs `vitest --run` with the `jsdom` environment against every `tests/**/*.test.js` file. Property-based tests use `fast-check` with a minimum of `numRuns: 100` per property.

## Relationship to existing prototypes

The existing prototypes at the workspace root (`index.html`, `script.js`, `style.css`, `steps/`) and in `driving_prototype/` remain **untouched**. They continue to load and demo independently. The Showcase copies any reused assets into `showcase/assets/` rather than reaching back out with `../` — the Showcase folder is a self-contained unit.
