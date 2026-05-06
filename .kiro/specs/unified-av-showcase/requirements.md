# Requirements Document

## Introduction

The Unified AV Showcase is a single-page, static web prototype that combines the existing Onboarding prototype and Driving/Riding prototype into one continuous, presentation-ready experience for a UI design course showcase. The Showcase is designed around the research goal: "To understand how users will interact with autonomous cars and what makes them more likely to adopt them, with the goal of increasing trust in the system." Every screen, transition, and interaction is framed as a trust-building moment between the driver and the AeroDrive autonomous vehicle.

The Showcase is structured as a linear, skippable narrative with five stages:

1. **Intro** — Context framing: the user has just purchased an AeroDrive.
2. **Onboarding** — Improved six-step voice-guided onboarding (profile, comfort, presets, drive explanation, takeover drill, preferences).
3. **Driving** — Autonomous-driving scenarios (unmapped-zone takeover, fatigue protocol, battery management).
4. **Riding** — Passenger-mode scenarios (environmental feedback, maneuver warnings, productive time).
5. **Summary** — Research-framed closeout summarizing trust-building moments shown.

A persistent timeline with filled/unfilled nodes lets presenters jump to any stage on demand, which is essential for live industry-professional demos where sub-flows may be skipped. The Showcase uses a new light-mode design system, smooth animated transitions, and a synchronized dual-display layout in which the steering/cluster display (HUD) and the infotainment tablet remain in the same narrative state at all times.

The Showcase is built from scratch in a new isolated folder using vanilla HTML, CSS, and JavaScript so the demo runs from a single `index.html` with no build step. The existing prototypes at the workspace root and in `driving_prototype/` remain unmodified.

## Glossary

- **Showcase_App**: The complete unified single-page prototype delivered by this feature.
- **Showcase_Folder**: The new top-level directory (`showcase/`) that contains all files for the Showcase_App and is isolated from existing prototypes.
- **Stage**: One of the five top-level sections of the Showcase_App: Intro, Onboarding, Driving, Riding, Summary.
- **Step**: A single navigable node within a Stage (for example, Onboarding Stage contains six Steps; Driving Stage contains three Steps; each Stage has at least one Step).
- **Node**: A Step as represented on the Timeline as a filled or unfilled circle.
- **Timeline**: The persistent horizontal navigation component that renders one Node per Step across all Stages and supports click-to-jump navigation.
- **Intro_Screen**: The Step in the Intro Stage that presents the narrative framing and a primary call-to-action to begin the Showcase.
- **Dashboard_Cluster**: The left-side display region representing the steering-wheel instrument cluster / HUD.
- **Infotainment_Tablet**: The right-side display region representing the center-console tablet.
- **Dual_Display**: The paired rendering surface consisting of the Dashboard_Cluster and the Infotainment_Tablet.
- **Stage_Controller**: The module that owns the active Step index and coordinates Dashboard_Cluster and Infotainment_Tablet rendering.
- **State_Router**: The module that maps URL hash fragments to Step indices and Step indices to URL hash fragments for deep-linking and back/forward support.
- **Theme_System**: The module that applies the light-mode color tokens, typography tokens, spacing tokens, and elevation tokens to the Showcase_App.
- **Animation_Controller**: The module that orchestrates Stage-to-Stage and Step-to-Step transition animations across the Dual_Display.
- **Onboarding_Module**: The Showcase_App submodule that implements the six improved onboarding Steps.
- **Driving_Module**: The Showcase_App submodule that implements the driving Steps.
- **Riding_Module**: The Showcase_App submodule that implements the riding Steps.
- **Summary_Module**: The Showcase_App submodule that implements the closing Summary Stage.
- **Trust_Moment**: A content element (caption, indicator, or micro-interaction) explicitly labeled as contributing to the research goal of increasing trust in the autonomous system.
- **Presenter**: The person demoing the Showcase_App to industry professionals during the course showcase.
- **End_User**: The fictional driver persona experiencing the narrative inside the Showcase_App.
- **Skip_To_Target**: The Step that the Presenter selects by clicking a Node on the Timeline.
- **Contrast_Ratio**: The WCAG 2.1 contrast ratio between a foreground color token and its paired background color token.

## Requirements

### Requirement 1: Isolated Showcase Folder

**User Story:** As a developer, I want the Showcase_App to live in a new isolated folder, so that the existing Onboarding prototype and Driving prototype remain unchanged and can still be demonstrated independently.

#### Acceptance Criteria

1. THE Showcase_App SHALL reside entirely within the Showcase_Folder at path `showcase/` relative to the workspace root.
2. THE Showcase_App SHALL load from a single entry file at `showcase/index.html`.
3. THE Showcase_App SHALL run without a build step when `showcase/index.html` is opened directly in a browser or served over a static file server.
4. WHERE assets from existing prototypes are reused, THE Showcase_App SHALL copy the assets into the Showcase_Folder rather than reference the originals.
5. THE Showcase_App SHALL NOT modify files outside the Showcase_Folder.

### Requirement 2: Five-Stage Linear Showcase Structure

**User Story:** As a Presenter, I want the Showcase_App to present a single linear narrative from intro to summary, so that industry professionals experience a coherent story about trust in the autonomous vehicle.

#### Acceptance Criteria

1. THE Showcase_App SHALL define exactly five Stages in this order: Intro, Onboarding, Driving, Riding, Summary.
2. THE Showcase_App SHALL assign each Step a unique integer index in a single global Step sequence across all Stages, starting at zero.
3. THE Showcase_App SHALL display exactly one Step at a time on the Dual_Display.
4. WHEN the End_User advances from the current Step, THE Stage_Controller SHALL set the active Step index to the next Step in the global Step sequence.
5. WHEN the End_User advances from the final Step of the Summary Stage, THE Stage_Controller SHALL keep the active Step index at the final Step and disable further forward advancement.
6. WHEN the End_User retreats from the current Step, THE Stage_Controller SHALL set the active Step index to the previous Step in the global Step sequence.
7. WHEN the active Step is the first Step of the Intro Stage, THE Stage_Controller SHALL disable further backward retreat.

### Requirement 3: Intro Context Screen

**User Story:** As an End_User, I want an opening context screen explaining that I have just purchased the AeroDrive, so that I understand the narrative frame before the onboarding begins.

#### Acceptance Criteria

1. THE Intro_Screen SHALL render a headline that names the AeroDrive vehicle and establishes that the End_User has just taken delivery.
2. THE Intro_Screen SHALL render a subheading stating the research goal of increasing trust in the autonomous system.
3. THE Intro_Screen SHALL render a labeled image region sized for a hero illustration of the AeroDrive.
4. WHEN the hero illustration file is not present, THE Intro_Screen SHALL render a visible placeholder block of the same dimensions with alt text describing the intended image.
5. THE Intro_Screen SHALL render a primary call-to-action button labeled to begin the Onboarding Stage.
6. WHEN the End_User activates the primary call-to-action button on the Intro_Screen, THE Stage_Controller SHALL advance the active Step index to the first Step of the Onboarding Stage.

### Requirement 4: Persistent Skippable Timeline

**User Story:** As a Presenter, I want a persistent timeline with filled and unfilled circles, so that I can skip any sub-flow during a live industry demo and return to any prior Step on demand.

#### Acceptance Criteria

1. THE Timeline SHALL render one Node per Step in the global Step sequence, in order, connected by a single horizontal line.
2. THE Timeline SHALL remain visible on every Stage including Intro and Summary.
3. WHEN the active Step index is N, THE Timeline SHALL render Nodes with index less than or equal to N in the filled visual state and Nodes with index greater than N in the unfilled visual state.
4. WHEN the active Step index is N, THE Timeline SHALL render the Node at index N with a distinct active visual state that is distinguishable from both filled and unfilled states.
5. WHEN the Presenter clicks any Node, THE Stage_Controller SHALL set the active Step index to the index of the clicked Node, regardless of whether the clicked Node is before, at, or after the current active Step.
6. THE Timeline SHALL render a visible label or tooltip for each Node that names the Stage and the Step.
7. WHEN the Presenter focuses a Node using the keyboard and presses Enter or Space, THE Stage_Controller SHALL set the active Step index to the index of the focused Node.
8. THE Timeline SHALL expose each Node as a keyboard-focusable control in the global Step sequence order.

### Requirement 5: Synchronized Dual-Display Rendering

**User Story:** As an End_User, I want the steering cluster and the infotainment tablet to always reflect the same narrative moment, so that the two displays feel like one coordinated vehicle rather than two separate screens.

#### Acceptance Criteria

1. THE Dual_Display SHALL render the Dashboard_Cluster on the left half and the Infotainment_Tablet on the right half of the viewport at all times.
2. WHEN the active Step index changes, THE Stage_Controller SHALL update the Dashboard_Cluster content and the Infotainment_Tablet content to the content defined for the new Step before the next animation frame completes.
3. THE Dashboard_Cluster and the Infotainment_Tablet SHALL render content that is defined by the same active Step index at all times.
4. WHEN a transition animation runs between two Steps, THE Animation_Controller SHALL start the Dashboard_Cluster transition and the Infotainment_Tablet transition within the same animation frame.
5. WHEN the active Step defines a shared timed event, THE Dashboard_Cluster and the Infotainment_Tablet SHALL both respond to the event within 100 milliseconds of each other.

### Requirement 6: Light-Mode Design System

**User Story:** As an End_User, I want a calm light-mode interface, so that the Showcase feels premium, approachable, and easy to read in well-lit demo environments.

#### Acceptance Criteria

1. THE Theme_System SHALL define a named set of color tokens for background surfaces, foreground text, primary accent, success, warning, and critical states in light-mode values.
2. THE Theme_System SHALL apply the light-mode color tokens as the default theme on initial load of the Showcase_App.
3. THE Theme_System SHALL render body text on its paired background surface at a Contrast_Ratio of at least 4.5 to 1.
4. THE Theme_System SHALL render large text and primary call-to-action labels on their paired background surface at a Contrast_Ratio of at least 3.0 to 1.
5. THE Theme_System SHALL define typography tokens for display, heading, body, and caption sizes and apply the tokens consistently across all Stages.
6. THE Theme_System SHALL define spacing tokens on a single scale and apply the tokens consistently across all Stages.
7. THE Theme_System SHALL define elevation tokens for the Dashboard_Cluster surface, the Infotainment_Tablet surface, and the Timeline surface.

### Requirement 7: Animated Stage and Step Transitions

**User Story:** As an End_User, I want smooth coordinated animations between steps, so that the Showcase feels polished and the two displays feel physically connected.

#### Acceptance Criteria

1. WHEN the active Step index changes, THE Animation_Controller SHALL play a transition animation on both the Dashboard_Cluster and the Infotainment_Tablet.
2. THE Animation_Controller SHALL complete every Step-to-Step transition animation within 600 milliseconds.
3. THE Animation_Controller SHALL use a single named easing curve for all forward Step transitions and a single named easing curve for all backward Step transitions.
4. WHEN the active Step index changes by more than one position in a single skip action, THE Animation_Controller SHALL play a single transition animation to the Skip_To_Target rather than one animation per intermediate Step.
5. WHEN the active Stage changes, THE Animation_Controller SHALL play a Stage-entry animation on the Timeline that visually confirms the new Stage.
6. WHERE the End_User has enabled the operating system reduced-motion preference, THE Animation_Controller SHALL replace transition animations with an instantaneous content swap.
7. WHEN a transition animation is running and the Presenter triggers another navigation, THE Animation_Controller SHALL cancel the running animation and start the new transition from the current visual state.

### Requirement 8: Improved Onboarding Stage

**User Story:** As an End_User, I want the onboarding Steps to be clearer and less demanding than the original prototype, so that I can follow the narrative without cognitive overload during a live demo.

#### Acceptance Criteria

1. THE Onboarding_Module SHALL present exactly six Steps in this order: profile setup, comfort configuration, location presets, drive explanation, takeover drill, drive preferences.
2. Each Onboarding Step SHALL render a Step title, a one-sentence Step purpose, and a primary action control on the Infotainment_Tablet.
3. Each Onboarding Step SHALL render a matching status indicator on the Dashboard_Cluster that names the Step currently in progress.
4. WHEN the takeover-drill Step begins, THE Onboarding_Module SHALL render a labeled countdown timer on both the Dashboard_Cluster and the Infotainment_Tablet.
5. WHEN the End_User completes the primary action on an Onboarding Step, THE Onboarding_Module SHALL render a visible completion confirmation before the next Step becomes active.
6. WHERE voice interaction is configured for an Onboarding Step, THE Onboarding_Module SHALL also accept an equivalent on-screen control so the Presenter can advance the Step without voice input.
7. THE Onboarding_Module SHALL label at least one Trust_Moment within each Onboarding Step that explains how the Step builds trust in the autonomous system.

### Requirement 9: Driving Stage Scenarios

**User Story:** As an End_User, I want driving scenarios that demonstrate how the autonomous system behaves and communicates during driving, so that I can evaluate whether the behavior earns my trust.

#### Acceptance Criteria

1. THE Driving_Module SHALL present at least three Steps in this order: unmapped-zone takeover, escalating fatigue protocol, dynamic battery management.
2. WHEN a Driving Step begins, THE Driving_Module SHALL render the scenario title and the autonomous system intent on the Infotainment_Tablet.
3. WHEN a Driving Step begins, THE Driving_Module SHALL render the current vehicle speed, autonomy level, and alert state on the Dashboard_Cluster.
4. WHEN the unmapped-zone takeover Step requires driver action, THE Driving_Module SHALL render a labeled takeover prompt simultaneously on the Dashboard_Cluster and the Infotainment_Tablet.
5. WHEN the fatigue-protocol Step escalates, THE Driving_Module SHALL render a visibly distinct alert state on the Dashboard_Cluster for each escalation level.
6. WHEN the battery-management Step presents a reroute choice, THE Driving_Module SHALL render the choice options on the Infotainment_Tablet with a labeled default option.
7. THE Driving_Module SHALL label at least one Trust_Moment within each Driving Step that explains how the Step builds trust in the autonomous system.

### Requirement 10: Riding Stage Scenarios

**User Story:** As an End_User, I want riding scenarios that demonstrate what the autonomous system does for me as a passenger, so that I can evaluate whether handing over control feels worthwhile.

#### Acceptance Criteria

1. THE Riding_Module SHALL present at least three Steps covering environmental feedback, maneuver warning, and productive-time use.
2. WHEN a Riding Step begins, THE Riding_Module SHALL render a passenger-mode indicator on the Dashboard_Cluster.
3. WHEN the environmental-feedback Step begins, THE Riding_Module SHALL render an ambient status summary on the Infotainment_Tablet.
4. WHEN the maneuver-warning Step begins, THE Riding_Module SHALL render a labeled upcoming-maneuver preview on the Infotainment_Tablet at least three seconds before the maneuver event on the Dashboard_Cluster.
5. WHEN the productive-time Step begins, THE Riding_Module SHALL render a labeled in-ride activity surface on the Infotainment_Tablet.
6. THE Riding_Module SHALL label at least one Trust_Moment within each Riding Step that explains how the Step builds trust in the autonomous system.

### Requirement 11: Summary Stage

**User Story:** As a Presenter, I want a closing summary Step, so that industry professionals leave the demo with a clear recap of the trust-building moments shown.

#### Acceptance Criteria

1. THE Summary_Module SHALL present exactly one Step as the final Step of the global Step sequence.
2. THE Summary_Module SHALL render a list of every Trust_Moment labeled by the Onboarding_Module, the Driving_Module, and the Riding_Module during the session.
3. THE Summary_Module SHALL render the research goal statement on the Infotainment_Tablet.
4. THE Summary_Module SHALL render a control that returns the active Step index to the first Step of the Intro Stage.

### Requirement 12: Keyboard and Pointer Navigation

**User Story:** As a Presenter, I want to advance, retreat, and skip Steps with both keyboard and pointer, so that I can run the Showcase confidently from a laptop on stage.

#### Acceptance Criteria

1. WHEN the Presenter presses the Right Arrow key, THE Stage_Controller SHALL advance the active Step index by one, subject to the end-of-sequence rule in Requirement 2.
2. WHEN the Presenter presses the Left Arrow key, THE Stage_Controller SHALL retreat the active Step index by one, subject to the start-of-sequence rule in Requirement 2.
3. WHEN the Presenter presses a digit key from 1 through the count of Stages, THE Stage_Controller SHALL set the active Step index to the first Step of the Stage at that position.
4. THE Showcase_App SHALL render a visible primary advance control on every Step except the final Summary Step.
5. THE Showcase_App SHALL render a visible retreat control on every Step except the first Intro Step.
6. IF the Presenter triggers an advance action on the final Summary Step, THEN THE Stage_Controller SHALL keep the active Step index unchanged and render a visible end-of-showcase indicator.

### Requirement 13: Deep-Link State Routing

**User Story:** As a Presenter, I want the current Step reflected in the URL, so that I can bookmark or share a specific Step for rehearsal.

#### Acceptance Criteria

1. WHEN the active Step index changes, THE State_Router SHALL update the URL hash to a canonical fragment that encodes the Stage name and the Step name.
2. WHEN the Showcase_App loads with a URL hash that encodes a valid Stage and Step pair, THE State_Router SHALL set the active Step index to the Step encoded by the hash before the first render.
3. IF the URL hash encodes a Stage or Step that is not defined, THEN THE State_Router SHALL set the active Step index to the first Step of the Intro Stage and render a non-blocking message naming the invalid fragment.
4. WHEN the Presenter uses the browser back or forward control, THE State_Router SHALL set the active Step index to the Step encoded by the resulting URL hash.
5. FOR every active Step index, encoding the Step index to a hash fragment and decoding the hash fragment back to a Step index SHALL produce the original Step index (round-trip property).

### Requirement 14: Research-Goal Framing

**User Story:** As a course evaluator, I want the research goal to be visible throughout the Showcase, so that the narrative remains anchored to the stated trust objective.

#### Acceptance Criteria

1. THE Showcase_App SHALL render the research goal statement on the Intro_Screen and on the Summary Stage.
2. THE Showcase_App SHALL label each Trust_Moment with a consistent visual marker that names the moment as a trust-building element.
3. THE Showcase_App SHALL expose a cumulative count of Trust_Moments encountered so far on the Timeline or on a Timeline-adjacent surface.
4. WHEN the active Step index advances past a Step that contains a Trust_Moment, THE Showcase_App SHALL increment the cumulative Trust_Moment count by the number of Trust_Moments in that Step.
5. WHEN the Presenter skips backward past a Step that has already been counted, THE Showcase_App SHALL keep the cumulative Trust_Moment count unchanged.

### Requirement 15: No Dead-End Navigation

**User Story:** As a Presenter, I want to always be able to reach any Step from any other Step, so that the Showcase never traps the demo in an unrecoverable state.

#### Acceptance Criteria

1. FOR any two Steps A and B in the global Step sequence, the Showcase_App SHALL make Step B reachable from Step A through a finite sequence of Timeline, advance, and retreat actions.
2. THE Showcase_App SHALL render the Timeline, the advance control, and the retreat control in a non-occluded position on every Step, subject to the end-of-sequence and start-of-sequence rules in Requirement 2.
3. IF a transition animation fails to complete, THEN THE Stage_Controller SHALL set the Dual_Display to the content of the target Step without the animation and mark the transition as completed.

### Requirement 16: Performance and Startup

**User Story:** As a Presenter, I want the Showcase_App to start quickly on a typical laptop, so that live demos begin without awkward waits.

#### Acceptance Criteria

1. WHEN the Showcase_App is loaded from `showcase/index.html` on a static file server on a typical laptop, THE Showcase_App SHALL render the Intro_Screen within 2 seconds of the initial HTML response.
2. WHEN the active Step index changes, THE Stage_Controller SHALL render the new Step content within 200 milliseconds on a typical laptop.
3. THE Showcase_App SHALL maintain an animation frame rate of at least 50 frames per second during Step transitions on a typical laptop.
