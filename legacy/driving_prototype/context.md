```
## 1. Project Overview
This project focuses on the UX/UI design of a Level 4/5 Autonomous Vehicle interface, prioritizing system transparency, cognitive load reduction, and driver trust. The interaction model uses a **Dual-Display Architecture** (HUD for critical data; Center Tablet for context/reasoning) paired heavily with **Multimodal Feedback** (Voice, Chimes, and Haptics).

## 2. Information Architecture: Use Cases & Scenarios
The system is categorized into 5 broad Use Cases, yielding 10 distinct interactive scenarios:

*   **UC 1: Context-Aware Routing (External/Internal Factors)**
    *   *1A:* Recommended stops (rest/dining) based on journey length.
    *   *1B:* Live routing adjustments based on weather/congestion.
    *   *1C:* Dynamic Battery Prediction (rerouting before entering a "charging desert").
*   **UC 2: Personalized Routing (User Patterns)**
    *   *2A:* Habitual suggestions (e.g., morning vs. evening routes, usual tea stops).
*   **UC 3: Touring & Journey Guide (Voice-First)**
    *   *3A:* Active engagement (car shares trivia/info about passing sights).
    *   *3B:* Interactive exploration (user converses with the car about surroundings).
*   **UC 4: Take-Over Requests (System Limits)**
    *   *4A:* Poor weather necessitating manual control.
    *   *4B:* Unmapped zones / construction sites requiring human navigation.
*   **UC 5: Fatigue & Emergency Handling**
    *   *5A:* Fatigue detection with escalating alerts.
    *   *5B:* Unresponsive driver protocol (MRM, SOS engagement).

## 3. Chosen Scenarios & Engineered Task Flows
For the current prototype, three high-priority safety scenarios were fully detailed and coded.

**Scenario 1: Unmapped Zone Take-Over (4B)**
*   **Trigger:** System detects construction/unmapped zone.
*   **System Action:** Calculates a 5-8 second cognitive buffer based on speed. HUD displays "EYES ON ROAD." Tablet dims background map, highlights the zone, and displays a "TAKE MANUAL CONTROL" modal with the exact reason. A warning chime plays.
*   **User Action (Intentionality):** User must grip the wheel *and* perform a specific action (squeeze/button combo) to prove consciousness. Simple bumps are ignored.
*   **Resolution:** If confirmed, a positive chime plays and mode switches to Manual. If the timer hits zero, the Minimum Risk Maneuver (MRM) engages (hazards, safe pullover, doors unlock).

**Scenario 2: Escalating Fatigue Protocol (5A/5B)**
*   **Trigger:** Sensors detect eye closure or unresponsiveness.
*   **System Action:** *Crucial Safety Logic:* If in Manual mode, the car forces an emergency override to Autonomous mode instantly. 
*   **Escalation:** 
    *   *Stage 1:* Soft chime + voice prompt ("Are you awake?").
    *   *Stage 2 (No response):* Jarring buzzer, HUD flashes "WAKE UP," physical seat jerks/steering vibration, cabin lights strobe red. 10s SOS countdown begins on Tablet.
*   **Resolution:** User must perform the "squeeze" combo to cancel SOS. Car will suggest pulling over. If 0s is reached, MRM engages and emergency services are dialed.

**Scenario 3: Dynamic Battery Management (1C)**
*   **Trigger:** Predictive algorithm detects range will not cover the distance to the next charger if the user continues onto an upcoming highway.
*   **System Action:** HUD shows Critical Range. Tablet shows "Recommended Stop" modal with a reroute path. Voice assistant asks to reroute.
*   **User Action:** User can accept (via voice/touch) or ignore.
*   **Resolution:** If accepted, car reroutes and enters Low Power Mode. If ignored, the car *forces* Low Power Mode anyway (dimming ambient lights, cutting AC) as a safety guardrail and displays a persistent "Stall Imminent" warning.

## 4. Core Design Decisions
*   **Visual Hierarchy:** The HUD (dashboard cluster) strictly displays State/Safety data (Speed, Mode, Urgent warnings). The Tablet houses context, maps, and conversational interfaces.
*   **Design Tokens:** Dark Mode (Charcoal) for reduced glare. Cyan = Active/Normal, Amber = Warning, Crimson = Critical Emergency.
*   **Safety via "Intentionality":** Handovers cannot happen accidentally. The physical "Squeeze" UI ensures the driver is alert.
*   **Multimodal Proxies:** Because the prototype is digital, hardware is simulated visually (e.g., full-screen red opacity flashes simulate cabin strobe lights; shaking CSS elements simulate haptics).

## 5. Prototype Expansion & Attention to Detail
To expand the current HTML/JS "God-View" simulator into the final 10-scenario product, the following guidelines must be strictly adhered to:

**A. Visual & Interface Upgrades**
*   **Fidelity:** Replace CSS tricks with high-fidelity exported assets (e.g., exact Figma SVGs for dials, Mapbox GL for moving maps).
*   **Fluidity:** Implement CSS transitions for all modals (slide-ups) and JS interpolation for telemetry (e.g., speed visually ticking down to 0 during an MRM instead of snapping).

**B. Logic & Task Flow Expansion**
*   **Extensibility:** Add the remaining 7 scenarios to the `Scenarios` JavaScript dictionary using the established `execute()` pattern.
*   **Voice Integration:** Expand the `VoiceEngine` (Web Speech Recognition API) to parse natural language for the "Touring" use cases (3A/3B), allowing two-way dialogue rather than just trigger commands.

**C. Attention to Detail for Future Flows**
When mapping out the remaining task flows, ensure:
1.  **Zero HUD Clutter:** Never place non-critical data (like "New Cafe Opened") on the HUD.
2.  **No Dead Ends:** Every alert must have a clear "Zero-Second" fallback (What happens if the user does nothing?).
3.  **Multimodal Redundancy:** Every state change must be communicated via at least two senses (Visual + Audio, or Visual + Haptic).
```