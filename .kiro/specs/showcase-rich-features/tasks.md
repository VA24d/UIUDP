# Tasks

## Task 1: Spacebar Key-Repeat Fix

- [x] 1.1 Add `event.repeat` guard to the `onKeyDown` handler in `wireGrip()` inside `showcase/js/modules/onboarding.js` — if `e.repeat === true`, call `e.preventDefault()` and return immediately
- [x] 1.2 Ensure `spaceHeld` flag is reset to `false` in the `stepWillChange` cleanup handler
- [x] 1.3 Verify the fix by testing: hold spacebar on takeover drill step — grip should only trigger once

## Task 2: Timeline Phase Separators

- [x] 2.1 Modify `createTimeline` in `showcase/js/core/timeline.js` to detect stage boundaries during `render()` and inject `<li class="tl-separator">` elements with stage labels between groups
- [x] 2.2 Add CSS styles for `.tl-separator`, `.tl-separator-line`, and `.tl-separator-label` in `showcase/css/components.css` — wider gap, vertical divider line, small uppercase label
- [x] 2.3 Add CSS for tighter intra-stage dot spacing (reduce gap between dots within same stage vs. between stages)
- [x] 2.4 Verify the existing `is-stage-enter` animation class (600ms) still fires correctly on stage boundary crossings

## Task 3: Improved Locations Step

- [x] 3.1 Replace `renderLocationsTablet` in `showcase/js/modules/onboarding.js` with an SVG map showing Home and Work pins connected by a route path line with distance annotations
- [x] 3.2 Add click/focus handlers on location pins that reveal a detail card (name, address, route segment preview, estimated drive time)
- [x] 3.3 Add an "Add location" button with `+` icon that shows a brief placeholder interaction
- [x] 3.4 Add CSS styles for `.locations-map`, `.loc-pin`, `.loc-detail-card`, `.loc-route-line` in `showcase/css/components.css`

## Task 4: Rich Driving Tablet — Unmapped Zone

- [x] 4.1 Enhance `renderUnmappedTablet` in `showcase/js/modules/driving.js` to render an SVG map with road and hatched construction zone boundary
- [x] 4.2 Add a countdown ring (10s) with SVG circle animation that appears when the takeover prompt fires
- [x] 4.3 Add reason label "Zone not mapped — construction detected" and "Grip wheel" CTA button
- [x] 4.4 Add CSS for `.unmapped-zone-map`, `.construction-boundary`, `.takeover-countdown-ring` in `showcase/css/components.css`

## Task 5: Rich Driving Tablet — Fatigue Escalation Panel

- [ ] 5.1 Enhance `renderFatigueTablet` in `showcase/js/modules/driving.js` to render a styled escalation card with distinct visual states for each level (color-coded backgrounds, icons, descriptive text)
- [ ] 5.2 Add CSS transitions for escalation state changes: `transition: background 500ms, color 500ms, border-color 500ms`
- [ ] 5.3 Add escalation-specific icons (soft chime → buzzer → SOS) and color schemes (green → amber → red)
- [ ] 5.4 Add CSS for `.fatigue-card`, `.fatigue-level-1`, `.fatigue-level-2`, `.fatigue-level-3` in `showcase/css/components.css`

## Task 6: Rich Driving Tablet — Battery Range Math + ADAS Routing

- [ ] 6.1 Add a "Range Math" summary bar to `renderBatteryTablet` showing: Current range, Distance to charger, Deficit calculation
- [ ] 6.2 Color-code the existing route SVG paths by autonomous compatibility zone (green=L4, yellow=L3, red=manual)
- [ ] 6.3 Add route selection animation: show 3 candidate routes fading in sequentially, then highlight the chosen optimal path with a pulsing effect
- [ ] 6.4 Display "87% autonomous coverage" label after route selection animation completes
- [ ] 6.5 Update cluster autonomy pill to show current zone type (L4 ACTIVE / L3 ASSISTED / MANUAL)
- [ ] 6.6 Add CSS for `.range-math-bar`, `.route-corridor`, `.route-candidate`, `.route-selected`, `.adas-coverage-label` in `showcase/css/components.css`

## Task 7: Smart POI Injections

- [ ] 7.1 Enhance `POI_PINS` data in `showcase/js/modules/driving.js` to include `relevance`, `relevanceReason`, and `type` fields
- [ ] 7.2 Add relevance score badges (HIGH/MED/LOW) rendered adjacent to each POI pin in the SVG
- [ ] 7.3 Add fade-in animation (300ms) for POI markers using CSS `@keyframes poi-fade-in`
- [ ] 7.4 Add pulsing border animation on charger POIs (simulating battery < 20% scenario)
- [ ] 7.5 Enhance tooltip to show POI name, type, time impact, and relevance reason
- [ ] 7.6 Visually sort/size POI markers by relevance (highest = largest/brightest)
- [ ] 7.7 Add CSS for `.poi-relevance-badge`, `.poi-pulse`, `.poi-fade-in` in `showcase/css/components.css`

## Task 8: Perception HUD Overlay Enhancements

- [ ] 8.1 Add object cycling logic to `renderEnvironmentTablet` in `showcase/js/modules/riding.js` — every 4 seconds, randomly toggle 1-2 objects visible/hidden and add 1-2 new objects
- [ ] 8.2 Update the count badge reactively when objects cycle in/out
- [ ] 8.3 Add staggered fade-in animation for bounding boxes (150-600ms delays per object)
- [ ] 8.4 Add continuous range sweep rotation animation via CSS `@keyframes perception-sweep`
- [ ] 8.5 Register cleanup for the cycling interval on `stepWillChange`
- [ ] 8.6 Add CSS for `.perception-bbox-enter`, `.perception-bbox-exit`, `@keyframes perception-sweep` in `showcase/css/components.css`

## Task 9: Smart Distraction Nudge

- [ ] 9.1 Add an 8-second timer to `renderProductiveTablet` in `showcase/js/modules/riding.js`
- [ ] 9.2 When timer fires, inject a nudge banner: "Road conditions changing — attention may be needed soon" with amber styling
- [ ] 9.3 Transition the tablet visual state from green/relaxed to amber/alert appearance
- [ ] 9.4 Update the cluster alert pill from "SERENE" (green) to "ATTENTION" (amber)
- [ ] 9.5 Display an autonomy budget indicator (progress bar) that visually decreases from full to partial
- [ ] 9.6 Cancel the nudge timer on `stepWillChange` cleanup
- [ ] 9.7 Add CSS for `.nudge-banner`, `.nudge-active`, `.autonomy-budget-bar` in `showcase/css/components.css`

## Task 10: Contextual Safe-Zone Indicator

- [ ] 10.1 Create a `renderSafeZoneBar()` helper function in `showcase/js/modules/riding.js` that renders a gradient bar with green/yellow/red segments
- [ ] 10.2 Call `renderSafeZoneBar()` from all three riding step tablet renderers (environment, maneuver, productive-time)
- [ ] 10.3 Add a position marker that advances slightly on each riding step (15% → 40% → 65%)
- [ ] 10.4 Add distance labels at zone boundaries (e.g., "2.1 km", "3.8 km")
- [ ] 10.5 Update cluster status pill when marker enters yellow/red zones
- [ ] 10.6 Add CSS for `.safe-zone-bar`, `.sz-segment`, `.sz-marker`, `.sz-label`, `.sz-green`, `.sz-yellow`, `.sz-red` in `showcase/css/components.css`

## Task 11: Tactile Overrides for Takeover Drill

- [ ] 11.1 Add a steering wheel icon element to the takeover drill warning stage in `showcase/js/modules/onboarding.js`
- [ ] 11.2 Add CSS pulse animation at 1Hz baseline, increasing to 2Hz when countdown ≤ 5s, and 3Hz + red glow when countdown ≤ 3s
- [ ] 11.3 Add left/right seat vibration indicator elements with CSS shake animation during countdown
- [ ] 11.4 Add a haptic feedback icon to the cluster that animates in sync with the tablet steering wheel pulse
- [ ] 11.5 On grip success (spacebar or button), immediately stop all pulse/vibration animations and show success confirmation
- [ ] 11.6 Add CSS for `.tactile-wheel`, `.tactile-pulse-1hz`, `.tactile-pulse-2hz`, `.tactile-pulse-3hz`, `.tactile-glow`, `.seat-vibrate`, `.haptic-icon` in `showcase/css/components.css`

## Task 12: Simulation Mode Preview

- [ ] 12.1 Add a `renderSimulationPreview` function in `showcase/js/modules/onboarding.js` that renders a top-down animated driving preview
- [ ] 12.2 Intercept the advance from Preferences step — instead of going directly to Driving, render the simulation preview in the tablet
- [ ] 12.3 Implement three sequential maneuver animations: accelerate from stop, follow lead vehicle, execute lane change (total 5-10s)
- [ ] 12.4 Reflect user preference settings in animation parameters (speed = acceleration aggressiveness, gap = following distance, smoothness = lane-change curve)
- [ ] 12.5 Add a progress bar showing remaining preview duration
- [ ] 12.6 Add a "Skip preview" button that immediately advances to the first Driving step
- [ ] 12.7 Auto-advance to first Driving step within 1 second after animation completes
- [ ] 12.8 Update cluster to show "SIMULATION" as autonomy mode label during preview, reverting when preview ends
- [ ] 12.9 Add CSS for `.sim-preview`, `.sim-car`, `.sim-lead-car`, `.sim-road`, `.sim-progress-bar`, `.sim-skip-btn` in `showcase/css/components.css`
