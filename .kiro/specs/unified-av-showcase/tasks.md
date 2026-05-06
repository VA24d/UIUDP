# Implementation Plan: Unified AV Showcase

## Overview

Build the Showcase_App as a vanilla HTML/CSS/JS prototype inside a new isolated `showcase/` folder. Work bottom-up: primitives (tokens, bus, registry) first, then state (router, controller), then rendering surfaces (hosts, animation, timeline, keyboard), then the five stage modules (intro → onboarding → driving → riding → summary), then cross-cutting invariants (contrast, dual-display sync), and finally boot/wiring, assets, smoke tests, and polish.

Property-based tests (PBT) are required (no `*`) because the design mandates PBT coverage for the 32 Correctness Properties. Example, unit, and integration tests are marked optional with `*`. Every PBT file uses the tag `// Feature: unified-av-showcase, Property {n}: {title}` on its top-level test and runs with `fast-check` using `{ numRuns: 100 }` minimum.

Implementation language: **JavaScript (vanilla ES modules)** as specified in the design. Test tooling (`fast-check`, `vitest`, `jsdom`) lives in `showcase/package.json` as `devDependencies` only — the Showcase itself still loads with no build step.

## Tasks

- [x] 1. Scaffold the Showcase_Folder and project shell
  - Create `showcase/` directory at the workspace root as the isolated home for the Showcase_App.
  - Add `showcase/index.html` with `<!doctype html>`, `<link rel="stylesheet" href="css/tokens.css">`, `<link rel="stylesheet" href="css/base.css">`, `<link rel="stylesheet" href="css/layout.css">`, `<link rel="stylesheet" href="css/components.css">`, `<script type="module" src="js/main.js">`, and the static DOM skeleton (`.stage` grid with `.cluster`, `.tablet`, `.timeline` containers plus a visually hidden `<div role="status" aria-live="polite">` for screen-reader announcements).
  - Create the full folder tree from the design (`css/`, `js/core/`, `js/steps/`, `js/modules/`, `assets/`, `tests/properties/`, `tests/examples/`, `tests/smoke/`) with empty module files (`event-bus.js`, `stage-controller.js`, `state-router.js`, `theme-system.js`, `animation-controller.js`, `timeline.js`, `cluster-host.js`, `tablet-host.js`, `steps/registry.js`, `modules/intro.js`, `modules/onboarding.js`, `modules/driving.js`, `modules/riding.js`, `modules/summary.js`, `js/main.js`) each containing a placeholder export.
  - Create `showcase/package.json` declaring `"private": true`, `"type": "module"`, and `devDependencies` only for `fast-check`, `vitest`, `jsdom`; add a `test` script running `vitest --run`.
  - Create `showcase/README.md` explaining the zero-build runtime contract, how to open `index.html` directly, and how to run `npm install && npm test` for dev tooling.
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Author design-token and base CSS
  - [x] 2.1 Write `showcase/css/tokens.css` with `:root.theme-light` declaring every color, type, spacing, elevation, and motion token listed in the design token tables (`--color-surface-page`, `--color-surface-elevated`, `--color-surface-subtle`, `--color-border-subtle`, `--color-border-strong`, `--color-text-primary`, `--color-text-secondary`, `--color-text-on-accent`, `--color-accent-primary`, `--color-accent-soft`, `--color-success`, `--color-warning`, `--color-critical`, `--color-focus-ring`, `--font-display`, `--font-heading`, `--font-subhead`, `--font-body`, `--font-caption`, `--font-mono`, `--sp-1` through `--sp-8`, `--elevation-0` through `--elevation-3`, `--motion-dur-micro`, `--motion-dur-step`, `--motion-dur-stage`, `--motion-ease-forward`, `--motion-ease-backward`, `--motion-ease-subtle`). Include the `@media (prefers-reduced-motion: reduce)` block that overrides all three motion durations to `0ms` and applies `animation-duration: 0s !important; transition-duration: 0s !important;` globally.
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 7.6_
  - [x] 2.2 Write `showcase/css/base.css` with the reset, `body` styling on `--color-surface-page` with `--color-text-primary`, the Inter font import comment, and a global `:focus-visible` rule (`outline: 3px solid var(--color-focus-ring); outline-offset: 2px`) that never uses `outline: none`.
    - _Requirements: 6.2, 6.5_

- [x] 3. Implement the event bus utility
  - [x] 3.1 Write `showcase/js/core/event-bus.js` exporting `createBus()` with `on`, `off`, `emit` backed by `Map<string, Set<fn>>`. `on` returns an unsubscribe function. `emit` must swallow listener exceptions and log them so one bad listener cannot break the others.
    - _Requirements: 5.2, 5.4, 5.5 (enables dual-display coordination)_
  - [ ] 3.2* Write unit test `showcase/tests/examples/event-bus.test.js` covering subscribe/emit, unsubscribe, multiple listeners, and listener-throws isolation.

- [x] 4. Implement the Step registry and descriptor contract
  - [x] 4.1 Write `showcase/js/steps/registry.js` exporting the canonical `STEPS` array built from placeholder descriptors for all 14 steps (intro.welcome, onboarding.profile/comfort/locations/drive-explained/takeover-drill/preferences, driving.unmapped-zone/fatigue/battery, riding.environment/maneuver/productive-time, summary.recap). Each descriptor carries `id`, `globalIndex`, `stage`, `slug`, `label`, `title`, `trustMoments: []`, optional `timedEvents`, and stub `renderCluster` / `renderTablet` functions. Also export a `buildRegistry(descriptors)` builder that assigns `globalIndex = i` in input order and asserts uniqueness of `id` and of `(stage, slug)` at boot, throwing on duplicates.
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Write PBT `showcase/tests/properties/registry.test.js`.
    - **Property 2: Registry index bijection** — for any non-empty input list, `buildRegistry(input)[i].globalIndex === i` and the mapping `i ↔ input[i]` is a bijection preserving order.
    - **Property 20: Trust-moment minimum per non-boundary step** — for every `s` with `s.stage ∈ {onboarding, driving, riding}`, `s.trustMoments.length ≥ 1` (verified against the final `STEPS` registry after the stage modules populate it; before then, use a stub fixture).
    - Tag each top-level test with `// Feature: unified-av-showcase, Property {n}: {title}`.
    - _Requirements: 2.2, 8.7, 9.7, 10.6_

- [x] 5. Implement the State_Router
  - [x] 5.1 Write `showcase/js/core/state-router.js` exporting `createStateRouter({ steps, onIndexFromHash })` with `encode(index) → '#/' + stage + '/' + slug`, `decode(hash) → { ok: true, index } | { ok: false, reason: 'malformed'|'unknown', fragment }`, and `write(index)` using `history.replaceState`. Register a `hashchange` listener that calls `onIndexFromHash(decode(location.hash))`.
    - _Requirements: 13.1, 13.2, 13.4, 13.5_
  - [x] 5.2 Write PBT `showcase/tests/properties/router.test.js`.
    - **Property 28: Hash round-trip** — for any valid `i ∈ [0, lastIndex]`, `decode(encode(i)).ok === true` and `decode(encode(i)).index === i`; for any string `s` where `decode(s).ok === true`, `encode(decode(s).index) === s`.
    - Use `fc.integer({ min: 0, max: steps.length - 1 })` and a shrinkable arbitrary for arbitrary hash strings to verify the reverse direction.
    - Tag: `// Feature: unified-av-showcase, Property 28: Hash round-trip`.
    - _Requirements: 13.5_

- [x] 6. Implement the Stage_Controller
  - [x] 6.1 Write `showcase/js/core/stage-controller.js` exporting `createStageController({ bus, steps, router })` that owns `activeIndex`, `countedTrustSteps: Set<number>`, and `trustCount`. Expose `getActiveIndex`, `getTrustCount`, `getCountedSteps`, `advance(src)`, `retreat(src)`, `goTo(i, src)`. All mutations route through a single `setActive(target, { source })` that clamps to `[0, steps.length - 1]`, computes `direction` as `'forward' | 'backward' | 'skip'`, emits `stepWillChange`, updates the set-based Trust_Moment accounting (add every newly-passed index to `countedTrustSteps` only on forward or forward-skip, never on backward), calls `router.write(clamped)`, and emits `stepDidChange` with `countedTrustCount`.
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 12.1, 12.2, 12.6, 14.4, 14.5, 15.1_
  - [x] 6.2 Write PBT `showcase/tests/properties/controller.test.js`.
    - **Property 3: Navigation boundary no-op** — for any source `src`, `advance(src)` at `activeIndex === lastIndex` is a no-op with `changed === false`; `retreat(src)` at `activeIndex === 0` is a no-op with `changed === false`.
    - **Property 4: Navigation clamp and step semantics** — for any `i` and any `src`, `advance(src)` yields `min(i+1, lastIndex)` and `retreat(src)` yields `max(i-1, 0)`.
    - **Property 29: Trust-count correctness and monotonicity** — for arbitrary action sequences, the final `trustCount` equals the sum of `trustMoments.length` over every index ever reached by a forward or forward-skip transition, and the sequence of `trustCount` samples is monotonically non-decreasing across the run.
    - **Property 30: Reachability via advance and retreat only** — for any pair `(A, B)` of indices, there exists a finite `advance`/`retreat` sequence from `A` that terminates at `B`.
    - Use `fc.array(fc.constantFrom('advance', 'retreat', 'goTo', ...), { maxLength: 30 })` for action sequences. Tag every top-level test with the property header format.
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 12.1, 12.2, 12.6, 14.4, 14.5, 15.1_
  - [ ] 6.3* Write `showcase/tests/examples/controller.test.js` covering the example transition `0 → 13 → 0` and verifying `trustCount` stays stable on the backward leg.
    - _Requirements: 14.5_

- [x] 7. Implement the Theme_System
  - Write `showcase/js/core/theme-system.js` exporting `applyTheme()` that adds `theme-light` to `document.documentElement` on boot. Detect `prefers-reduced-motion` once via `window.matchMedia('(prefers-reduced-motion: reduce)')`, cache `.matches`, and expose `isReducedMotion()` plus a `change` subscription so the Animation_Controller can observe updates.
  - _Requirements: 6.2, 7.6_

- [x] 8. Checkpoint — verify primitives are green
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Build the dual-display layout and hosts
  - [x] 9.1 Write `showcase/css/layout.css` with the `.stage` CSS grid (`grid-template-areas: "cluster tablet" / "timeline timeline"`), the stacked fallback below 1100px, and the shared surface framing (rounded corners, `--elevation-2`, 1px inset highlight, 2px continuous accent underline between cluster and tablet).
    - _Requirements: 5.1, 6.7_
  - [x] 9.2 Write `showcase/js/core/cluster-host.js` and `showcase/js/core/tablet-host.js`, each exporting `createHost({ root })` with `render(step)` (sets `data-step-id`, clears `innerHTML`, calls `step.renderCluster(host, step)` or `step.renderTablet(host, step)`), `beginExit(duration, easing)`, and `beginEnter(duration, easing)` that flip `.is-exiting` / `.is-entered` classes and the `--t` / `--e` custom properties.
    - _Requirements: 5.1, 5.3_
  - [x] 9.3 Write PBT `showcase/tests/properties/dual-display.test.js` (initial pass — add P1 and P11 in task 18).
    - **Property 10: Dual-host render in same animation frame** — after any controller action, within the first `requestAnimationFrame` callback after `stepDidChange`, both hosts' `data-step-id` attribute equals the new `step.id`.
    - Tag: `// Feature: unified-av-showcase, Property 10: Dual-host render in same animation frame`.
    - _Requirements: 5.2, 5.4_

- [x] 10. Implement the Animation_Controller
  - [x] 10.1 Write `showcase/js/core/animation-controller.js` exporting `createAnimationController({ bus, clusterHost, tabletHost, themeSystem })`. Subscribe to `stepDidChange`; on each change, cancel any in-flight transition, choose `400ms` for adjacent steps and `600ms` for skip transitions, pick `--motion-ease-forward` for forward/skip and `--motion-ease-backward` for backward, schedule a single-`requestAnimationFrame` cross-fade (`beginExit` on both hosts, then in the next rAF render both hosts and call `beginEnter`), fire `transitionComplete` via a `setTimeout(duration + 20)` guard, and short-circuit to an instant render + synchronous `transitionComplete` when reduced-motion is active. On any thrown error, run the `onFail` recovery: render both hosts synchronously and emit `transitionFailed` plus `transitionComplete`.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 15.3_
  - [x] 10.2 Write PBT `showcase/tests/properties/animation.test.js`.
    - **Property 13: Transition duration bound** — for any step change with reduced-motion off, the interval from `stepWillChange` to `transitionComplete` is `≤ 600ms` (use fake timers).
    - **Property 14: Skip transition is a single animation** — for any change with `|to − from| > 1`, exactly one `crossFade` invocation occurs between `stepWillChange` and `transitionComplete`.
    - **Property 16: Reduced-motion instant swap** — with `matchMedia` stubbed to `matches: true`, the interval from `stepWillChange` to `transitionComplete` is `0ms` and no CSS transition is started on either host.
    - **Property 17: In-flight animation cancellation** — for any two step changes `g1` then `g2` issued within one `--motion-dur-stage` window, after both settle, both hosts' `data-step-id` equals `steps[g2.toIndex].id`.
    - **Property 31: Transition failure recovery** — when `crossFade` throws, both hosts still end on the target `step.id` and a `transitionComplete` is emitted.
    - Tag every top-level test with the property header format.
    - _Requirements: 7.2, 7.4, 7.6, 7.7, 15.3_

- [x] 11. Build the Timeline component
  - [x] 11.1 Implement Timeline rendering and interaction in `showcase/js/core/timeline.js`.
    - Export `createTimeline({ bus, steps, controller, host })` that renders `<ol role="list" aria-label="Showcase timeline">` with one `<button class="tl-node" role="listitem">` per step, applying `.is-filled` for `i < activeIndex`, `.is-active` for `i === activeIndex`, and `.is-unfilled` for `i > activeIndex`; set `aria-current="step"` on the active node and `aria-label="${stage} — ${label}"` on every node. Render the adjacent `.tl-trust` block with `aria-live="polite"` showing `controller.getTrustCount()`. Wire click and Enter/Space to `controller.goTo(+btn.dataset.index, source)`. Re-render on `stepDidChange` and `transitionComplete`.
    - Add `.tl-node.is-unfilled`, `.is-filled`, `.is-active` styles to `showcase/css/components.css` using only tokens (no raw hex).
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 14.3_
  - [x] 11.2 Write PBT `showcase/tests/properties/timeline.test.js`.
    - **Property 5: Timeline visual state monotonicity** — for any `activeIndex N`, each node has exactly one of `is-filled`, `is-active`, `is-unfilled`, matching `i < N / i === N / i > N`.
    - **Property 6: Timeline node count equals step count** — the Timeline DOM contains exactly `steps.length` `button.tl-node` elements within the `list > listitem` hierarchy.
    - **Property 7: Timeline accessible name completeness** — every node's accessible name (via `aria-label`) contains both `step.stage` and `step.label` as substrings.
    - **Property 8: Timeline tab order matches registry order** — the DOM order of `.tl-node` equals registry order and every node has `tabindex >= 0`.
    - **Property 9 (click half): Node activation by click** — for any `(i, j)` and click method, clicking node `j` yields `controller.getActiveIndex() === j`.
    - Tag every top-level test with the property header format.
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.8_

- [x] 12. Wire global keyboard bindings and advance/retreat controls
  - [x] 12.1 Add a global `keydown` handler in `showcase/js/main.js` that maps ArrowRight → `controller.advance('arrow-key')`, ArrowLeft → `controller.retreat('arrow-key')`, and digits 1–5 → `controller.goTo(firstIndexOfStage(d), 'digit-key')`, suppressed when focus is inside a text input. Render primary advance and retreat buttons into a persistent `.nav` region on every step except the first (retreat hidden) and the last (advance replaced by an end-of-showcase indicator).
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 15.2_
  - [x] 12.2 Write PBT `showcase/tests/properties/keyboard.test.js`.
    - **Property 26: Digit-key stage jump** — for any digit `d ∈ {1..5}`, after dispatching a `keydown` of that digit, `controller.getActiveIndex()` equals the first `globalIndex` of the `d`-th stage in `[intro, onboarding, driving, riding, summary]`.
    - **Property 9 (keyboard half): Node activation by Enter or Space** — for any `(i, j)` and activation key `∈ {Enter, Space}`, dispatching the key on timeline node `j` yields `controller.getActiveIndex() === j`.
    - Tag every top-level test with the property header format.
    - _Requirements: 12.3, 4.5, 4.7_
  - [x] 12.3 Write PBT entries for **Property 27: Advance/retreat control presence** inside `showcase/tests/properties/keyboard.test.js` (or a dedicated `controls.test.js` if the file grows): for any step with `globalIndex < lastIndex`, the rendered page contains a visible advance control; for any step with `globalIndex > 0`, the rendered page contains a visible retreat control.
    - Tag: `// Feature: unified-av-showcase, Property 27: Advance/retreat control presence`.
    - _Requirements: 12.4, 12.5_

- [x] 13. Implement the Intro_Module
  - [x] 13.1 Write `showcase/js/modules/intro.js` with the `intro.welcome` Step descriptor (index 0): `renderTablet` produces the `H1 --font-display` AeroDrive delivery headline, the `--font-subhead` research-goal subhead (verbatim from the requirements document), the hero `<img src="assets/hero-aerodrive.svg">` with an `onerror` handler that toggles a `.hero--missing` placeholder block of the same aspect ratio with visible alt text, and a primary `<button>` labeled "Begin onboarding" wired to `controller.advance('intro-cta')`. `renderCluster` renders a quiet "AERODRIVE — READY" status panel.
    - Wire the descriptor into `STEPS` via `registry.js`.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 14.1_
  - [ ] 13.2* Write `showcase/tests/examples/intro.test.js` asserting: headline names AeroDrive, subhead contains the research-goal sentence, CTA click calls `controller.advance`, and toggling the `<img>` `onerror` adds `.hero--missing` with alt text intact.
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [x] 14. Checkpoint — intro and primitives integrated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement the Onboarding_Module (6 steps)
  - [x] 15.1 Write `showcase/js/modules/onboarding.js` exporting six Step descriptors (profile, comfort, locations, drive-explained, takeover-drill, preferences). For each: `renderTablet` produces `s.title`, a one-sentence purpose paragraph, a labeled primary `role="button"` control (mic ring, interactive seat, slider group, carousel, "Grip wheel", preference cards), and at least one inline Trust_Moment marked with the shield icon. `renderCluster` produces the step-title status indicator, a 6-segment progress pip strip, and the contextual caption. On primary-action completion, render an `is-complete` confirmation pill for 350ms before calling `controller.advance()`. For the `takeover-drill` step, declare a `timedEvents` array of 10 1-second ticks and drive the countdown from a single `setInterval` whose ticks emit as `timedEvent` on the bus so both hosts listen.
    - Merge these descriptors into `STEPS` via `registry.js`.
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 14.2_
  - [x] 15.2 Write PBT `showcase/tests/properties/rendering.test.js` (create or extend).
    - **Property 18: Onboarding step render shape** — for every onboarding step `s`, after `renderCluster(s)` and `renderTablet(s)`, the Tablet subtree contains exactly one heading equal to `s.title`, one paragraph describing the purpose, and at least one `role="button"` primary control; the Cluster subtree contains a status element whose text includes `s.label`.
    - Tag: `// Feature: unified-av-showcase, Property 18: Onboarding step render shape`.
    - _Requirements: 8.2, 8.3_
  - [x] 15.3 Write PBT `showcase/tests/properties/voice.test.js`.
    - **Property 19: Voice steps also accept on-screen control** — for every onboarding step with `s.voice === true`, the Tablet subtree contains at least one `role="button"` whose activation invokes `controller.advance()`.
    - Tag: `// Feature: unified-av-showcase, Property 19: Voice steps also accept on-screen control`.
    - _Requirements: 8.6_
  - [ ] 15.4* Write `showcase/tests/examples/onboarding.test.js` covering: the 6 steps appear in order, the takeover-drill step renders a labeled countdown on both hosts, and the completion confirmation appears before `advance` fires.
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 16. Implement the Driving_Module (3 scenarios)
  - [x] 16.1 Write `showcase/js/modules/driving.js` with three descriptors ported from `driving_prototype/app.js`: `driving.unmapped-zone`, `driving.fatigue`, `driving.battery`. For each: `renderTablet` shows scenario title and a one-sentence autonomous-system intent; `renderCluster` shows speed (`--font-mono`), autonomy-level tag ("L4 ACTIVE"), and an alert-state pill whose background uses `--color-success` / `--color-warning` / `--color-critical`. Unmapped-zone: after 2s, both hosts render a takeover prompt ("TAKE OVER NOW" on cluster, reason + "Grip wheel" button on tablet). Fatigue: cycle three escalation levels every 4s with three visibly distinct alert-pill class lists. Battery: render two choice cards on the tablet with the "Reroute to nearest charger (recommended)" option marked default (`--color-accent-primary` outline) and auto-focused on entry.
    - Each descriptor declares at least one Trust_Moment per the design copy ("AeroDrive asks, it doesn't take", "System watches you watching the road", "Range math is shown, not hidden").
    - Merge descriptors into `STEPS` via `registry.js`.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 16.2 Extend `showcase/tests/properties/rendering.test.js` with Property 21.
    - **Property 21: Driving step render shape** — for every driving step `s`, the Tablet subtree contains a title matching `s.title` and a distinct element describing autonomous-system intent; the Cluster subtree contains a speed readout, autonomy-level tag, and alert-state pill.
    - Tag: `// Feature: unified-av-showcase, Property 21: Driving step render shape`.
    - _Requirements: 9.2, 9.3_
  - [x] 16.3 Write PBT `showcase/tests/properties/scenarios.test.js` (create) with Property 22.
    - **Property 22: Fatigue escalation levels are distinct** — for any two distinct levels `a, b ∈ {1,2,3}`, the class list of the cluster alert pill at level `a` differs from its class list at level `b` by at least one class.
    - Tag: `// Feature: unified-av-showcase, Property 22: Fatigue escalation levels are distinct`.
    - _Requirements: 9.5_
  - [ ] 16.4* Write `showcase/tests/examples/driving.test.js` asserting: exactly three driving steps in the canonical order, the takeover prompt appears simultaneously on both hosts at 2s, and the battery reroute choice labels the recommended option as default.
    - _Requirements: 9.1, 9.4, 9.6_

- [x] 17. Implement the Riding_Module (3 scenarios)
  - [x] 17.1 Write `showcase/js/modules/riding.js` with three descriptors: `riding.environment`, `riding.maneuver`, `riding.productive-time`. For each: `renderCluster` renders a `.cluster-passenger-pill` with text matching `/passenger/i`, continuing speed readout, and a muted alert state. `riding.environment`: `renderTablet` produces a 2×2 ambient status grid (weather, cabin temp, air quality dots, ambient light setting). `riding.maneuver`: declare `timedEvents: [{ id: 'maneuver', atMs: 3000 }]`, render the maneuver preview on the Tablet at step entry (t=0), subscribe the Cluster to the `timedEvent` and flash the maneuver banner on delivery. `riding.productive-time`: render a labeled in-ride activity surface (email/calendar/reading-list mock).
    - Each descriptor declares at least one Trust_Moment per design copy ("You see the turn before the car makes it", "Passenger mode shows, not just says, handover", "Your time is yours back").
    - Merge descriptors into `STEPS` via `registry.js`.
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - [x] 17.2 Extend `showcase/tests/properties/rendering.test.js` with Property 23 and extend `showcase/tests/properties/scenarios.test.js` with Property 24.
    - **Property 23: Riding passenger-mode indicator** — for every riding step, the rendered cluster subtree contains `.cluster-passenger-pill` whose text matches `/passenger/i`.
    - **Property 24: Maneuver preview lead time** — for the riding maneuver step, `tEvent − tPreview ≥ 3000ms` where `tPreview` is the tablet preview appearance and `tEvent` is the cluster banner appearance (use fake timers).
    - Tag both top-level tests with the property header format.
    - _Requirements: 10.2, 10.4_
  - [ ] 17.3* Write `showcase/tests/examples/riding.test.js` asserting: three riding steps are present, environment tablet shows the ambient 2×2 grid, and productive-time renders its labeled activity surface.
    - _Requirements: 10.1, 10.3, 10.5_

- [x] 18. Implement the Summary_Module
  - [x] 18.1 Write `showcase/js/modules/summary.js` with the `summary.recap` descriptor (index 13). `renderTablet` produces: an `H1 --font-display` restating the research goal; a grouped-by-stage list aggregating every `TrustMoment` declared across onboarding, driving, and riding step descriptors in registry order, each rendered with the shield icon; and a primary "Restart showcase" button wired to `controller.goTo(0, 'summary-restart')`. `renderCluster` shows a "COMPLETE" pill in `--color-success`. On this step, the global advance control is replaced by an end-of-showcase indicator element.
    - Merge the descriptor into `STEPS` via `registry.js`.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.6, 14.1_
  - [x] 18.2 Extend `showcase/tests/properties/scenarios.test.js` with Property 25.
    - **Property 25: Summary includes every trust moment** — for every `TrustMoment tm` declared by any step in the `STEPS` registry, after `renderTablet(summaryStep)` the Summary Tablet subtree contains an element whose text equals `tm.text`.
    - Tag: `// Feature: unified-av-showcase, Property 25: Summary includes every trust moment`.
    - _Requirements: 11.2_
  - [ ] 18.3* Write `showcase/tests/examples/summary.test.js` asserting: exactly one summary step at `lastIndex`, research-goal headline present, restart button resets the active index to 0, and an end-of-showcase indicator replaces the advance control.
    - _Requirements: 11.1, 11.3, 11.4, 12.6_

- [x] 19. Checkpoint — all stage modules integrated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Verify contrast compliance
  - [x] 20.1 Add a token manifest at `showcase/tests/fixtures/contrast-manifest.js` that enumerates every `(fg, bg)` token pair used by the design, tagged as `'body'` (must clear 4.5:1) or `'large'` (must clear 3.0:1) per Req 6.3/6.4.
  - [x] 20.2 Write PBT `showcase/tests/properties/contrast.test.js`.
    - **Property 12: Contrast ratio compliance** — for every manifest pair tagged `body`, the WCAG 2.1 relative-luminance ratio `contrast(fg, bg) ≥ 4.5`; for every pair tagged `large`, `≥ 3.0`.
    - Use `fc.constantFrom(...manifest)` so `fast-check` iterates across every declared pair and also reports a shrunk counterexample when a new token is added without clearing the bar.
    - Tag: `// Feature: unified-av-showcase, Property 12: Contrast ratio compliance`.
    - _Requirements: 6.3, 6.4_

- [x] 21. Add dual-display sync invariant tests
  - Extend `showcase/tests/properties/dual-display.test.js` with Property 1 and Property 11.
  - **Property 1: Dual-display step equality** — for any finite sequence of controller actions (arrow key, digit, click, hashchange, advance, retreat, goTo), after `stepDidChange` settles, `clusterHost.currentStepId === tabletHost.currentStepId === steps[controller.getActiveIndex()].id`.
  - **Property 11: Shared timed-event cross-host synchronization** — for any `timedEvent` emitted during an active step, the cluster listener and tablet listener delivery timestamps differ by `≤ 100ms` (measure with `performance.now()` on a jsdom harness with real timers; use `fc.sample` of step indices to exercise every timed-event step).
  - Tag both top-level tests with the property header format.
  - _Requirements: 2.3, 5.3, 5.5_

- [x] 22. Boot and wire everything in `main.js`
  - Implement `showcase/js/main.js` with the deterministic boot order: (1) `applyTheme()`; (2) build `STEPS` via `registry.js`; (3) create the event bus; (4) create `State_Router` with `onIndexFromHash` callback that, on malformed/unknown hash, calls `controller.goTo(0)` and renders the non-blocking hash-error toast; (5) create `Stage_Controller` with bus, steps, router; (6) create `Animation_Controller` with bus, hosts, theme; (7) mount `cluster-host` and `tablet-host` on `.cluster` / `.tablet`; (8) mount `Timeline` on `.timeline`; (9) attach the global keyboard handler and advance/retreat controls; (10) decode `location.hash` once; (11) call the first `controller.goTo(initialIndex, 'boot')`. Also wire the visually hidden `aria-live` status region and update it on every `stepDidChange` with `"{stage}, step {n} of {total}: {label}"`.
  - _Requirements: 1.2, 1.3, 3.6, 5.1, 5.2, 5.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 14.3, 15.2, 16.1_

- [x] 23. Populate `showcase/assets/`
  - Copy `bg.png`, `car.png`, and `seat.png` from the workspace root into `showcase/assets/` (do not reference the originals — Req 1.4 bars `../` back out).
  - Extract the inline map SVG from `driving_prototype/styles.css`'s weather-map layers and save as `showcase/assets/map-route.svg`.
  - Create `showcase/assets/hero-aerodrive.svg` as a lightweight placeholder illustration of the AeroDrive three-quarter view using simple SVG shapes on a transparent background; the `onerror` fallback in the intro handles absence gracefully but the file should exist in-repo.
  - (Optional) add local fallback copies under `showcase/assets/icons/` for the Phosphor icons used (check, warning-circle, steering-wheel, battery-warning, cloud-rain, eye-closed, compass, arrow-right).
  - _Requirements: 1.4, 1.5, 3.3, 3.4_

- [x] 24. Add smoke and integration tests
  - [ ] 24.1* Write `showcase/tests/smoke/structure.test.js` verifying the directory tree matches the design (`css/`, `js/core/`, `js/steps/`, `js/modules/`, `assets/`), `showcase/index.html` exists, and no file under `showcase/` references a path that escapes the folder (`../`).
    - _Requirements: 1.1, 1.2, 1.5_
  - [ ] 24.2* Write `showcase/tests/smoke/tokens.test.js` that parses `css/tokens.css` and all files in `css/components.css` / `css/layout.css`, asserting every declared token exists and that component CSS never contains raw hex colors, raw pixel spacing outside the scale, or raw `cubic-bezier(...)` literals.
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 7.3_
  - [ ] 24.3* Write `showcase/tests/smoke/boot.test.js` loading `index.html` in jsdom and asserting `<html>` has class `theme-light` after boot and the Intro_Screen is present on first paint.
    - _Requirements: 6.2, 16.1_
  - [x] 24.4 Write PBT `showcase/tests/smoke/perf.test.js` covering startup budget and render budget.
    - **Property 32: Per-step render budget** — on a mocked timing harness, the interval from `controller.setActive(i)` call to both hosts' `data-step-id` equaling the new step is `≤ 200ms` for any `i`.
    - Also assert, as a single non-property smoke check, that jsdom Intro render happens in `≤ 2s` (Req 16.1).
    - Tag: `// Feature: unified-av-showcase, Property 32: Per-step render budget`.
    - _Requirements: 16.1, 16.2_
  - [ ] 24.5* Write `showcase/tests/smoke/fps.test.js` that scripts an advance-through-all-14-steps pass under jsdom with a timer hook, samples inter-frame intervals via `performance.now()`, and asserts the mean frame interval is `≤ 20ms` (≥ 50 fps proxy, Req 16.3).
    - _Requirements: 16.3_
  - [ ] 24.6* Write `showcase/tests/examples/hash.test.js` booting with `location.hash = '#/bogus/slug'` and asserting the active index is set to 0 and the hash-error toast element is present and names the fragment.
    - _Requirements: 13.3_

- [x] 25. Final polish
  - [x] 25.1 Implement the Stage-entry Timeline flourish: on every `stepDidChange` where `steps[from].stage !== steps[to].stage`, the Timeline adds class `is-stage-enter` inside the next rAF and removes it after 600ms. Accompany with a subtle accent wash animation in `css/components.css` gated on `--motion-dur-stage` so reduced-motion zeros it out.
    - _Requirements: 7.5_
  - [x] 25.2 Extend `showcase/tests/properties/animation.test.js` with Property 15.
    - **Property 15: Stage-entry animation on stage crossings** — for any step change where `from.stage !== to.stage`, the Timeline receives class `is-stage-enter` within the rAF frame after `stepDidChange` and the class is removed after `600ms`.
    - Tag: `// Feature: unified-av-showcase, Property 15: Stage-entry animation on stage crossings`.
    - _Requirements: 7.5_
  - [x] 25.3 Implement the non-blocking hash-error toast component: render above the Timeline, include the invalid fragment in its text, and offer a dismiss button that rewrites the hash to `encode(0)`.
    - _Requirements: 13.3_
  - [x] 25.4 Wire the screen-reader live region updates on every `stepDidChange` (`"{stage}, step {n} of {total}: {label}"`) and ensure the cumulative Trust_Moment counter's `aria-live="polite"` container is re-rendered only when the count increases (never on backward moves).
    - _Requirements: 14.3_

- [x] 26. Final checkpoint — full suite green
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (example and unit tests, structure/token smoke tests); every other task is required.
- Property-based tests are required with no `*` because the design explicitly mandates PBT coverage for the 32 Correctness Properties.
- Every PBT test tags its top-level test with `// Feature: unified-av-showcase, Property {n}: {title}` and runs with `fast-check` using at least `{ numRuns: 100 }`.
- Property-to-file mapping: controller.test.js → P3, P4, P29, P30; registry.test.js → P2, P20; router.test.js → P28; dual-display.test.js → P1, P10, P11; animation.test.js → P13, P14, P15, P16, P17, P31; timeline.test.js → P5, P6, P7, P8, P9 (click half); keyboard.test.js → P9 (keyboard half), P26, P27; contrast.test.js → P12; rendering.test.js → P18, P21, P23; scenarios.test.js → P22, P24, P25; voice.test.js → P19; smoke/perf.test.js → P32.
- Each task references specific Requirement IDs for traceability.
- Checkpoints (tasks 8, 14, 19, 26) provide natural stopping points to verify correctness before advancing.
