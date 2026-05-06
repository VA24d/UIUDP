# Implementation Tasks

## 1. Dark Theme & Glass-morphism Conversion

- [x] 1.1 Create dark theme tokens in `showcase/css/tokens.css`
  - Add `:root.theme-dark` with dark color palette: `--color-surface-page` as `radial-gradient(circle at center, #11141a 0%, #050505 100%)`, `--color-surface-elevated` as `rgba(25, 25, 30, 0.7)`, `--color-surface-subtle` as `rgba(255, 255, 255, 0.04)`, `--color-border-subtle` as `rgba(255, 255, 255, 0.08)`, `--color-border-strong` as `rgba(255, 255, 255, 0.15)`, `--color-text-primary` as `#E2E8F0`, `--color-text-secondary` as `rgba(255, 255, 255, 0.6)`, `--color-accent-soft` as `rgba(43, 76, 255, 0.15)`
  - Add glow tokens: `--glow-accent` as `0 0 20px rgba(43, 76, 255, 0.3)`, `--glow-success` as `0 0 12px rgba(31, 122, 76, 0.4)`
  - Add glass-morphism tokens: `--glass-bg`, `--glass-blur`, `--glass-border-top`, `--glass-border-side`, `--glass-shadow`
  - Keep `prefers-reduced-motion` section working for dark theme
- [x] 1.2 Update `showcase/js/core/theme-system.js` to apply `theme-dark` as default
  - Change `applyTheme()` to add `theme-dark` class to `document.documentElement` instead of `theme-light`
- [x] 1.3 Update `showcase/css/layout.css` for dark glass-morphism panels
  - Change `.stage` background to use `var(--color-surface-page)` (now dark gradient)
  - Update `.cluster` and `.tablet`: translucent dark bg, `backdrop-filter: blur(40px)`, luminous top border `rgba(255,255,255,0.15)`, side/bottom borders `rgba(255,255,255,0.08)`, deep box-shadow `0 30px 60px rgba(0,0,0,0.7)`
  - Update `.timeline` with glass-morphism treatment
  - Update accent bar `::before` with glow effect
- [x] 1.4 Update `showcase/css/components.css` for dark theme compatibility
  - Update `.btn-primary` with ambient glow on hover
  - Update `.btn-secondary` and `.btn-ghost` for dark surfaces
  - Update `.choice-card` backgrounds and borders for dark theme
  - Update `.trust-moment` pill for dark background
  - Update `.tl-node`, `.tl-dot`, `.tl-label` colors for dark theme
  - Update `.cluster-speed`, `.cluster-autonomy`, `.cluster-alert-pill` for dark context
  - Add hover glow effects: `box-shadow: var(--glow-accent)` on interactive elements
  - Add pulse animation for active accent elements (1.5-2s oscillation)
- [x] 1.5 Update `showcase/css/base.css` for dark theme typography
  - Set `font-weight: 300` for body text
  - Set `letter-spacing: -0.01em` for headings
  - Ensure `color: var(--color-text-primary)` resolves to light text on dark

## 2. Interactive Map Component

- [ ] 2.1 Create `showcase/js/components/interactive-map.js` — reusable SVG map component
  - Export `createInteractiveMap({ container, config })` factory
  - Config accepts: `routes` (array of path data with style), `pois` (array of markers), `carPosition`, `annotations`
  - Render SVG programmatically with viewBox `0 0 400 220`
  - Add grid lines as subtle dark background pattern
  - Support route styles: `original` (dashed, dimmed), `active` (solid accent, glowing), `reroute` (animated stroke-dashoffset)
  - Add car marker as accent-colored circle with pulse animation
  - Return API: `{ addPOI, removePOI, animateReroute, highlightSegment, updateCarPosition, showTooltip, destroy }`
- [ ] 2.2 Add map POI system with click handlers and tooltips
  - POI types: `charger` (⚡ icon, blue), `food` (🍽 icon, amber), `scenic` (🏔 icon, green)
  - Click POI → show glass-morphism tooltip card with: name, type icon, distance, detour time, "Add to route" button
  - "Add to route" → animate route line to include new waypoint, emit bus event for HUD update
  - Click route segment → highlight with glow + increased stroke-width, show autonomy level info
  - Click car marker → show status card (speed, ETA, battery, mode)
- [ ] 2.3 Add map CSS styles to `showcase/css/components.css`
  - `.map-container`: dark glass-morphism card, rounded corners, overflow hidden
  - `.map-poi`: clickable markers with hover glow, cursor pointer
  - `.map-poi.is-active`: pulse animation
  - `.map-tooltip`: glass-morphism card, positioned absolute, fade-in animation
  - `.map-route-line`: stroke transitions, glow filter for active routes
  - `.map-car-marker`: accent fill with animated pulse ring
  - `.map-segment-info`: small label showing autonomy level
  - Add `@keyframes route-draw` for stroke-dashoffset animation (1.5s)

## 3. Locations Step Rewrite

- [ ] 3.1 Rewrite `renderLocationsTablet()` in `showcase/js/modules/onboarding.js`
  - Replace static labels with split layout: map (60%) + places panel (40%)
  - Instantiate `createInteractiveMap` with Home→Work route, 3+ POI markers (Oak Valley Charger, Riverside Café, Mountain View Point)
  - Route line color-coded: accent blue segments = L4 autonomous, amber segments = manual required
  - Keep "Save places" button wired to `completeThenAdvance`
  - Places panel shows Home/Work with addresses + "Add stop" affordance
- [ ] 3.2 Add POI interaction to Locations map
  - Click POI → tooltip with details + "Add to route" button
  - "Add to route" → route line animates to include waypoint, cockpit annotation narrates addition
  - Click route segment → highlight + show "L4 Autonomous — highway" or "Manual Required — construction zone"
  - Click car marker → status card with speed/ETA/battery/mode
- [ ] 3.3 Add voice commands for Locations map
  - Register step handler for `onboarding.locations`: "show map" focuses map (subtle scale pulse), "add stop" highlights all POIs with pulse animation
  - Emit appropriate bus events for HUD updates on route changes
- [ ] 3.4 Update Locations cluster renderer
  - Show mini route progress indicator in cluster when on Locations step
  - Update HUD context label to reflect map interactions

## 4. Battery Reroute Map Integration

- [ ] 4.1 Rewrite `renderBatteryTablet()` in `showcase/js/modules/driving.js`
  - Split layout: map (top/left 55%) + choice cards (bottom/right 45%)
  - Map shows: original route as dashed line, proposed reroute as solid accent line, car position, charger POI at reroute destination
  - Distance/time annotations on both route options
  - Keep existing choice cards (reroute + continue) — map is additive per Req 3.3
- [ ] 4.2 Implement reroute animation sequence
  - On "Reroute to nearest charger" click: original route fades to dimmed dashed, reroute path draws in via stroke-dashoffset over 1.5s, charger marker pulses with glow
  - HUD updates: ETA shows "+6 min", battery projection changes from "15%" to "80% after charge"
  - Cockpit annotation: "Rerouting to Oak Valley Charger — 6 min detour, charging to 80% in 22 minutes"
  - After animation completes (2s delay), advance to next step
- [ ] 4.3 Add voice command "reroute" for Battery step
  - Register step handler: "reroute" triggers same animation as clicking the reroute card
  - "show map" focuses the map with scale pulse
- [ ] 4.4 Update Battery cluster renderer
  - Show route visualization in cluster (mini map or route indicator)
  - Update battery display during reroute animation (15% → charging indicator)

## 5. Mic System Improvements

- [ ] 5.1 Add error state UI to voice service in `showcase/js/core/voice.js`
  - Add `.is-error` class to mic button on permission denied or recognition error
  - Display human-readable error messages in voice bar text: "Mic permission denied — tap to retry", "Network error — retrying...", "Speech service unavailable"
  - Add red/amber border + ⚠ icon to mic button in error state
  - Clear error state when recovery succeeds
- [ ] 5.2 Implement exponential backoff retry logic
  - On recognition error (not `no-speech` or `aborted`): retry with delays 1s, 2s, 4s
  - Track retry count (max 3 attempts)
  - Update voice bar text with retry status: "Retrying... (attempt 2/3)"
  - Reset retry counter on successful recognition result
- [ ] 5.3 Add manual retry button after max retries
  - After 3 failed retries: show persistent "Retry" button in voice bar
  - Mic button shows distinct disabled/error state (dimmed with ⚠)
  - Voice bar text: "Voice unavailable — tap Retry"
  - Clicking retry resets counter and attempts fresh start
- [ ] 5.4 Add animated listening ring to mic button
  - When `.listening` class is active: pulsing accent-colored ring (expanding/fading glow keyframe)
  - Button background changes to accent color
  - Add subtle waveform dots adjacent to button that animate when receiving audio
- [ ] 5.5 Add mic error CSS styles to `showcase/css/components.css`
  - `.voice-bar-mic.is-error`: red/amber border, background tint, ⚠ icon override
  - `.voice-bar-mic.is-listening`: accent background, pulsing ring animation
  - `.voice-bar-retry-btn`: small pill button in voice bar info area
  - `.voice-bar.is-error .voice-bar-text`: error color tint

## 6. Premium Preferences Step Rewrite

- [ ] 6.1 Rebuild `renderPreferencesTablet()` with targeted DOM updates (no full re-render)
  - Initial render creates the full DOM structure once
  - State changes update only affected elements via `querySelector` + property/class changes
  - Use `requestAnimationFrame` for batched visual updates
  - Eliminate innerHTML replacement that causes visual flash
- [ ] 6.2 Create premium road preview with proper car SVG
  - Replace emoji 🚗/🚙 with inline SVG car silhouettes (sleek sedan profile)
  - Road preview: dark surface with dashed center lane markings (white), solid edge lines
  - 3D perspective via CSS `perspective` + `rotateX` on road container
  - Animated road texture: scrolling dashed lines via CSS animation to simulate forward motion
  - Lead car rendered with reduced opacity (0.5) at variable distance
- [ ] 6.3 Add G-force meter and acceleration visualization
  - G-force meter: horizontal bar with gradient fill (green → yellow → red)
  - Smooth → 33% fill, Standard → 50% fill, Dynamic → 75% fill
  - Animated fill transition over 400ms on mode change
  - Speed readout with counting animation (numbers tick up/down)
  - When "Dynamic" selected: show seat bolster indicators tightening (brief squeeze animation on side elements)
- [ ] 6.4 Add smooth lane-change animation
  - Car SVG position controlled by CSS `transform: translateX()` with 500ms ease transition
  - Slight rotation during lane change (2-3deg tilt, returns to 0)
  - Lane markings remain static while car moves laterally
- [ ] 6.5 Add following distance animation
  - Lead car position controlled by CSS `transform: translateY()` (perspective makes this appear as depth)
  - Close: lead car large/near, Medium: mid-distance, Far: small/distant
  - Animate over 400ms with easing curve
  - Distance label shows counting animation (e.g., "1.5s" → "2.5s" → "4.0s")
- [ ] 6.6 Add preferences CSS styles to `showcase/css/components.css`
  - `.prefs-layout`: grid with controls panel + road preview
  - `.prefs-road-preview`: dark surface, perspective, overflow hidden, lane markings
  - `.prefs-car-svg`: positioned absolute, transition transform 500ms
  - `.prefs-lead-car`: opacity 0.5, transition transform 400ms
  - `.prefs-gforce-meter`: bar container with gradient fill, transition width 400ms
  - `.prefs-stat-readout`: `font-variant-numeric: tabular-nums`, transition for counting
  - `.pref-segment-control`: glass-morphism segmented control replacing flat buttons
  - `.prefs-bolster-indicator`: side elements that animate squeeze on Dynamic mode
  - Road scrolling animation: `@keyframes road-scroll` moving dashed lines

## 7. Voice Command Extensions for Map

- [ ] 7.1 Add map-related voice commands to voice service
  - Add to step-specific handlers for `onboarding.locations` and `driving.battery`:
    - "show map" → emit `voiceCommand` with type `map-focus`
    - "add stop" → emit `voiceCommand` with type `map-highlight-pois`
    - "reroute" → emit `voiceCommand` with type `map-reroute` (battery step only)
  - Register/unregister handlers on step change via bus events

## 8. HUD Integration for Map & Preferences

- [ ] 8.1 Extend HUD module to handle map and preference events
  - Add bus listeners for: `mapRouteChanged`, `mapPOIAdded`, `mapRerouted`, `prefsChanged`
  - On `mapRouteChanged`: update progress bar, show alert "Route Updated"
  - On `mapRerouted`: update battery display (15% → charging icon), show ETA change alert
  - On `prefsChanged`: update accel bar width and distance dots (existing `syncHUD` logic moved to bus-driven)
  - Add new HUD context entries for map-active states

## 9. Integration & Polish

- [ ] 9.1 Verify all existing tests pass after changes
  - Run `npm test` in showcase directory
  - Fix any broken selectors or assertions due to theme/DOM changes
  - Ensure voice service tests still pass with new error handling
- [ ] 9.2 Test responsive layout with new map and preferences components
  - Verify map stacks properly below 1100px
  - Verify preferences road preview scales down gracefully
  - Verify glass-morphism doesn't break on mobile viewports
- [ ] 9.3 Test `prefers-reduced-motion` compliance
  - Verify all new animations (route draw, lane change, G-force fill, POI pulse) respect reduced-motion
  - Add `@media (prefers-reduced-motion: reduce)` overrides for new keyframes
- [ ] 9.4 Final visual polish pass
  - Ensure consistent glow intensity across all interactive elements
  - Verify text contrast meets WCAG AA on dark backgrounds (4.5:1 ratio)
  - Check that glass-morphism blur doesn't cause performance issues on lower-end devices
  - Add `will-change` hints for animated properties where appropriate
