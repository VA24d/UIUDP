# Bugfix Requirements Document

## Introduction

The AeroDrive autonomous car onboarding UI prototype (`index.html` + `script.js` + `style.css` + `steps/`) has several functional and visual defects that prevent the flow from working correctly. Issues range from a broken sidebar navigation highlight (the active step is never shown), a missing element `id` that silently breaks the speaking animation, event-listener accumulation that causes the take-over drill to misfire on repeated attempts, and CSS layout problems that cause content to overflow the panel. This document captures the defective behaviors, the correct behaviors they should be replaced with, and the existing behaviors that must not be disturbed.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user navigates to any step THEN the system fails to highlight the active step in the sidebar because `updateNav(n)` queries `id="nav-{n}"` but the `<li>` elements carry `id="nav-step-{n}"`, so `getElementById` always returns `null` and `classList.add('active')` is never called.

1.2 WHEN the car speaks a voice message THEN the system does not animate the voice bar or update the voice text because `speak()` calls `document.getElementById('voice-bar')` but the element in `index.html` has `class="voice-bar"` and no `id` attribute, so the element is never found.

1.3 WHEN the user returns to Step 5 (Take-Over Drill) after having completed or failed it once THEN the system displays "ATTEMPT 2" (or higher) on the very first visit of that session because the module-level `simAttempt` counter is never reset when `loadStep(5)` is called.

1.4 WHEN the user retries the take-over drill (either by failing the countdown or by navigating back and returning) THEN the system registers multiple simultaneous hold-progress timers because `initSimulation()` attaches new `mousedown`, `mouseup`, `touchstart`, and `touchend` listeners to `#btn-hold` on every call without removing the previous ones, causing the hold bar to fill at 2×, 3×, or more the intended speed.

1.5 WHEN the HUD alert is triggered THEN the system renders the alert overlay outside the HUD panel boundaries because `.hud-alert` uses `position: absolute; inset: 0` but its closest positioned ancestor is `.hud-container` (which has `position: relative`), while the intermediate `.hud-center` flex child does not establish a positioning context, causing the overlay to cover the wrong area.

1.6 WHEN the user reaches Step 6 (Drive Preferences / Tuning) THEN the system renders the tune-controls card list overflowing beyond the bottom edge of the central display panel because the `min-height: 0` constraint required for nested flex scroll is not propagated through the `.content-area` → `#module-container` chain.

1.7 WHEN the CSS file is parsed THEN the system produces a malformed `@keyframes pulseRingBlue` rule because the file is truncated mid-declaration, causing the mic-ring pulse animation to fail silently in some browsers.

1.8 WHEN the user is on Step 1 (Profile Creation) THEN the system renders the `.mic-ring` element left-aligned or off-center within the content area because `.voice-input` uses `text-align: center` but the `.content-area` flex column does not enforce `align-items: center`, and `.mic-ring`'s `margin: 0 auto` is insufficient when the parent chain lacks explicit horizontal centering, causing the mic ring to appear visually off-center rather than perfectly centered in the available space.

1.9 WHEN the user progresses through any onboarding step THEN the HUD panel (`#hud` / `.hud-container`) displays only static battery information and a generic progress bar, providing no contextually relevant feedback for the current step — it does not show profile completion status during Step 1, active zone and adjustment values during Step 2, or countdown and attempt status prominently during Step 5, making the instrument cluster feel disconnected from the main display.

1.10 WHEN the user is on any onboarding step or sub-state THEN the system renders no descriptive text outside the two panels (central display and HUD) in the surrounding `.cockpit-layout` dark background area, leaving the space around the screens blank with no caption, annotation, or contextual explanation of what the current step is simulating or what action the user is performing.

---

### Expected Behavior (Correct)

2.1 WHEN the user navigates to any step THEN the system SHALL highlight the corresponding sidebar `<li>` element as active by correcting `updateNav` to query `id="nav-step-{n}"` (matching the actual DOM ids), ensuring exactly one nav item carries the `active` class at all times.

2.2 WHEN the car speaks a voice message THEN the system SHALL animate the voice bar and update the voice text by adding `id="voice-bar"` to the `.voice-bar` element in `index.html` so that `document.getElementById('voice-bar')` resolves correctly.

2.3 WHEN the user navigates to Step 5 for the first time in a session THEN the system SHALL display "ATTEMPT 1" by resetting `simAttempt` to `1` inside `initSimulation()` (or inside `loadStep` when `n === 5`) so the counter reflects the current visit rather than a cumulative session total.

2.4 WHEN the user retries the take-over drill THEN the system SHALL register exactly one set of hold-button event listeners by cloning the `#btn-hold` element (or using `AbortController` / named handler references) to remove all previously attached listeners before attaching new ones, ensuring the hold bar fills at the correct single-timer rate.

2.5 WHEN the HUD alert is triggered THEN the system SHALL render the alert overlay correctly within the HUD panel by adding `position: relative` to `.hud-center` (or restructuring the alert as a direct child of `.hud-container`), so that `position: absolute; inset: 0` resolves against the intended container.

2.6 WHEN the user reaches Step 6 THEN the system SHALL display all tune-control cards within the scrollable content area without overflow by adding `min-height: 0` to `.content-area` and ensuring `#module-container` also carries `min-height: 0` and `overflow: hidden`, allowing the inner `tune-controls` flex child to scroll correctly.

2.7 WHEN the CSS file is parsed THEN the system SHALL produce a valid `@keyframes pulseRingBlue` rule by completing the truncated declaration so the mic-ring pulse animation renders correctly in all supported browsers.

2.8 WHEN the user is on Step 1 (Profile Creation) THEN the system SHALL render the `.mic-ring` element perfectly centered both horizontally and vertically within the Step 1 content area by ensuring `.voice-input` uses `display: flex; flex-direction: column; align-items: center; justify-content: center` and that the `.content-area` flex column propagates centering correctly, so the mic ring appears visually centered regardless of available space.

2.9 WHEN the user progresses through any onboarding step THEN the HUD panel SHALL display contextually relevant, step-specific information that updates dynamically — showing profile field completion status during Step 1, the active seat zone name and current adjustment values during Step 2, slide title and progress during Step 4, and a prominently displayed countdown timer and attempt number during Step 5 — so the instrument cluster behaves as a live, reactive display synchronized with the main onboarding flow.

2.10 WHEN the user is on any onboarding step or sub-state THEN the system SHALL render a descriptive annotation layer in the `.cockpit-layout` background area outside the two panels, displaying plain-language text that explains what the current step is simulating or what action is being performed (e.g., "Simulating: Unmapped road zone detected — autonomous system requesting driver takeover" during Step 5), and this text SHALL update automatically as the user advances through steps and sub-states.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user completes all sub-steps of Step 1 (Profile) THEN the system SHALL CONTINUE TO advance through name capture → face scan → voice profile in the correct order and then load Step 2.

3.2 WHEN the user interacts with the seat hotspots in Step 2 (Comfort) THEN the system SHALL CONTINUE TO show the adjustment panel for the selected zone and update the seat image transform.

3.3 WHEN the user adds a custom location preset in Step 3 THEN the system SHALL CONTINUE TO insert a new address input row above the "Add Another Preset" button.

3.4 WHEN the user navigates the slideshow in Step 4 (Learn) THEN the system SHALL CONTINUE TO show the correct slide, update the dot indicators, and enable/disable the Prev button based on the current slide index.

3.5 WHEN the user successfully holds the override button during the take-over drill THEN the system SHALL CONTINUE TO show the success stage, record the response time, and unlock the Continue button.

3.6 WHEN the user selects acceleration, following distance, or lane preference in Step 6 THEN the system SHALL CONTINUE TO update the road preview, readout values, bolster indicators, and HUD sync bars.

3.7 WHEN the user completes Step 6 and clicks "Complete Setup" THEN the system SHALL CONTINUE TO mark all nav items as completed, show the HUD alert, and load the success screen.

3.8 WHEN the user issues a voice command ("next", "back", "complete", zone names, slide names) THEN the system SHALL CONTINUE TO handle those commands with fuzzy matching and the 1.5-second cooldown debounce.

3.9 WHEN the mic ring centering fix is applied to Step 1 THEN the system SHALL CONTINUE TO animate the mic ring's pulse, active, and done states correctly, and the voice-input tap interaction SHALL CONTINUE TO trigger name capture as before.

3.10 WHEN the HUD contextual feedback is added for each step THEN the system SHALL CONTINUE TO display the static battery percentage, range estimate, gear indicator, drive profile bar, and safety margin dots in their existing positions, and the HUD alert overlay SHALL CONTINUE TO appear correctly when triggered by step completion events.

3.11 WHEN the cockpit annotation layer is added to the `.cockpit-layout` background THEN the system SHALL CONTINUE TO render both the central display and HUD panels at their existing sizes and positions without layout shift, and all existing panel interactions, animations, and z-index layering SHALL CONTINUE TO function as before.
