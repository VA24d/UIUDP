s# Tasks — Showcase Final Polish

## Task List

- [ ] 1. Fix battery choice card interactions (driving.js)
  - [ ] 1.1 Add click handler to "Reroute to nearest charger" card that triggers reroute animation (route-animating class on detour path, poi-pulse-active on charger pin, "Rerouting..." in ETA slot) then calls controller.advance() after 1500ms
  - [ ] 1.2 Add click handler to "Continue on planned route" card that shows "Low-power mode armed" confirmation in ETA slot then calls controller.advance() after 800ms
  - [ ] 1.3 Add CSS classes: .route-animating (stroke-dashoffset animation), .poi-pulse-active (scale pulse), .choice-card.is-selected (highlight), .choice-card.is-dimmed (fade)
- [ ] 2. Fix voice service auto-start (voice.js)
  - [ ] 2.1 Remove the `startListening()` call at the end of createVoiceService() initialization
  - [ ] 2.2 Ensure the mic toggle button click (user gesture) remains the entry point for starting recognition
  - [ ] 2.3 Verify voice bar shows "Mic off — tap to listen" on boot
- [ ] 3. Enhance riding cluster panels (riding.js)
  - [ ] 3.1 Create buildMiniPerceptionSVG() helper that renders a compact perception radar with 3-4 bounding boxes, ego vehicle, and range arc
  - [ ] 3.2 Update renderEnvironmentCluster() to include mini radar, speed, passenger mode pill, and safe-zone bar
  - [ ] 3.3 Update renderManeuverClusterQuiet() and renderManeuverClusterEvent() to include mini radar, speed, passenger mode pill, and safe-zone bar
  - [ ] 3.4 Update renderProductiveCluster() to include mini radar, speed, passenger mode pill, and safe-zone bar
  - [ ] 3.5 Add .cluster-mini-radar CSS for sizing the mini SVG in the cluster panel
- [ ] 4. Add hold-to-grip mechanic to driving unmapped-zone (driving.js)
  - [ ] 4.1 Replace the simple "Grip wheel" button in the unmapped-zone takeover prompt with the full grip mechanic: grip-button with grip-fill progress bar, countdown ring SVG, tactile wheel icon, and "Press and hold (or spacebar)" caption
  - [ ] 4.2 Implement startGrip/releaseGrip/animateGrip functions (2500ms hold duration) matching the onboarding drill pattern
  - [ ] 4.3 Add spacebar keydown/keyup support with proper event cleanup on stepWillChange
  - [ ] 4.4 On grip completion (100%), call controller.advance() and show brief success state
  - [ ] 4.5 Add tactile pulse animation classes (tactile-pulse-1hz/2hz/3hz) to the wheel icon, escalating as countdown decreases
- [ ] 5. Add phase transition cards (registry.js + driving.js + riding.js)
  - [ ] 5.1 Add 'driving.intro' step descriptor to DEFAULTS in registry.js between onboarding.preferences and driving.unmapped-zone with stage='driving', slug='intro'
  - [ ] 5.2 Add 'riding.intro' step descriptor to DEFAULTS in registry.js between driving.weather and riding.environment with stage='riding', slug='intro'
  - [ ] 5.3 Create renderTransitionCard(host, { phase, title, description, icon }, controller) utility function that renders a centered transition card with auto-advance (3s) and click-to-skip
  - [ ] 5.4 Add driving.intro renderers in driving.js: cluster shows "TRANSITIONING" state, tablet shows "Entering Driving Mode" card with description "Experience how AeroDrive handles real-world driving scenarios"
  - [ ] 5.5 Add riding.intro renderers in riding.js: cluster shows "TRANSITIONING" state, tablet shows "Entering Passenger Mode" card with description "See how AeroDrive keeps you informed as a passenger"
  - [ ] 5.6 Add .transition-card CSS: centered layout, large title, fade-in animation, skip button styling
  - [ ] 5.7 Wire the new steps into makeDrivingSteps() and makeRidingSteps() exports so they appear in the registry overrides
