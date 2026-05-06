# Bugfix Requirements Document

## Introduction

The showcase prototype has three interconnected deficiencies: (1) it lacks an interactive map visualization that integrates with the dynamic battery reroute scenario, (2) the UI uses a flat light theme instead of the original prototype's immersive dark cockpit aesthetic with glass-morphism, and (3) the mic/voice system has poor reliability with no visual error states or recovery. Additionally, the "Dial in your drive" preferences step looks like a basic web form instead of a premium car tuning interface. Since this is a prototype where "the action performed needs to be understood," every interaction must produce clear visible feedback with cockpit annotations and HUD updates.

## Bug Analysis

### Current Behavior (Defect)

#### Map & Dynamic Reroute

1.1 WHEN the showcase renders the Locations onboarding step (step 3) THEN the system displays only two static text labels ("🏠 Home" and "💼 Work") with no map visualization, no route preview, no clickable POI markers, and no visual representation of the planned route

1.2 WHEN the showcase renders the Driving battery reroute step THEN the system displays only text-based choice cards with no visual map showing the current route, the reroute path, the charger location, or the car's position — the dynamic reroute is entirely text-based with no spatial context

1.3 WHEN the user selects "Reroute to nearest charger" in the battery step THEN the system advances to the next step without showing any animated route change, ETA update, or battery projection on a map — the presenter cannot demonstrate what "dynamic rerouting" looks like

1.4 WHEN the user interacts with the Locations step THEN there are no clickable POI markers (charging stations, food stops) that can be tapped to reveal details or added to a route

1.5 WHEN any map-related interaction occurs THEN the HUD does not update to reflect route changes (no ETA update, no battery projection change, no distance recalculation)

#### UI Theme & Polish

1.6 WHEN the showcase loads THEN the system renders a light beige page background (`#F6F5F2`) and white elevated surfaces that appear flat and disconnected from the cockpit metaphor — the original prototype uses dark radial-gradient background with glass-morphism panels

1.7 WHEN the showcase renders the cluster and tablet panels THEN the system applies opaque white backgrounds with minimal elevation instead of glass-morphism (translucent dark surfaces, backdrop-filter blur, luminous borders, inner glow)

1.8 WHEN the user hovers or focuses interactive elements THEN the system applies minimal hover states without glow effects, luminous borders, or depth transitions that match the cockpit aesthetic

1.9 WHEN accent-colored elements render THEN the system does not apply ambient glow effects or pulse animations that create the immersive cockpit feel

#### Mic System

1.10 WHEN the mic auto-starts on page load and the browser denies permission THEN the system silently fails with no user-facing error message or visual indication

1.11 WHEN speech recognition encounters an error THEN the system only logs to console with no visual feedback about what went wrong or how to recover

1.12 WHEN the mic toggle button is in the listening state THEN the visual difference between listening and not-listening is insufficiently distinct (no animated ring, no waveform, no color-coded state)

1.13 WHEN speech recognition stops due to network error or timeout THEN the system attempts a blind restart with no feedback if restart also fails — no exponential backoff, no retry counter, no manual retry option

#### Dial In Your Drive (Preferences Step)

1.14 WHEN the showcase renders the Preferences step THEN the system shows basic flat option buttons (Smooth/Standard/Dynamic, Close/Medium/Far, Left/Center/Right) with emoji cars in a plain road preview — it looks like a web form, not a premium car tuning interface

1.15 WHEN the user changes a preference option THEN the system re-renders the entire step content causing a visual flash instead of smoothly animating the change

1.16 WHEN the user selects "Dynamic" acceleration THEN the system does not show any visual indication of what "dynamic" means physically (no seat bolster tightening, no G-force visualization, no speed differential animation)

1.17 WHEN the user adjusts following distance THEN the preview does not animate the lead car moving closer/further — it just snaps to a new position

1.18 WHEN the user adjusts lane preference THEN the car emoji snaps to a new position without a smooth lane-change animation

### Expected Behavior (Correct)

#### Map & Dynamic Reroute

2.1 WHEN the showcase renders the Locations onboarding step THEN the system SHALL display an interactive SVG-based map showing: a curved route line from Home to Work, the car's position marker, at least 3 clickable POI markers (charging station, food stop, scenic point), and road segments color-coded by autonomy level (accent blue = L4, amber = manual required)

2.2 WHEN the showcase renders the Driving battery reroute step THEN the system SHALL display an interactive map showing: the original route as a dashed line, the proposed reroute as a solid accent line, the car's current position, the charger POI at the reroute destination, and distance/time annotations on both options — the map SHALL be integrated with the existing choice cards so selecting "Reroute" triggers the map animation

2.3 WHEN the user selects "Reroute to nearest charger" THEN the system SHALL animate the route change on the map: original route fades to dashed/dimmed, reroute path draws in with a stroke animation over 1.5s, charger marker pulses, HUD updates ETA (+6 min) and battery projection (15% → 80% after charge), AND cockpit annotation narrates: "Rerouting to Oak Valley Charger — 6 min detour, charging to 80% in 22 minutes"

2.4 WHEN the user clicks a POI marker on the map THEN the system SHALL display a tooltip card with POI details (name, type, distance, detour time) and an "Add to route" button, with cockpit annotation describing the POI

2.5 WHEN the user clicks "Add to route" THEN the system SHALL animate the route line to include the new stop, update HUD with revised ETA, and cockpit annotation confirms the addition

2.6 WHEN the user clicks a route segment THEN the system SHALL highlight it with glow + increased stroke width and show autonomy level info ("L4 Autonomous — highway" or "Manual Required — construction zone")

2.7 WHEN the user clicks the car marker THEN the system SHALL show a status card (speed, ETA, battery, autonomy mode) and the HUD SHALL pulse to draw attention

2.8 WHEN voice commands "show map", "add stop", or "reroute" are issued THEN the system SHALL respond: "show map" focuses the map, "add stop" highlights POIs with pulse, "reroute" triggers the reroute animation (same as clause 2.3)

#### UI Theme & Polish

2.9 WHEN the showcase loads THEN the system SHALL render a dark theme with `radial-gradient(circle at center, #11141a 0%, #050505 100%)` background, matching the original prototype's cockpit aesthetic

2.10 WHEN the showcase renders cluster and tablet panels THEN the system SHALL apply glass-morphism: translucent dark backgrounds (`rgba(25, 25, 30, 0.7)`), `backdrop-filter: blur(40px)`, luminous top border (`rgba(255, 255, 255, 0.15)`), side/bottom borders (`rgba(255, 255, 255, 0.08)`), and deep box-shadow (`0 30px 60px rgba(0, 0, 0, 0.7)`)

2.11 WHEN the user hovers or focuses interactive elements THEN the system SHALL apply glow effects (accent-colored box-shadow), luminous border brightening, subtle scale (`scale(1.02)`), and smooth 200ms transitions

2.12 WHEN accent-colored elements render THEN the system SHALL apply ambient glow (`box-shadow: 0 0 Npx rgba(accent, 0.3-0.5)`) and for active elements a subtle pulse animation (1.5-2s oscillation)

2.13 WHEN the showcase renders text THEN the system SHALL use `font-weight: 300` for body, `letter-spacing: -0.01em` for headings, lighter refined typography matching the original prototype

#### Mic System

2.14 WHEN the mic auto-starts and permission is denied THEN the system SHALL display "Mic permission denied — tap to retry" in the voice bar and show the mic button in an error state (red/amber border, ⚠ icon)

2.15 WHEN speech recognition encounters an error THEN the system SHALL display a human-readable message in the voice bar (e.g., "Network error — retrying..."), apply error visual state to mic button, and attempt recovery with exponential backoff (1s, 2s, 4s delays, max 3 retries)

2.16 WHEN the mic is actively listening THEN the system SHALL show: pulsing accent-colored ring around the mic button (expanding/fading glow), button background changed to accent color, and an animated waveform visualization inside or adjacent to the button

2.17 WHEN all retry attempts fail THEN the system SHALL display a persistent error message with a manual "Retry" button in the voice bar, and the mic button SHALL show a distinct disabled/error state

#### Dial In Your Drive (Preferences Step)

2.18 WHEN the showcase renders the Preferences step THEN the system SHALL display a premium car tuning interface with: (a) a dark glass-morphism control panel with labeled sliders/segments instead of flat buttons, (b) a 3D-perspective road preview with proper car SVG/icon (not emoji), lane markings, and depth, (c) real-time animated transitions when values change, (d) a G-force/seat visualization that shows physical effects of the selected profile

2.19 WHEN the user changes acceleration mode THEN the system SHALL smoothly animate: the speed readout counting up/down, the G-force meter bar filling/emptying, and if "Dynamic" is selected, show seat bolster indicators tightening with a brief squeeze animation

2.20 WHEN the user changes following distance THEN the system SHALL smoothly animate the lead car moving closer or further on the road preview over 400ms with an easing curve, and update the distance label with a counting animation

2.21 WHEN the user changes lane preference THEN the system SHALL animate the car performing a smooth lane-change motion (lateral slide over 500ms with slight rotation) on the road preview, not a snap

2.22 WHEN any preference changes THEN the system SHALL NOT re-render the entire step — instead it SHALL update only the changed elements via targeted DOM manipulation to avoid visual flash

2.23 WHEN the preferences step renders the road preview THEN the system SHALL show: proper lane markings (dashed center lines, solid edge lines), a car icon/SVG (not emoji), a lead car with opacity, animated road texture scrolling to simulate motion, and stat readouts (speed, G-force, gap) with tabular-nums font

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks "Save places" or "Save drive style" THEN the system SHALL CONTINUE TO advance via completeThenAdvance

3.2 WHEN the user navigates via timeline, keyboard, or voice THEN the system SHALL CONTINUE TO transition with existing animation crossfade

3.3 WHEN the battery step renders choice cards THEN the system SHALL CONTINUE TO display both options alongside the new map — the map is additive

3.4 WHEN voice commands "next" or "back" are issued THEN the system SHALL CONTINUE TO navigate between steps — new commands ("show map", "add stop", "reroute") are additive

3.5 WHEN the page is viewed below 1100px THEN the system SHALL CONTINUE TO stack panels vertically with responsive scaling

3.6 WHEN `prefers-reduced-motion: reduce` is active THEN the system SHALL CONTINUE TO disable animations

3.7 WHEN the HUD panel renders THEN the system SHALL CONTINUE TO display all existing indicators correctly — map/theme updates are additive

3.8 WHEN the timeline renders THEN the system SHALL CONTINUE TO show correct node states and trust moment counter

3.9 WHEN the voice service fuzzy-matches commands THEN the system SHALL CONTINUE TO use levenshtein ≤ 3 threshold and 1500ms cooldown

3.10 WHEN TTS speaks THEN the system SHALL CONTINUE TO block nav commands for 900ms (navBlockedUntil)
