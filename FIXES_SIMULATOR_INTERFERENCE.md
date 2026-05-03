# Simulator Interference & Fatigue Beeping Fixes

## Issues Fixed

### 1. ✅ Onboarding Interfering with Driving Simulator
**Problem**: When switching to the driving simulator, the onboarding script.js continued running in the background, causing:
- Voice recognition from onboarding still active
- Text-to-speech announcements overlapping
- Microphone conflicts between two systems

**Solution**: 
- Added state tracking in `index.html` to detect which mode is active
- Modified `toggleMic()` and `speak()` functions in `script.js` to check if onboarding is active
- When switching to simulator mode:
  - Stop onboarding voice recognition
  - Cancel any ongoing speech synthesis
  - Prevent onboarding voice features from activating

**Files Modified**:
- `index.html` - Added `window.isOnboardingActive()` function
- `script.js` - Added checks in `toggleMic()` and `speak()` functions

### 2. ✅ Fatigue Beeping Stops After First Alert
**Problem**: In the fatigue detection scenario, the jarring buzzer only played once at the beginning of escalation, but should continue beeping to try to wake the drowsy driver until they grip the wheel or SOS is triggered.

**Solution**:
- Added `beepInterval` property to the fatigue scenario
- Implemented continuous beeping every 2.5 seconds during escalation
- Added `stopBeeping()` method to cleanly stop the beeping
- Integrated beeping cleanup in:
  - `handleUserGrip()` - stops when user takes control
  - `resetSystem()` - stops when system is reset
  - Timeout handler - stops when SOS is triggered

**Files Modified**:
- `driving_prototype/app.js` - Updated fatigue scenario with continuous beeping

## Technical Details

### Onboarding State Management
```javascript
// In index.html
window.isOnboardingActive = function() { return onboardingActive; };

// In script.js
function speak(text) {
    // Don't speak when simulator is active
    if (typeof window.isOnboardingActive === 'function' && !window.isOnboardingActive()) {
        return;
    }
    // ... rest of function
}
```

### Continuous Beeping Implementation
```javascript
'fatigue': {
    beepInterval: null,
    escalate: function () {
        // Start continuous beeping
        this.beepInterval = setInterval(() => {
            AudioEngine.buzzerJarring();
        }, 2500); // Every 2.5 seconds
        
        AudioEngine.buzzerJarring(); // First beep immediately
        // ... rest of escalation logic
    },
    stopBeeping: function () {
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
    }
}
```

## Testing Instructions

### Test 1: Simulator Isolation
1. Open http://localhost:8000/
2. Start in onboarding mode
3. Enable microphone (say "next" to test voice)
4. Switch to "Driving simulator" tab
5. **Expected**: No more onboarding voice announcements
6. Click "Fatigue" scenario in simulator
7. **Expected**: Only simulator audio plays, no onboarding interference

### Test 2: Continuous Fatigue Beeping
1. Open http://localhost:8000/?sim=1 (start in simulator)
2. Click "Fatigue" scenario in sidebar
3. Wait 4 seconds for escalation
4. **Expected**: Jarring buzzer plays immediately
5. **Expected**: Buzzer continues every 2.5 seconds
6. Press and hold "GRIP STEERING WHEEL" button
7. **Expected**: Beeping stops immediately when control is secured
8. **Expected**: Confirmation chime plays

### Test 3: Beeping Cleanup on Reset
1. Trigger fatigue scenario
2. Let beeping start
3. Click "Reset System" button
4. **Expected**: Beeping stops immediately
5. **Expected**: System returns to autonomous mode cleanly

### Test 4: Beeping Stops on SOS Timeout
1. Trigger fatigue scenario
2. Let beeping start
3. Do NOT grip the wheel
4. Wait for 10-second countdown to reach 0
5. **Expected**: Beeping stops when "SOS ACTIVE" appears
6. **Expected**: Vehicle speed drops to 0

## Behavior Summary

| Scenario | Beeping Pattern | Stops When |
|----------|----------------|------------|
| **Takeover** | Single alert chime | N/A (no continuous beeping) |
| **Fatigue Stage 1** | Single soft chime | User responds or 4s timeout |
| **Fatigue Stage 2** | Continuous jarring buzzer every 2.5s | User grips wheel, SOS triggered, or system reset |
| **Battery** | Single alert chime | N/A (no continuous beeping) |
| **Touring** | Single info chime | N/A (no continuous beeping) |

## Design Rationale

### Why Continuous Beeping for Fatigue?
- **Safety-critical**: Drowsiness is life-threatening
- **Escalating urgency**: Soft alert → jarring continuous alarm
- **Real-world behavior**: Actual vehicles use persistent alarms for driver unresponsiveness
- **User feedback**: Matches expectation that system tries harder to wake driver

### Why 2.5 Second Interval?
- Buzzer tone duration: 2 seconds
- Small gap (0.5s) prevents audio overlap
- Frequent enough to be urgent
- Not so fast that it becomes a single continuous tone

### Why Stop on Grip?
- Immediate feedback that user action was successful
- Prevents annoying continuation after control is secured
- Allows confirmation chime to be heard clearly

## Files Changed

1. **index.html**
   - Added onboarding state tracking
   - Stop voice/TTS when switching to simulator

2. **script.js**
   - Added checks to prevent onboarding features in simulator mode
   - Modified `toggleMic()` and `speak()` functions

3. **driving_prototype/app.js**
   - Added `beepInterval` to fatigue scenario
   - Implemented continuous beeping logic
   - Added `stopBeeping()` cleanup method
   - Integrated cleanup in grip handler and reset

## Known Limitations

- Beeping interval is fixed at 2.5 seconds (could be made configurable)
- No escalation in beep frequency (could increase urgency over time)
- Browser tab must be active for audio to play (browser limitation)

## Future Enhancements

- [ ] Escalating beep frequency (faster as time runs out)
- [ ] Different beep patterns for different urgency levels
- [ ] Haptic feedback simulation (vibration API)
- [ ] Visual pulse synchronized with audio beeps

---

**Status**: ✅ Both issues resolved
**Tested**: May 4, 2026
**Server**: http://localhost:8000/
