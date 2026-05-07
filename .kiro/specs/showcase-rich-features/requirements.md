# Requirements Document

## Introduction

This specification covers a comprehensive enhancement to the AeroDrive showcase prototype. It addresses four existing bugs (spacebar key-repeat blocking, sparse driving/riding tablet content, missing timeline phase separators, and basic locations step) and introduces seven new use cases (Perception HUD Overlay, Smart Distraction Nudge, Contextual Safe-Zone Indicator, Live ADAS Routing, Smart POI Injections, Tactile Overrides, and Simulation Mode Preview). Together these changes bring the showcase to full feature parity with the original prototype's detail level and add the new interactive features from the Feature List document.

## Glossary

- **Showcase**: The unified AeroDrive interactive prototype application running in a browser, consisting of 14+ steps across 5 stages.
- **Timeline**: The horizontal navigation component at the bottom of the showcase displaying step dots and allowing click/keyboard navigation.
- **Cluster**: The left panel (dashboard cluster) displaying HUD-style driving information.
- **Tablet**: The right panel (infotainment tablet) displaying step-specific interactive content.
- **Step**: A single screen/state in the showcase, identified by a stage.slug ID (e.g., `driving.fatigue`).
- **Stage**: A logical grouping of steps: Intro, Onboarding, Driving, Riding, or Summary.
- **Takeover_Drill**: The onboarding step (`onboarding.takeover-drill`) where the user practices gripping the steering wheel on a countdown.
- **Key_Repeat_Event**: A `keydown` event fired by the browser when a key is held down, identified by `event.repeat === true`.
- **Space_Held_Flag**: A boolean state variable that tracks whether the spacebar is currently being held down, used to prevent re-triggering on key repeat.
- **Phase_Separator**: A visual divider element in the Timeline that marks the boundary between two stages.
- **Perception_HUD**: A sensor visualization overlay showing detected objects with bounding boxes, type labels, and distance measurements.
- **Bounding_Box**: A rectangular outline drawn around a detected object in the Perception HUD, color-coded by object type.
- **Autonomy_Budget**: A numeric indicator representing how much autonomous driving capacity remains before driver attention may be needed.
- **Safe_Zone_Indicator**: A visual gradient bar showing upcoming route segments classified as safe (green), caution (yellow), or attention-needed (red).
- **ADAS_Routing**: Advanced Driver Assistance System routing that selects paths based on autonomous compatibility zones.
- **Autonomous_Compatibility_Zone**: A route segment classified by its level of autonomous driving support: full L4 (green), limited (yellow), or manual-required (red).
- **POI**: Point of Interest — a location suggestion (charger, food, rest area) shown on the map during driving.
- **Relevance_Score**: A numeric value indicating how contextually appropriate a POI suggestion is given current vehicle state.
- **Tactile_Override**: A visual simulation of haptic/physical feedback (steering wheel pulse, seat vibration) shown during takeover warnings.
- **Simulation_Preview**: A brief animated demonstration showing how the car will behave with the user's chosen preference settings.
- **Escalation_Intensity**: A progressive increase in visual urgency (size, color saturation, animation speed) as a countdown progresses.

## Requirements

### Requirement 1: Spacebar Key-Repeat Fix for Takeover Drill

**User Story:** As a presenter, I want the spacebar to trigger the takeover grip action only once per press, so that key-repeat events do not cause multiple unintended triggers during the drill.

#### Acceptance Criteria

1. WHEN a `keydown` event with `key === ' '` is received AND `event.repeat` is `true`, THE Takeover_Drill SHALL ignore the event and not trigger any grip or advance action.
2. WHEN a `keydown` event with `key === ' '` is received AND `event.repeat` is `false` AND the Space_Held_Flag is `false`, THE Takeover_Drill SHALL set the Space_Held_Flag to `true` and process the spacebar action.
3. WHEN a `keyup` event with `key === ' '` is received, THE Takeover_Drill SHALL reset the Space_Held_Flag to `false`.
4. IF the step changes while the Space_Held_Flag is `true`, THEN THE Takeover_Drill SHALL reset the Space_Held_Flag to `false` during cleanup.

---

### Requirement 2: Rich Tablet Content for Driving Steps

**User Story:** As a viewer, I want the driving steps (Unmapped Zone, Fatigue, Battery) to display detailed, visually rich tablet content, so that each scenario communicates its full narrative with appropriate visual feedback.

#### Acceptance Criteria

1. WHEN the Unmapped Zone step is active, THE Tablet SHALL display a map visualization showing the unmapped construction zone boundary, a reason label, a countdown timer, and a grip-wheel call-to-action button.
2. WHEN the Fatigue step is active, THE Tablet SHALL display a three-level escalation panel with distinct visual states for each level (attention check, warning buzzer, critical SOS), including color-coded backgrounds, icon changes, and descriptive text for each escalation stage.
3. WHEN the Fatigue step escalates from one level to the next, THE Tablet SHALL animate the transition between escalation states with a visible color shift and text update within 500 milliseconds.
4. WHEN the Battery step is active, THE Tablet SHALL display an interactive SVG map with the planned route, a detour path, clickable POI pins with tooltips, and a choice card panel with "Reroute" and "Continue" options.
5. THE Tablet SHALL render a range math summary showing current range, distance to next charger, and deficit when the Battery step is active.

---

### Requirement 3: Rich Tablet Content for Riding Steps

**User Story:** As a viewer, I want the riding steps (Environment, Maneuver, Productive Time) to display detailed, visually rich tablet content, so that each scenario demonstrates the full passenger-mode experience.

#### Acceptance Criteria

1. WHEN the Environment step is active, THE Tablet SHALL display the Perception HUD SVG with at least 5 detected objects rendered as color-coded Bounding_Boxes with type labels and distance measurements.
2. WHEN the Maneuver step is active, THE Tablet SHALL display a maneuver preview card showing the upcoming turn direction, street name, time-to-execution countdown, and a reassurance message.
3. WHEN the Productive Time step is active, THE Tablet SHALL display a task list with at least 3 activity suggestions sourced from simulated calendar/email data, each showing an icon, description, and estimated duration.
4. WHEN the Productive Time step is active, THE Tablet SHALL display the available productive time duration prominently above the task list.

---

### Requirement 4: Timeline Phase Separators

**User Story:** As a viewer, I want the timeline to visually separate the five stages with labeled dividers, so that I can understand the showcase structure and my current position within it.

#### Acceptance Criteria

1. THE Timeline SHALL render a Phase_Separator element between each pair of adjacent stages (between Intro and Onboarding, Onboarding and Driving, Driving and Riding, Riding and Summary).
2. THE Timeline SHALL display a text label on or adjacent to each Phase_Separator identifying the stage that follows (e.g., "Onboarding", "Driving", "Riding", "Summary").
3. WHEN the active step crosses a Phase_Separator boundary, THE Timeline SHALL apply a stage-entry animation class lasting 600 milliseconds to visually emphasize the transition.
4. THE Timeline SHALL group step dots within each stage visually closer together than the gap between stages, creating a clear clustering effect.
5. the system add a card as well like the intro card at the beginnning of the driving and riding steps.

---

### Requirement 5: Improved Locations Step

**User Story:** As a viewer, I want the Locations onboarding step to show an interactive map with POI markers, route segment details, and a clear visual hierarchy, so that the step demonstrates the full location-preset experience.

#### Acceptance Criteria

1. WHEN the Locations step is active, THE Tablet SHALL display an SVG map visualization showing at least 2 saved location markers (Home, Work) with distinct icons and address labels.
2. WHEN a location marker is clicked or focused, THE Tablet SHALL display a detail card showing the location name, address, and a route segment preview with estimated drive time.
3. THE Tablet SHALL display route segments connecting saved locations as styled path lines on the map, with distance annotations.
4. THE Tablet SHALL provide an "Add location" affordance (button or input) that visually demonstrates the ability to add new presets.

---

### Requirement 6: Perception HUD Overlay

**User Story:** As a viewer, I want the Riding Environment step to show a live sensor view with detected objects appearing and disappearing, so that I understand what the car's sensors perceive in real time.

#### Acceptance Criteria

1. WHEN the Environment step is active, THE Perception_HUD SHALL render detected objects as animated Bounding_Boxes that fade in with staggered delays (each object delayed by 150–600 milliseconds from the previous).
2. THE Perception_HUD SHALL color-code Bounding_Boxes by object type: green for vehicles, amber for pedestrians, and blue for signs/infrastructure.
3. THE Perception_HUD SHALL display a distance label (in meters) adjacent to each Bounding_Box.
4. WHILE the Environment step is active, THE Perception_HUD SHALL cycle objects in and out of view on a 4-second interval to simulate real-time detection changes.
5. THE Perception_HUD SHALL display a range sweep animation originating from the ego vehicle position at the bottom-center of the SVG viewport.
6. THE Perception_HUD SHALL display a count badge showing the current number of tracked objects, updating as objects appear and disappear.

---

### Requirement 7: Smart Distraction Nudge

**User Story:** As a viewer, I want the Productive Time step to demonstrate the system interrupting productive time when conditions change, so that I understand the safety-first approach to disengagement.

#### Acceptance Criteria

1. WHEN the Productive Time step has been active for 8 seconds, THE Tablet SHALL display a distraction nudge message: "Road conditions changing — attention may be needed soon."
2. WHEN the distraction nudge appears, THE Tablet SHALL transition the visual state from a "safe to disengage" appearance (green accent, relaxed layout) to an "attention needed" appearance (amber accent, alert styling).
3. THE Cluster SHALL update its alert pill from "SERENE" to "ATTENTION" with an amber color when the distraction nudge activates.
4. WHEN the distraction nudge activates, THE Tablet SHALL display an Autonomy_Budget indicator that visually decreases from full to partial.
5. IF the step changes before the nudge timer fires, THEN THE Tablet SHALL cancel the pending nudge timer during cleanup.

---

### Requirement 8: Contextual Safe-Zone Indicator

**User Story:** As a viewer, I want to see a visual indicator showing safe, caution, and attention zones on the upcoming route, so that I understand when it is truly safe to disengage from driving attention.

#### Acceptance Criteria

1. WHILE any Riding step is active, THE Tablet SHALL display a Safe_Zone_Indicator gradient bar showing the upcoming 5 km of route segments.
2. THE Safe_Zone_Indicator SHALL use three color zones: green for highway stretches (safe to disengage), yellow for approaching intersections or lane merges (caution), and red for complex zones requiring attention.
3. THE Safe_Zone_Indicator SHALL display a position marker indicating the vehicle's current location on the gradient bar.
4. WHEN the vehicle position marker enters a yellow or red zone, THE Cluster SHALL update its status pill to reflect the zone type (caution or attention).
5. THE Safe_Zone_Indicator SHALL display distance labels at zone boundaries (e.g., "2.1 km", "3.8 km") to communicate when transitions will occur.

---

### Requirement 9: Live ADAS Routing

**User Story:** As a viewer, I want the driving steps to show a map visualization of autonomous compatibility zones with route selection animation, so that I understand how the car chooses optimal autonomous paths.

#### Acceptance Criteria

1. WHEN the Battery step is active, THE Tablet SHALL display route corridors color-coded by Autonomous_Compatibility_Zone: green for full L4 autonomy, yellow for limited autonomy, and red for manual-required segments.
2. THE Tablet SHALL animate a route selection sequence showing the system evaluating 2–3 candidate routes before highlighting the chosen optimal path.
3. WHEN the route selection animation completes, THE Tablet SHALL display the selected route with a pulsing highlight and a summary label showing total autonomous percentage (e.g., "87% autonomous coverage").
4. THE Cluster SHALL display the current zone type (L4 ACTIVE, L3 ASSISTED, or MANUAL) matching the active route segment.

---

### Requirement 10: Smart POI Injections

**User Story:** As a viewer, I want to see the car dynamically suggesting context-aware pitstops on the map during the battery step, so that I understand how the system proactively helps with charging and rest needs.

#### Acceptance Criteria

1. WHEN the Battery step is active, THE Tablet SHALL display POI markers that appear dynamically on the map with a fade-in animation over 300 milliseconds.
2. THE Tablet SHALL display a Relevance_Score badge (high, medium, low) on each POI marker indicating contextual appropriateness.
3. WHEN a POI marker is clicked or focused, THE Tablet SHALL display a tooltip showing the POI name, type (charger, food, rest), time impact, and relevance reason.
4. WHEN the vehicle's battery level is below 20%, THE Tablet SHALL highlight charger POIs with a pulsing border and display a contextual message: "Low battery detected — suggesting charger."
5. THE Tablet SHALL sort and visually prioritize POI markers by Relevance_Score, with the highest-relevance POI appearing most prominently.

---

### Requirement 11: Tactile Overrides for Takeover Drill

**User Story:** As a viewer, I want the takeover drill to simulate haptic feedback through visual pulsing of the steering wheel icon and seat vibration indicators, so that I understand the physical feedback the driver would feel during a real takeover.

#### Acceptance Criteria

1. WHEN the Takeover_Drill countdown is active, THE Tablet SHALL display a steering wheel icon that pulses with increasing intensity as the countdown progresses.
2. THE Tablet SHALL display seat vibration indicators (left and right) that animate with a shake/vibrate CSS animation during the countdown phase.
3. WHEN the countdown reaches 5 seconds remaining, THE Tablet SHALL increase the pulse frequency of the steering wheel icon from 1 Hz to 2 Hz.
4. WHEN the countdown reaches 3 seconds remaining, THE Tablet SHALL increase the pulse frequency to 3 Hz and add a red glow effect to the steering wheel icon.
5. THE Cluster SHALL display a haptic feedback indicator icon that animates in sync with the Tablet's steering wheel pulse during the countdown.
6. IF the user grips the wheel (presses Space or clicks the grip button) before the countdown expires, THEN THE Tablet SHALL immediately stop all pulse and vibration animations and display a success confirmation.

---

### Requirement 12: Simulation Mode Preview

**User Story:** As a viewer, I want to see a brief animated driving simulation after setting preferences, so that I understand how the car will behave with my chosen settings before entering the driving phase.

#### Acceptance Criteria

1. WHEN the Preferences step is completed and the user advances, THE Tablet SHALL display a 5–10 second animated simulation preview before transitioning to the Driving phase.
2. THE Simulation_Preview SHALL show a top-down car icon performing three maneuvers in sequence: accelerating from stop, following a lead vehicle at the configured distance, and executing a lane change.
3. THE Simulation_Preview SHALL reflect the user's preference settings by adjusting animation speed (acceleration aggressiveness), following gap (close vs. far), and lane-change smoothness.
4. THE Simulation_Preview SHALL display a progress bar indicating the remaining preview duration.
5. THE Simulation_Preview SHALL provide a "Skip preview" button that immediately advances to the Driving phase.
6. WHEN the Simulation_Preview completes its animation sequence, THE Showcase SHALL automatically advance to the first Driving step within 1 second.
7. THE Cluster SHALL display "SIMULATION" as the autonomy mode label during the preview, reverting to the appropriate driving mode label when the preview ends.
